import http from 'k6/http';
import { check, group, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';
import { SharedArray } from 'k6/data';
import exec from 'k6/execution';

const API_BASE_URL = __ENV.API_BASE_URL || 'https://apiv4-gov2.cls.vn';
const WEB_BASE_URL = __ENV.WEB_BASE_URL || 'https://testgov2.cls.vn';
const COURSE_ID = __ENV.COURSE_ID || '175';
const COURSE_CONTENT_ID = __ENV.COURSE_CONTENT_ID || '4117';
const TOPIC_ID = __ENV.TOPIC_ID || '6';
const ROLE_ID = __ENV.ROLE_ID || '4';
const DETAIL_USER_ID = __ENV.DETAIL_USER_ID || '128194';
const START_DATE = __ENV.START_DATE || '2026-04-27';
const END_DATE = __ENV.END_DATE || '2026-06-07';
const EXECUTOR = __ENV.EXECUTOR || 'shared-iterations';
const VUS = Number(__ENV.VUS || '5');
const ITERATIONS = Number(__ENV.ITERATIONS || '50');
const DURATION = __ENV.DURATION || '1m';
const MAX_DURATION = __ENV.MAX_DURATION || '5m';
const INCLUDE_DISABLED_JMETER_SAMPLERS = (__ENV.INCLUDE_DISABLED_JMETER_SAMPLERS || 'false') === 'true';
const INCLUDE_PREFLIGHT_OPTIONS = (__ENV.INCLUDE_PREFLIGHT_OPTIONS || 'false') === 'true';

/*
 * ENABLED_APIS – comma-separated list of API IDs sent from the dashboard.
 *   • undefined  → null  → all APIs run (original behaviour)
 *   • ""         → []    → only login runs
 *   • "__NONE__" → []            → no APIs run (login only)
 *   • "a,b,c"   → ["a","b","c"] → only those APIs run
 */
const ENABLED_APIS_RAW = __ENV.ENABLED_APIS;
const ENABLED_APIS = ENABLED_APIS_RAW != null
  ? (ENABLED_APIS_RAW === '__NONE__' ? [] : ENABLED_APIS_RAW.split(',').map(s => s.trim()).filter(s => s))
  : null;

/**
 * Returns true when the API identified by `id` should execute.
 * When ENABLED_APIS is set (dashboard), only listed IDs run.
 * When ENABLED_APIS is NOT set (CLI), all APIs run except group-05
 * which still respects INCLUDE_DISABLED_JMETER_SAMPLERS.
 */
function isEnabled(id) {
  if (ENABLED_APIS !== null) return ENABLED_APIS.includes(id);
  if (id.startsWith('dis-')) return INCLUDE_DISABLED_JMETER_SAMPLERS;
  return true;
}

const USER_START = Number(__ENV.USER_START || '101430');
const USER_END = Number(__ENV.USER_END || '101990');

const USE_EXCEL = __ENV.USE_EXCEL === 'true';
const USE_SAVED_TOKENS = __ENV.USE_SAVED_TOKENS === 'true';
const K6_DASHBOARD_URL = __ENV.K6_DASHBOARD_URL || 'http://localhost:3000';

const excelUsers = new SharedArray('excel users', () => {
  if (USE_EXCEL) {
    try {
      return JSON.parse(open('./users_data.json'));
    } catch (e) {
      console.log('Error opening users_data.json: ' + e.message);
      return [];
    }
  }
  return [];
});

// Load token cache from file (NOT via HTTP) — avoids localhost connection issues with high VUs
let tokensCacheMap = {};
if (USE_SAVED_TOKENS) {
  try {
    tokensCacheMap = JSON.parse(open('./tokens_cache.json'));
  } catch (e) {
    console.log('tokens_cache.json not found or empty — will login fresh');
  }
}

const users = new SharedArray('testgov2 users', () => {
  const values = [];
  for (let user = USER_START; user <= USER_END; user += 1) {
    values.push(String(user));
  }
  return values;
});

const loginFailures = new Rate('login_failures');
const apiFailures = new Rate('api_failures');
const requestDuration = new Trend('testgov2_request_duration');
const completedApiCalls = new Counter('testgov2_api_calls');

// Danh sách các API để tự động cấu hình threshold nhằm xuất dữ liệu thống kê chi tiết từng API
const trackedApis = [
  'POST /api/user/login',
  'GET /api/ExperienceUser/get-roll-call',
  'GET /api/course/get-detail',
  'GET /api/user/get-detail-user',
  'GET /api/course/get-course-evaluation-criteria',
  'GET /api/course/get-general-evaluation',
  'GET /api/course/get-paging-user-evaluation',
  'GET /api/course/check-user-exist',
  'GET /api/coursecontent/list-user-content-by-courseId',
  'GET /api/topic/get-by-id',
  'GET /api/course/get-document',
  'GET /api/user/basic',
  'GET /api/User/get-list-contact',
  'GET /api/VersionReleases/get-paging',
  'POST /api/User/login-log',
  'GET /api/menu/get-menu-by-role',
  'GET /api/CourseUser/my-courses',
  'GET /api/Notification/count-noti-unseen',
  'GET /api/Topic/get-information-topic',
  'GET /api/course/learner/get-paging',
  'GET /api/learner/check-course-require',
  'GET /api/learner/get-course-proficiency-require',
  'GET /api/Learner/list-my-course',
  'GET /api/user/get-info-user-by-ids',
  'GET /api/learner/get-course-content-detail',
  'POST /api/learner/set-complete-course-content-basic',
  'GET /api/Course/get-list-course-by-ids',
  'GET /api/certification/get-certification-user',
  'POST /api/learner/update-course-content-user',
  'GET /api/proficiency/get-by-course-id',
  'PATCH /api/examtest/start-exam',
  'POST /api/examtest/set-answer-question'
];

const dynamicThresholds = {
  login_failures: ['rate<0.10'],
  api_failures: ['rate<0.10'],
  // Exclude internal dashboard calls (save-token, etc.) from global metrics
  'http_req_failed{name!~"internal:.*"}': ['rate<0.10'],
  // testgov2_request_duration: JavaScript-level timing (includes overhead)
  testgov2_request_duration: ['p(95)<5000'],
  // http_req_waiting = TTFB = pure server processing time (most accurate)
  'http_req_waiting{name!~"internal:.*"}': ['p(95)<5000'],
};

// Đăng ký thresholds giả cho mỗi API để k6 xuất thông tin chi tiết của API đó vào kết quả JSON
trackedApis.forEach(api => {
  dynamicThresholds[`http_req_duration{name:${api}}`] = ['p(95)<600000'];
  // Server processing time per API (TTFB)
  dynamicThresholds[`http_req_waiting{name:${api}}`] = ['p(95)<600000'];
  dynamicThresholds[`http_reqs{name:${api}}`] = ['count>=0'];
  dynamicThresholds[`http_req_failed{name:${api}}`] = ['rate<=1.0'];
});

export const options = {
  scenarios: {
    jmeter_thread_group: buildScenario(),
  },
  thresholds: dynamicThresholds,
  insecureSkipTLSVerify: true,
  summaryTrendStats: ['avg', 'min', 'med', 'max', 'p(90)', 'p(95)', 'p(99)'],
};

function buildScenario() {
  if (EXECUTOR === 'constant-vus') {
    return {
      executor: 'constant-vus',
      vus: VUS,
      duration: DURATION,
      gracefulStop: __ENV.GRACEFUL_STOP || '10s',
    };
  }

  let finalIterations = ITERATIONS;
  if (USE_EXCEL && excelUsers.length > 0) {
    if (finalIterations > excelUsers.length) {
      console.log(`Capping iterations from ${finalIterations} to ${excelUsers.length} due to Excel user count`);
      finalIterations = excelUsers.length;
    }
    if (finalIterations < VUS) {
      finalIterations = VUS;
    }
  }

  return {
    executor: 'shared-iterations',
    vus: VUS,
    iterations: finalIterations,
    maxDuration: MAX_DURATION,
  };
}

const browserHeaders = {
  'Accept': 'application/json, text/plain, */*',
  'Accept-Language': 'en-US,en;q=0.9',
  'Origin': WEB_BASE_URL,
  'Referer': `${WEB_BASE_URL}/`,
  'Sec-Fetch-Dest': 'empty',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Site': 'same-site',
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:150.0) Gecko/20100101 Firefox/150.0',
};

const jsonHeaders = Object.assign({}, browserHeaders, {
  'Content-Type': 'application/json;charset=utf-8',
});

export default function () {
  let email;
  let password = '123456';
  let userRow = null;

  if (USE_EXCEL && excelUsers.length > 0) {
    if (exec.scenario.iterationInTest >= excelUsers.length) {
      return;
    }
    userRow = excelUsers[exec.scenario.iterationInTest];
    email = userRow.User;
    password = userRow.Pass;
  } else {
    email = users[exec.scenario.iterationInTest % users.length];
  }

  // ★ Login or use saved token
  let token = null;
  if (USE_SAVED_TOKENS) {
    // 1. Try from Excel row (already merged by server)
    if (USE_EXCEL && userRow && userRow.token) {
      token = userRow.token;
    } else {
      // 2. Try from tokens_cache.json (loaded at init, no HTTP needed)
      const searchKey = String(email).trim().toLowerCase();
      if (tokensCacheMap[searchKey]) {
        token = tokensCacheMap[searchKey];
      }
    }
    // If no saved token found, fall back to fresh login
    if (!token) {
      token = group('01 Dangnhap', () => login(email, password));
    }
  } else {
    token = group('01 Dangnhap', () => login(email, password));
  }

  if (!token) {
    // Chỉ tài khoản có token mới được chạy các API ở dưới
    return;
  }

  group('02 ThongtinKhoahoc', () => {
    if (isEnabled('rollcall')) {
      authenticatedGet(token, '/api/ExperienceUser/get-roll-call', {
        startDate: START_DATE,
        endDate: END_DATE,
      });
    }
  });

  group('03 Browser recording - home and course overview', () => {
    runHomeAndCourseOverview(token);
  });

  group('04 Browser recording - course learning detail', () => {
    runCourseLearningDetail(token);
  });

  if (isEnabled('dis-general-eval') || isEnabled('dis-set-complete') || isEnabled('dis-proficiency')) {
    group('05 Disabled JMeter samplers', () => {
      runDisabledJmeterSamplers(token);
    });
  }

  if (USE_EXCEL && userRow) {
    group('06 KythiExcel', () => {
      if (isEnabled('start-exam')) {
        const examineeId = Number(userRow.testLearnerMapId);
        authenticatedPatch(token, '/api/examtest/start-exam', { examineeId });
      }
      if (isEnabled('set-answer')) {
        const body = {
          testCodeId: Number(userRow.testCodeId),
          listData: [
            {
              questionId: Number(userRow.questionId),
              isMark: false,
              listAnswer: [
                {
                  answerId: Number(userRow.answerId),
                  answeredValue: 1
                }
              ]
            }
          ],
          submitId: 2,
          testLearnerMapId: Number(userRow.testLearnerMapId)
        };
        authenticatedPost(token, '/api/examtest/set-answer-question', body);
      }
    });
  }

  sleep(Number(__ENV.SLEEP_SECONDS || '1'));
}

function login(email, password = '123456') {
  const payload = JSON.stringify({
    uuid: 'b354f9d6ce237d2fbc464db85b9947a3',
    email,
    password,
    captcha: '',
  });

  const response = timedRequest('POST', '/api/user/login', payload, { headers: jsonHeaders });
  const passed = check(response, {
    'Dangnhap: HTTP 200': (r) => r.status === 200,
    'Dangnhap: has access token': (r) => Boolean(jsonValue(r, 'data.accessToken')),
  });
  loginFailures.add(!passed);

  if (!passed) {
    // Log lỗi ngay lập tức ra console
    const errMsg = jsonValue(response, 'message') || jsonValue(response, 'error') || '';
    const bodySnippet = response.body ? String(response.body).substring(0, 200) : '';
    console.error(`❌ Login thất bại: ${email} | Status: ${response.status} | ${errMsg || bodySnippet}`);
  }

  const token = jsonValue(response, 'data.accessToken');

  if (token && K6_DASHBOARD_URL) {
    try {
      http.post(`${K6_DASHBOARD_URL}/api/save-token`, JSON.stringify({
        email: email,
        token: token
      }), {
        headers: { 'Content-Type': 'application/json' },
        tags: { name: 'internal:save-token' }
      });
    } catch (e) {
      // Bỏ qua lỗi kết nối nội bộ nếu có
    }
  }

  return token;
}

function runHomeAndCourseOverview(token) {
  if (isEnabled('course-detail')) authenticatedGet(token, '/api/course/get-detail', { id: COURSE_ID });
  if (isEnabled('user-detail')) authenticatedGet(token, '/api/user/get-detail-user', { UserId: '1' });
  if (isEnabled('eval-criteria')) authenticatedGet(token, '/api/course/get-course-evaluation-criteria');
  if (isEnabled('general-eval')) authenticatedGet(token, '/api/course/get-general-evaluation', { roleId: ROLE_ID, courseId: COURSE_ID });
  if (isEnabled('paging-eval')) authenticatedGet(token, '/api/course/get-paging-user-evaluation', {
    courseId: COURSE_ID,
    roleId: ROLE_ID,
    pageNumber: '1',
    pageSize: '4',
  });
  if (isEnabled('check-user-exist')) authenticatedGet(token, '/api/course/check-user-exist', { courseId: COURSE_ID });
  if (isEnabled('list-content')) authenticatedGet(token, '/api/coursecontent/list-user-content-by-courseId', { CourseId: COURSE_ID });
  if (isEnabled('topic-detail')) authenticatedGet(token, '/api/topic/get-by-id', { id: TOPIC_ID });
  if (isEnabled('course-document')) authenticatedGet(token, '/api/course/get-document', { courseId: COURSE_ID });
}

function runCourseLearningDetail(token) {
  if (isEnabled('user-basic')) authenticatedGet(token, '/api/user/basic');
  if (isEnabled('user-contacts')) authenticatedGet(token, '/api/User/get-list-contact', { userId: DETAIL_USER_ID });
  if (isEnabled('version-releases')) authenticatedGet(token, '/api/VersionReleases/get-paging', { name: '', pageNumber: '1', pageSize: '10' });
  if (isEnabled('login-log')) authenticatedPost(token, '/api/User/login-log', { currentDate: new Date().toLocaleString('en-US') });
  if (isEnabled('menu-by-role')) authenticatedGet(token, '/api/menu/get-menu-by-role', { id: ROLE_ID });
  if (isEnabled('my-courses')) authenticatedGet(token, '/api/CourseUser/my-courses', {
    pageNumber: '1',
    pageSize: '12',
    search: '',
    sort: '-date',
  });
  if (isEnabled('noti-count')) authenticatedGet(token, '/api/Notification/count-noti-unseen');
  if (isEnabled('topic-info')) authenticatedGet(token, '/api/Topic/get-information-topic', { TypeId: '2' });
  if (isEnabled('learner-paging')) authenticatedGet(token, '/api/course/learner/get-paging', {
    pageNumber: '1',
    pageSize: '12',
    search: '',
    typeId: '3',
    sort: '-date',
  });
  if (isEnabled('check-require')) authenticatedGet(token, '/api/learner/check-course-require', { CourseId: COURSE_ID });
  if (isEnabled('proficiency-require')) authenticatedGet(token, '/api/learner/get-course-proficiency-require', { CourseId: COURSE_ID });
  if (isEnabled('list-my-course')) authenticatedGet(token, '/api/Learner/list-my-course', { courseId: COURSE_ID });
  if (isEnabled('user-by-ids')) authenticatedGet(token, '/api/user/get-info-user-by-ids', {
    'userIds[]': '1',
    pageSize: '1',
    pageNumber: '1',
  });
  if (isEnabled('content-detail')) authenticatedGet(token, '/api/learner/get-course-content-detail', { courseContentId: COURSE_CONTENT_ID });
  if (isEnabled('set-complete')) authenticatedPost(token, '/api/learner/set-complete-course-content-basic', {
    CourseContentId: Number(COURSE_CONTENT_ID),
    allTimeLearned: 0,
    completeRatio: 100,
  });
  if (isEnabled('course-by-ids')) authenticatedGet(token, '/api/Course/get-list-course-by-ids', { courseIds: COURSE_ID });
  if (isEnabled('certification')) authenticatedGet(token, '/api/certification/get-certification-user', {
    DetailUserId: DETAIL_USER_ID,
    resourceId: COURSE_ID,
    typeId: '1',
  });
  if (isEnabled('update-content')) authenticatedPost(token, '/api/learner/update-course-content-user', {
    id: Number(__ENV.COURSE_CONTENT_USER_ID || '6639164'),
    completeRatio: 100,
    allTimeLearned: 173,
  });
}

function runDisabledJmeterSamplers(token) {
  if (isEnabled('dis-general-eval')) authenticatedGet(token, '/api/course/get-general-evaluation', { roleId: ROLE_ID, courseId: COURSE_ID });
  if (isEnabled('dis-set-complete')) authenticatedPost(token, '/api/learner/set-complete-course-content-basic', {
    CourseContentId: Number(COURSE_CONTENT_ID),
    allTimeLearned: 0,
    completeRatio: 100,
  });
  if (isEnabled('dis-proficiency')) authenticatedGet(token, '/api/proficiency/get-by-course-id', { courseId: COURSE_ID });
}

// -------- HTTP helpers (unchanged) --------

function authenticatedGet(token, path, query = {}) {
  if (INCLUDE_PREFLIGHT_OPTIONS) {
    preflight(path, 'GET', query);
  }
  return timedRequest('GET', path, null, { headers: authHeaders(token), query });
}

function authenticatedPost(token, path, body) {
  if (INCLUDE_PREFLIGHT_OPTIONS) {
    preflight(path, 'POST');
  }
  return timedRequest('POST', path, JSON.stringify(body), { headers: authJsonHeaders(token) });
}

function authenticatedPatch(token, path, body) {
  if (INCLUDE_PREFLIGHT_OPTIONS) {
    preflight(path, 'PATCH');
  }
  return timedRequest('PATCH', path, JSON.stringify(body), { headers: authJsonHeaders(token) });
}

function preflight(path, method, query = {}) {
  return timedRequest('OPTIONS', path, null, {
    headers: Object.assign({}, browserHeaders, {
      'Accept': '*/*',
      'Access-Control-Request-Method': method,
      'Access-Control-Request-Headers': method === 'POST' ? 'authorization,content-type' : 'authorization',
    }),
    query,
  });
}

function timedRequest(method, path, body, params = {}) {
  const url = buildUrl(path, params.query || {});
  const requestParams = Object.assign({ timeout: '30s' }, params);
  delete requestParams.query;

  // Tag each request for per-API metric grouping in reports
  requestParams.tags = Object.assign({}, requestParams.tags || {}, {
    name: method + ' ' + path,
  });

  const started = Date.now();
  const response = method === 'GET'
    ? http.get(url, requestParams)
    : http.request(method, url, body, requestParams);
  requestDuration.add(Date.now() - started);
  completedApiCalls.add(1);

  const passed = check(response, {
    [`${method} ${path}: status is 2xx/3xx`]: (r) => r.status >= 200 && r.status < 400,
    [`${method} ${path}: not unauthorized`]: (r) => r.status !== 401,
  });
  apiFailures.add(!passed);

  if (!passed) {
    console.error(`[API ERROR] ${method} ${path} thất bại với status ${response.status}. Response: ${response.body}`);
  }

  return response;
}

function buildUrl(path, query) {
  const queryString = Object.entries(query)
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&');
  const separator = path.includes('?') ? '&' : '?';
  return queryString ? `${API_BASE_URL}${path}${separator}${queryString}` : `${API_BASE_URL}${path}`;
}

function authHeaders(token) {
  if (!token) {
    return browserHeaders;
  }
  return Object.assign({}, browserHeaders, { 'Authorization': `Bearer ${token}` });
}

function authJsonHeaders(token) {
  if (!token) {
    return jsonHeaders;
  }
  return Object.assign({}, jsonHeaders, { 'Authorization': `Bearer ${token}` });
}

function jsonValue(response, path) {
  try {
    const parsed = JSON.parse(response.body);
    return path.split('.').reduce((value, key) => value && value[key], parsed);
  } catch (error) {
    return undefined;
  }
}

export function setup() {
  console.log('testgov2 k6 script converted from testgov2.jmx');
  console.log(`API base URL: ${API_BASE_URL}`);
  console.log(`Web base URL: ${WEB_BASE_URL}`);
  console.log(`Executor: ${EXECUTOR}`);
  console.log(`VUs: ${VUS}`);
  console.log(EXECUTOR === 'constant-vus' ? `Duration: ${DURATION}` : `Iterations: ${ITERATIONS}`);
  console.log(`Users: ${USER_START} \u2192 ${USER_END} (${USER_END - USER_START + 1} users)`);
  if (ENABLED_APIS !== null) {
    console.log(`Enabled APIs (${ENABLED_APIS.length}): ${ENABLED_APIS.join(', ') || '(none)'}`);
  } else {
    console.log('Enabled APIs: all');
  }
  console.log('Default JMeter Thread Group equivalent: 5 VUs, 50 total iterations.');
  console.log('CSV 1000.csv equivalent: generated users 100001..102000.');
}

export function handleSummary(data) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  
  // Inject execution metadata for UI dashboard to display load test parameters
  data.metadata = {
    apiBaseUrl: API_BASE_URL,
    webBaseUrl: WEB_BASE_URL,
    courseId: COURSE_ID,
    courseContentId: COURSE_CONTENT_ID,
    topicId: TOPIC_ID,
    roleId: ROLE_ID,
    userStart: USER_START,
    userEnd: USER_END,
    sleepSeconds: Number(__ENV.SLEEP_SECONDS || '1'),
    executor: EXECUTOR,
    vus: VUS,
    iterations: EXECUTOR === 'shared-iterations' ? ITERATIONS : null,
    duration: EXECUTOR === 'constant-vus' ? DURATION : null,
    timestamp: new Date().toISOString()
  };

  const jsonStr = JSON.stringify(data);

  return {
    // Text summary + JSON result via stdout (server captures JSON from memory)
    stdout: summaryText(data) + '\n__K6_JSON_START__\n' + jsonStr + '\n__K6_JSON_END__\n',
    // Also write file for history (compact, no pretty-print = 50% smaller + faster)
    [`testgov2_k6/results/testgov2-${timestamp}.json`]: jsonStr,
  };
}

function formatBytes(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / 1048576).toFixed(2) + ' MB';
}

function summaryText(data) {
  const m = data.metrics;
  const lines = [
    '\n========================================',
    'Báo cáo Test Hiệu năng testgov2',
    '========================================',
  ];
  if (m.http_reqs) {
    lines.push(`Tổng request: ${m.http_reqs.values.count}`);
    lines.push(`Request/giây: ${m.http_reqs.values.rate.toFixed(2)}`);
  }
  if (m.iterations) {
    lines.push(`Tổng iterations: ${m.iterations.values.count}`);
  }
  lines.push('────────────────────────────────────────');
  if (m.http_req_duration) {
    const d = m.http_req_duration.values;
    lines.push(`Thời gian TB: ${d.avg.toFixed(2)}ms`);
    lines.push(`Thời gian Min: ${d.min.toFixed(2)}ms`);
    lines.push(`Thời gian Max: ${d.max.toFixed(2)}ms`);
    lines.push(`Thời gian P90: ${d['p(90)'].toFixed(2)}ms`);
    lines.push(`Thời gian P95: ${d['p(95)'].toFixed(2)}ms`);
    if (d['p(99)'] !== undefined) {
      lines.push(`Thời gian P99: ${d['p(99)'].toFixed(2)}ms`);
    }
  }
  // Server Processing Time = TTFB (http_req_waiting)
  if (m.http_req_waiting) {
    const w = m.http_req_waiting.values;
    lines.push('── Thời gian xử lý Server (TTFB) ──');
    lines.push(`Server TB: ${w.avg.toFixed(2)}ms`);
    lines.push(`Server Min: ${w.min.toFixed(2)}ms`);
    lines.push(`Server Max: ${w.max.toFixed(2)}ms`);
    lines.push(`Server P90: ${w['p(90)'].toFixed(2)}ms`);
    lines.push(`Server P95: ${w['p(95)'].toFixed(2)}ms`);
    if (w['p(99)'] !== undefined) {
      lines.push(`Server P99: ${w['p(99)'].toFixed(2)}ms`);
    }
  }
  lines.push('────────────────────────────────────────');
  if (m.login_failures && m.login_failures.values && typeof m.login_failures.values.rate === 'number') {
    lines.push(`Lỗi đăng nhập: ${(m.login_failures.values.rate * 100).toFixed(2)}%`);
  } else {
    lines.push(`Lỗi đăng nhập: N/A (Bỏ qua Login)`);
  }
  if (m.api_failures && m.api_failures.values && typeof m.api_failures.values.rate === 'number') {
    lines.push(`Lỗi API: ${(m.api_failures.values.rate * 100).toFixed(2)}%`);
  }
  if (m.http_req_failed && m.http_req_failed.values && typeof m.http_req_failed.values.rate === 'number') {
    lines.push(`Lỗi HTTP: ${(m.http_req_failed.values.rate * 100).toFixed(2)}%`);
  }
  lines.push('────────────────────────────────────────');
  if (m.data_received) {
    lines.push(`Dữ liệu nhận: ${formatBytes(m.data_received.values.count)}`);
  }
  if (m.data_sent) {
    lines.push(`Dữ liệu gửi: ${formatBytes(m.data_sent.values.count)}`);
  }
  lines.push('========================================\n');
  return lines.join('\n');
}