const express = require('express');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const http = require('http');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

const K6_PATH = String.raw`C:\Program Files\k6\k6.exe`;
const SCRIPT_DIR = path.join(__dirname, '..');
const SCRIPT_PATH = path.join(SCRIPT_DIR, 'testgov2.js');
const RESULTS_DIR = path.join(SCRIPT_DIR, 'testgov2_k6', 'results');

app.use(express.json({ limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

const USERS_DATA_PATH = path.join(SCRIPT_DIR, 'users_data.json');
let loginProgress = {
  running: false,
  total: 0,
  current: 0,
  success: 0,
  failed: 0,
  failedAccounts: []
};

let cachedUsersData = null;

function readUsersData() {
  if (cachedUsersData !== null) {
    return cachedUsersData;
  }
  try {
    if (fs.existsSync(USERS_DATA_PATH)) {
      cachedUsersData = JSON.parse(fs.readFileSync(USERS_DATA_PATH, 'utf-8'));
      return cachedUsersData;
    }
  } catch (e) {
    console.error('Error reading users_data.json', e);
  }
  cachedUsersData = [];
  return cachedUsersData;
}

function writeUsersData(data) {
  cachedUsersData = data;
  try {
    fs.writeFileSync(USERS_DATA_PATH, JSON.stringify(data, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing users_data.json', e);
  }
}

const TOKENS_CACHE_PATH = path.join(SCRIPT_DIR, 'tokens_cache.json');
let cachedTokens = null;

function readTokensCache() {
  if (cachedTokens !== null) {
    return cachedTokens;
  }
  try {
    if (fs.existsSync(TOKENS_CACHE_PATH)) {
      cachedTokens = JSON.parse(fs.readFileSync(TOKENS_CACHE_PATH, 'utf-8'));
      return cachedTokens;
    }
  } catch (e) {
    console.error('Error reading tokens_cache.json', e);
  }
  cachedTokens = {};
  return cachedTokens;
}

function writeTokensCache(tokens) {
  cachedTokens = tokens;
  try {
    fs.writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(tokens, null, 2), 'utf-8');
  } catch (e) {
    console.error('Error writing tokens_cache.json', e);
  }
}

// ---------- State ----------
let currentProcess = null;
let sseClients = [];
let outputBuffer = [];
let testRunning = false;
let startTime = null;

// In-memory result cache — serves results instantly without file I/O
let latestResult = null;
let latestResultTimestamp = null;
let jsonCaptureBuffer = ''; // Buffer for capturing JSON from stdout
let capturingJson = false;

function broadcast(data) {
  const event = JSON.stringify(data);
  outputBuffer.push(data);
  sseClients.forEach(client => {
    client.write(`data: ${event}\n\n`);
  });
}

// ---------- SSE ----------
app.get('/api/stream', (req, res) => {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  // Current state
  res.write(`data: ${JSON.stringify({ type: 'init', running: testRunning })}\n\n`);

  // Replay buffer
  outputBuffer.forEach(item => {
    res.write(`data: ${JSON.stringify(item)}\n\n`);
  });

  sseClients.push(res);
  req.on('close', () => {
    sseClients = sseClients.filter(c => c !== res);
  });
});

// ---------- Run ----------
app.post('/api/run', (req, res) => {
  // Clean up stale state
  if (testRunning && !currentProcess) {
    console.warn('Stale testRunning state detected, resetting...');
    testRunning = false;
  }
  if (testRunning) {
    return res.status(409).json({ error: 'A test is already running' });
  }

  const config = req.body || {};
  let iterationsCappedMessage = null;

  // Cap iterations if using Excel
  if (config.useExcel === 'true') {
    const excelData = readUsersData();
    if (excelData && excelData.length > 0) {
      const vus = Number(config.vus || '5');
      let iterations = Number(config.iterations || '0');
      if (config.executor === 'shared-iterations' && iterations > excelData.length) {
        iterationsCappedMessage = `⚠️ Số lượt chạy (iterations) đã được giới hạn từ ${iterations} xuống ${excelData.length} để khớp với số tài khoản Excel.`;
        config.iterations = String(excelData.length);
      }
      if (config.executor === 'shared-iterations' && Number(config.iterations) < vus) {
        config.iterations = String(vus);
      }
    }
  }

  // Auto-calculate maxDuration for large tests if user hasn't set a custom value
  if (config.executor === 'shared-iterations') {
    const iterations = Number(config.iterations || '50');
    const vus = Number(config.vus || '5');
    const userMaxDuration = config.maxDuration || '5m';
    
    // Parse user's maxDuration to seconds
    const parseDuration = (d) => {
      const m = String(d).match(/^(\d+)\s*(m|s|h)?$/i);
      if (!m) return 300;
      const val = Number(m[1]);
      const unit = (m[2] || 'm').toLowerCase();
      if (unit === 'h') return val * 3600;
      if (unit === 'm') return val * 60;
      return val;
    };
    const userMaxSec = parseDuration(userMaxDuration);
    
    // Estimate: each iteration takes ~15s avg (login + APIs), parallelized across VUs
    const estimatedSeconds = Math.ceil((iterations / vus) * 15);
    // Use at least 10 minutes, or estimated time + 50% buffer, whichever is larger
    const autoMaxSec = Math.max(600, Math.ceil(estimatedSeconds * 1.5));
    
    if (autoMaxSec > userMaxSec) {
      config.maxDuration = autoMaxSec >= 3600 
        ? Math.ceil(autoMaxSec / 3600) + 'h' 
        : Math.ceil(autoMaxSec / 60) + 'm';
      broadcast({ type: 'stdout', message: `⏱️ Thời gian tối đa tự động tăng từ ${userMaxDuration} lên ${config.maxDuration} để đủ cho ${iterations} lượt chạy với ${vus} VUs.`, ts: Date.now() });
    }
    
    // Warn if running many accounts without saved tokens
    if (iterations >= 100 && config.useSavedTokens !== 'true' && config.useExcel === 'true') {
      broadcast({ type: 'stdout', message: `💡 Gợi ý: Bạn đang chạy ${iterations} tài khoản kèm Login. Hãy dùng "🔐 Đăng nhập hàng loạt" trước rồi tích "Sử dụng Token đã lưu" để tốc độ nhanh hơn nhiều lần.`, ts: Date.now() });
    }
  }

  const envArgs = [];

  const envMap = {
    vus: 'VUS',
    iterations: 'ITERATIONS',
    executor: 'EXECUTOR',
    duration: 'DURATION',
    maxDuration: 'MAX_DURATION',
    apiBaseUrl: 'API_BASE_URL',
    webBaseUrl: 'WEB_BASE_URL',
    courseId: 'COURSE_ID',
    courseContentId: 'COURSE_CONTENT_ID',
    topicId: 'TOPIC_ID',
    roleId: 'ROLE_ID',
    detailUserId: 'DETAIL_USER_ID',
    sleepSeconds: 'SLEEP_SECONDS',
    enabledApis: 'ENABLED_APIS',
    userStart: 'USER_START',
    userEnd: 'USER_END',
    useExcel: 'USE_EXCEL',
    useSavedTokens: 'USE_SAVED_TOKENS',
  };

  for (const [key, envName] of Object.entries(envMap)) {
    if (config[key] !== undefined && config[key] !== null && config[key] !== '') {
      envArgs.push('-e', `${envName}=${config[key]}`);
    }
  }

  envArgs.push('-e', `K6_DASHBOARD_URL=http://localhost:${PORT}`);

  const args = ['run', ...envArgs, SCRIPT_PATH];

  // Reset state
  outputBuffer = [];
  testRunning = true;
  startTime = Date.now();

  broadcast({
    type: 'status',
    status: 'running',
    config,
    timestamp: new Date().toISOString(),
  });

  if (iterationsCappedMessage) {
    broadcast({ type: 'stdout', message: iterationsCappedMessage, ts: Date.now() });
  }

  currentProcess = spawn(K6_PATH, args, { cwd: SCRIPT_DIR });

  const pipeStream = (stream, type) => {
    let buffer = '';
    stream.on('data', (chunk) => {
      buffer += chunk.toString();
      // k6 uses \r (no \n) for progress updates. Split on \n first:
      const parts = buffer.split('\n');
      buffer = parts.pop();
      for (const raw of parts) {
        // Take last \r segment (simulates terminal carriage-return overwrite)
        const segments = raw.split('\r');
        const line = segments[segments.length - 1];
        if (!line || line.trim().length <= 1) continue;

        // Capture JSON result from stdout (between delimiters)
        if (type === 'stdout') {
          if (line.includes('__K6_JSON_START__')) {
            capturingJson = true;
            jsonCaptureBuffer = '';
            continue; // Don't broadcast delimiter
          }
          if (line.includes('__K6_JSON_END__')) {
            capturingJson = false;
            try {
              latestResult = JSON.parse(jsonCaptureBuffer);
              latestResultTimestamp = Date.now();
              broadcast({ type: 'result_ready', ts: latestResultTimestamp });
            } catch (e) {
              console.error('Failed to parse captured k6 JSON:', e.message);
            }
            jsonCaptureBuffer = '';
            continue; // Don't broadcast delimiter
          }
          if (capturingJson) {
            jsonCaptureBuffer += line;
            continue; // Don't broadcast JSON data
          }
        }

        broadcast({ type, message: line, ts: Date.now() });
      }
      // If buffer has \r but no \n (k6 progress), emit the latest segment
      if (buffer.includes('\r')) {
        const segments = buffer.split('\r');
        // Keep only the last incomplete segment in buffer
        buffer = segments.pop();
        // Broadcast the latest complete \r-terminated segment
        for (let i = segments.length - 1; i >= 0; i--) {
          const seg = segments[i].trim();
          if (seg.length > 1) {
            broadcast({ type, message: seg, ts: Date.now() });
            break; // Only emit the LATEST one to avoid spamming
          }
        }
      }
    });
    stream.on('end', () => {
      if (buffer && buffer.trim().length > 1) {
        broadcast({ type, message: buffer.replace(/\r/g, ''), ts: Date.now() });
      }
    });
  };

  pipeStream(currentProcess.stdout, 'stdout');
  pipeStream(currentProcess.stderr, 'stderr');

  currentProcess.on('error', (err) => {
    testRunning = false;
    broadcast({ type: 'error', message: err.message });
    currentProcess = null;
  });

  currentProcess.on('close', (code, signal) => {
    const elapsed = Date.now() - startTime;
    testRunning = false;

    if (signal) {
      console.warn(`k6 process killed by signal: ${signal} (code: ${code})`);
    }

    // Flush pending token writes before signaling completion
    if (tokenDirty && cachedTokens) {
      try { fs.writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(cachedTokens, null, 2), 'utf-8'); } catch (e) {}
      tokenDirty = false;
    }
    if (usersDirty && cachedUsersData) {
      try { fs.writeFileSync(USERS_DATA_PATH, JSON.stringify(cachedUsersData, null, 2), 'utf-8'); } catch (e) {}
      usersDirty = false;
    }

    broadcast({ type: 'status', status: 'finished', exitCode: code, signal: signal, elapsed });
    currentProcess = null;
    startTime = null;

    // Check if result file was created (delayed to allow k6 to flush)
    setTimeout(() => {
      try {
        if (fs.existsSync(RESULTS_DIR)) {
          const files = fs.readdirSync(RESULTS_DIR).filter(f => f.endsWith('.json')).sort().reverse();
          if (files.length > 0) {
            // Check if the newest file was created in the last 2 minutes
            const newest = path.join(RESULTS_DIR, files[0]);
            const stat = fs.statSync(newest);
            const ageMs = Date.now() - stat.mtimeMs;
            if (ageMs > 120000) {
              broadcast({ type: 'stderr', message: '⚠️ Không tìm thấy file kết quả mới. k6 có thể đã bị lỗi khi xuất báo cáo. Kiểm tra nhật ký để biết chi tiết.', ts: Date.now() });
            }
          } else {
            broadcast({ type: 'stderr', message: '⚠️ Thư mục kết quả trống. k6 có thể đã không xuất được báo cáo.', ts: Date.now() });
          }
        }
      } catch (e) {}
    }, 5000);
  });

  res.json({ status: 'started', args });
});

// ---------- Stop ----------
app.post('/api/stop', (req, res) => {
  if (!currentProcess) {
    return res.status(404).json({ error: 'No test is running' });
  }
  currentProcess.kill('SIGTERM');
  res.json({ status: 'stopping' });
});

// ---------- Results ----------
app.get('/api/results', (_req, res) => {
  try {
    if (!fs.existsSync(RESULTS_DIR)) return res.json([]);
    const files = fs.readdirSync(RESULTS_DIR)
      .filter(f => f.endsWith('.json'))
      .sort()
      .reverse();
    res.json(files);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/results/:filename', (req, res) => {
  const filePath = path.join(RESULTS_DIR, path.basename(req.params.filename));
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Not found' });
  try {
    res.json(JSON.parse(fs.readFileSync(filePath, 'utf-8')));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Return latest result from RAM (instant, no file I/O)
app.get('/api/latest-result', (_req, res) => {
  if (!latestResult) {
    return res.status(404).json({ error: 'Chưa có kết quả nào' });
  }
  res.json({
    data: latestResult,
    timestamp: latestResultTimestamp,
  });
});

// ---------- Status ----------
app.get('/api/status', (_req, res) => {
  res.json({ running: testRunning, elapsed: startTime ? Date.now() - startTime : null });
});

// ---------- Excel Endpoints ----------
app.post('/api/save-excel-data', (req, res) => {
  const data = req.body || [];
  const clearTokens = req.query.clearTokens === 'true';
  
  // If user chose to clear tokens, wipe the cache first
  if (clearTokens) {
    writeTokensCache({});
  }
  
  // Read token cache (may be empty if just cleared, or full if kept)
  const tokensCache = readTokensCache();
  
  // Auto-merge: match each Excel user to their cached token (if any)
  let matchedCount = 0;
  const updated = data.map(u => {
    const cleanUser = { ...u };
    // Remove any stale token embedded in the Excel row itself
    delete cleanUser.token;
    
    // Look up cached token by email
    const userKey = cleanUser.User || cleanUser.email || cleanUser.username;
    if (userKey) {
      const searchKey = String(userKey).trim().toLowerCase();
      if (tokensCache[searchKey]) {
        cleanUser.token = tokensCache[searchKey];
        matchedCount++;
      }
    }
    return cleanUser;
  });

  writeUsersData(updated);
  res.json({ success: true, count: updated.length, tokenMatched: matchedCount });
});

app.get('/api/get-excel-data', (req, res) => {
  const data = readUsersData();
  const tokenCount = data.filter(u => u.token).length;
  res.json({ count: data.length, tokenCount, users: data.slice(0, 100) });
});

// ---------- Batched token save (high-perf for k6 concurrency) ----------
let tokenDirty = false;
let usersDirty = false;

// Flush dirty caches to disk periodically (every 5s) instead of on every request
setInterval(() => {
  if (tokenDirty) {
    try {
      fs.writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(cachedTokens || {}, null, 2), 'utf-8');
    } catch (e) { console.error('Token flush error:', e.message); }
    tokenDirty = false;
  }
  if (usersDirty) {
    try {
      fs.writeFileSync(USERS_DATA_PATH, JSON.stringify(cachedUsersData || [], null, 2), 'utf-8');
    } catch (e) { console.error('Users flush error:', e.message); }
    usersDirty = false;
  }
}, 5000);

// Also flush on process exit
process.on('exit', () => {
  if (tokenDirty && cachedTokens) {
    try { fs.writeFileSync(TOKENS_CACHE_PATH, JSON.stringify(cachedTokens, null, 2), 'utf-8'); } catch (e) {}
  }
  if (usersDirty && cachedUsersData) {
    try { fs.writeFileSync(USERS_DATA_PATH, JSON.stringify(cachedUsersData, null, 2), 'utf-8'); } catch (e) {}
  }
});
process.on('SIGINT', () => process.exit());
process.on('SIGTERM', () => process.exit());

app.post('/api/save-token', (req, res) => {
  const { email, token } = req.body || {};
  if (!email || !token) {
    return res.status(400).json({ error: 'Missing email or token' });
  }
  const searchKey = String(email).trim().toLowerCase();

  // Update users_data in RAM only (no disk I/O)
  const data = readUsersData();
  for (let i = 0; i < data.length; i++) {
    const userKey = data[i].User || data[i].email || data[i].username;
    if (userKey && String(userKey).trim().toLowerCase() === searchKey) {
      data[i].token = token;
      usersDirty = true;
      break;
    }
  }

  // Update token cache in RAM only (no disk I/O)
  const tokensCache = readTokensCache();
  if (tokensCache[searchKey] !== token) {
    tokensCache[searchKey] = token;
    tokenDirty = true;
  }

  // Return immediately — no file I/O
  res.json({ success: true });
});

function calculatePercentile(arr, p) {
  if (arr.length === 0) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}

function generateLoginReport(stats, config) {
  const durations = stats.durations;
  const count = durations.length;
  const avg = count > 0 ? durations.reduce((sum, v) => sum + v, 0) / count : 0;
  const min = count > 0 ? Math.min(...durations) : 0;
  const max = count > 0 ? Math.max(...durations) : 0;
  const med = calculatePercentile(durations, 50);
  const p90 = calculatePercentile(durations, 90);
  const p95 = calculatePercentile(durations, 95);
  const p99 = calculatePercentile(durations, 99);

  const durationMs = stats.endTime - stats.startTime;
  const rate = durationMs > 0 ? (count / (durationMs / 1000)) : 0;
  const failureRate = count > 0 ? (stats.loginFailures / count) : 0;

  return {
    metrics: {
      http_reqs: {
        values: {
          count: count,
          rate: rate
        }
      },
      login_failures: {
        values: {
          rate: failureRate,
          passes: stats.loginFailures,
          fails: stats.loginSuccesses
        }
      },
      http_req_failed: {
        values: {
          rate: failureRate,
          passes: stats.loginFailures,
          fails: stats.loginSuccesses
        }
      },
      http_req_duration: {
        values: {
          min: min,
          avg: avg,
          med: med,
          max: max,
          'p(90)': p90,
          'p(95)': p95,
          'p(99)': p99
        }
      },
      testgov2_request_duration: {
        values: {
          min: min,
          avg: avg,
          med: med,
          max: max,
          'p(90)': p90,
          'p(95)': p95,
          'p(99)': p99
        }
      },
      http_req_waiting: {
        values: {
          min: min,
          avg: avg,
          med: med,
          max: max,
          'p(90)': p90,
          'p(95)': p95,
          'p(99)': p99
        }
      },
      http_req_connecting: {
        values: { min: 0, avg: 0, med: 0, max: 0, 'p(90)': 0, 'p(95)': 0, 'p(99)': 0 }
      },
      http_req_tls_handshaking: {
        values: { min: 0, avg: 0, med: 0, max: 0, 'p(90)': 0, 'p(95)': 0, 'p(99)': 0 }
      },
      "http_req_duration{name:POST /api/user/login}": {
        values: {
          min: min,
          avg: avg,
          med: med,
          max: max,
          'p(90)': p90,
          'p(95)': p95,
          'p(99)': p99
        }
      },
      "http_reqs{name:POST /api/user/login}": {
        values: {
          count: count,
          rate: rate
        }
      },
      "http_req_failed{name:POST /api/user/login}": {
        values: {
          rate: failureRate,
          passes: stats.loginFailures,
          fails: stats.loginSuccesses
        }
      }
    },
    metadata: {
      apiBaseUrl: config.apiBaseUrl,
      webBaseUrl: config.webBaseUrl,
      executor: "Excel Bulk Login",
      vus: config.vus,
      timestamp: new Date(stats.startTime).toISOString()
    },
    state: {
      testRunDurationMs: durationMs
    }
  };
}

app.post('/api/login-excel', (req, res) => {
  if (loginProgress.running) {
    return res.status(409).json({ error: 'Đang thực hiện đăng nhập rồi.' });
  }

  const apiBaseUrl = req.body.apiBaseUrl || 'https://apiv4-gov2.cls.vn';
  const webBaseUrl = req.body.webBaseUrl || 'https://testgov2.cls.vn';
  const data = readUsersData();
  if (data.length === 0) {
    return res.status(400).json({ error: 'Không có danh sách tài khoản Excel.' });
  }

  loginProgress = {
    running: true,
    total: data.length,
    current: 0,
    success: 0,
    failed: 0,
    reportFile: null,
    failedAccounts: []
  };

  res.json({ status: 'started', total: data.length });

  // Dynamic concurrency: scale with data size, min 30, max 100
  const vus = Math.min(100, Math.max(30, Math.ceil(data.length / 50)));

  // Create dedicated HTTP agents with keep-alive and high connection limit
  // This is the KEY optimization — Node.js default limits to ~5 sockets per host
  const agentOptions = { keepAlive: true, maxSockets: 200, maxFreeSockets: 50, timeout: 60000 };
  const httpAgent = new http.Agent(agentOptions);
  const httpsAgent = new https.Agent({ ...agentOptions, rejectUnauthorized: false });
  const dispatcher = apiBaseUrl.startsWith('https') ? httpsAgent : httpAgent;

  // Async background execution
  (async () => {
    const tokensCache = readTokensCache();
    let cacheUpdated = false;
    let index = 0;
    let completed = 0;
    const durations = [];
    const stats = {
      startTime: Date.now(),
      loginSuccesses: 0,
      loginFailures: 0
    };
    let lastWriteTime = Date.now();

    const loginPayloadTemplate = {
      uuid: 'b354f9d6ce237d2fbc464db85b9947a3',
      captcha: ''
    };

    const loginHeaders = {
      'Content-Type': 'application/json;charset=utf-8',
      'Accept': 'application/json, text/plain, */*',
      'Origin': webBaseUrl,
      'Referer': webBaseUrl + '/',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    };

    async function loginOne(u) {
      const reqStartTime = Date.now();
      const maxRetries = 2;
      
      for (let retry = 0; retry <= maxRetries; retry++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout (same as k6)

          const response = await fetch(`${apiBaseUrl}/api/user/login`, {
            method: 'POST',
            headers: loginHeaders,
            body: JSON.stringify({
              ...loginPayloadTemplate,
              email: String(u.User),
              password: String(u.Pass)
            }),
            signal: controller.signal,
            // Use keep-alive agent for connection reuse
            agent: dispatcher
          });

          clearTimeout(timeoutId);
          const reqDuration = Date.now() - reqStartTime;
          durations.push(reqDuration);

          if (response.ok) {
            const resJson = await response.json();
            const token = resJson.data && resJson.data.accessToken;
            if (token) {
              u.token = token;
              const searchKey = String(u.User).trim().toLowerCase();
              tokensCache[searchKey] = token;
              cacheUpdated = true;
              return { success: true };
            }
            return { success: false, error: resJson.message || resJson.error || 'Thiếu accessToken' };
          } else {
            let errorMsg = `HTTP ${response.status}`;
            try { const j = await response.json(); errorMsg = j.message || j.error || errorMsg; } catch(e) {}
            // Retry on 5xx errors
            if (response.status >= 500 && retry < maxRetries) {
              await new Promise(r => setTimeout(r, 1000 * (retry + 1))); // backoff: 1s, 2s
              continue;
            }
            return { success: false, error: errorMsg };
          }
        } catch (err) {
          // Retry on timeout/network errors
          if (retry < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * (retry + 1)));
            continue;
          }
          return { success: false, error: err.message };
        }
      }
    }

    async function worker() {
      while (loginProgress.running) {
        let currentIndex;
        if (index < data.length) {
          currentIndex = index++;
        } else {
          break;
        }

        const u = data[currentIndex];
        const result = await loginOne(u);

        if (result.success) {
          loginProgress.success++;
          stats.loginSuccesses++;
        } else {
          loginProgress.failed++;
          stats.loginFailures++;
          loginProgress.failedAccounts.push({
            user: String(u.User),
            error: String(result.error)
          });
          broadcast({ type: 'stderr', message: `❌ Đăng nhập thất bại: Tài khoản ${u.User} - Lỗi: ${result.error}` });
        }

        completed++;
        loginProgress.current = completed;

        // Throttled writing to disk (at most once every 5 seconds)
        const now = Date.now();
        if (now - lastWriteTime > 5000 || completed === data.length) {
          writeUsersData(data);
          if (cacheUpdated) {
            writeTokensCache(tokensCache);
            cacheUpdated = false;
          }
          lastWriteTime = now;
        }
      }
    }

    const workers = [];
    for (let w = 0; w < Math.min(vus, data.length); w++) {
      workers.push(worker());
    }
    await Promise.all(workers);

    // Cleanup agents
    httpAgent.destroy();
    httpsAgent.destroy();

    stats.endTime = Date.now();
    stats.durations = durations;

    loginProgress.running = false;
    writeUsersData(data);
    if (cacheUpdated) {
      writeTokensCache(tokensCache);
    }

    // Generate and save detailed report
    if (durations.length > 0) {
      const report = generateLoginReport(stats, {
        apiBaseUrl,
        webBaseUrl,
        vus
      });

      if (!fs.existsSync(RESULTS_DIR)) {
        fs.mkdirSync(RESULTS_DIR, { recursive: true });
      }

      report.failedAccounts = loginProgress.failedAccounts;

      const reportFilename = `testgov2-login-${new Date().toISOString().replace(/:/g, '-')}.json`;
      const reportPath = path.join(RESULTS_DIR, reportFilename);
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf-8');

      loginProgress.reportFile = reportFilename;
    }
  })().catch(err => {
    console.error('Background login error:', err);
    loginProgress.running = false;
  });
});

app.get('/api/login-excel-status', (req, res) => {
  res.json(loginProgress);
});

app.post('/api/login-excel-stop', (req, res) => {
  loginProgress.running = false;
  res.json({ success: true });
});

// ---------- Token lookup (for k6 reuse across login methods) ----------
app.get('/api/get-token', (req, res) => {
  const email = req.query.email;
  if (!email) {
    return res.status(400).json({ error: 'Missing email param' });
  }
  const searchKey = String(email).trim().toLowerCase();
  const tokensCache = readTokensCache();
  const token = tokensCache[searchKey] || null;
  res.json({ token });
});

// ---------- Start ----------
const server = app.listen(PORT, () => {
  console.log('');
  console.log('  ⚡ k6 Dashboard');
  console.log(`  → http://localhost:${PORT}`);
  console.log('');
});

// Handle high concurrency from k6 VUs sending save-token requests simultaneously
server.keepAliveTimeout = 65000;   // 65s (higher than k6's default)
server.headersTimeout = 70000;     // must be > keepAliveTimeout
server.maxConnections = 0;         // unlimited
