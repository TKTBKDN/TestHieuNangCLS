(function () {
  'use strict';

  /* ========== API CATALOG ========== */
  var API_CATALOG = [
    {
      id: 'grp-02', name: 'Thông tin khóa học', icon: '📋',
      apis: [
        { id: 'rollcall', name: 'Điểm danh', path: 'GET /api/ExperienceUser/get-roll-call' },
      ]
    },
    {
      id: 'grp-03', name: 'Trang chủ & Tổng quan', icon: '🏠',
      apis: [
        { id: 'course-detail', name: 'Chi tiết khóa học', path: 'GET /api/course/get-detail' },
        { id: 'user-detail', name: 'Chi tiết user', path: 'GET /api/user/get-detail-user' },
        { id: 'eval-criteria', name: 'Tiêu chí đánh giá', path: 'GET /api/course/get-course-evaluation-criteria' },
        { id: 'general-eval', name: 'Đánh giá tổng', path: 'GET /api/course/get-general-evaluation' },
        { id: 'paging-eval', name: 'DS đánh giá', path: 'GET /api/course/get-paging-user-evaluation' },
        { id: 'check-user-exist', name: 'Kiểm tra user', path: 'GET /api/course/check-user-exist' },
        { id: 'list-content', name: 'DS nội dung', path: 'GET /api/coursecontent/list-user-content-by-courseId' },
        { id: 'topic-detail', name: 'Chi tiết chủ đề', path: 'GET /api/topic/get-by-id' },
        { id: 'course-document', name: 'Tài liệu', path: 'GET /api/course/get-document' },
      ]
    },
    {
      id: 'grp-04', name: 'Chi tiết học tập', icon: '📚',
      apis: [
        { id: 'user-basic', name: 'Thông tin cơ bản', path: 'GET /api/user/basic' },
        { id: 'user-contacts', name: 'Danh bạ', path: 'GET /api/User/get-list-contact' },
        { id: 'version-releases', name: 'Phiên bản', path: 'GET /api/VersionReleases/get-paging' },
        { id: 'login-log', name: 'Log đăng nhập', path: 'POST /api/User/login-log' },
        { id: 'menu-by-role', name: 'Menu vai trò', path: 'GET /api/menu/get-menu-by-role' },
        { id: 'my-courses', name: 'Khóa học của tôi', path: 'GET /api/CourseUser/my-courses' },
        { id: 'noti-count', name: 'Đếm thông báo', path: 'GET /api/Notification/count-noti-unseen' },
        { id: 'topic-info', name: 'Thông tin chủ đề', path: 'GET /api/Topic/get-information-topic' },
        { id: 'learner-paging', name: 'DS học viên', path: 'GET /api/course/learner/get-paging' },
        { id: 'check-require', name: 'Kiểm tra yêu cầu', path: 'GET /api/learner/check-course-require' },
        { id: 'proficiency-require', name: 'Yêu cầu năng lực', path: 'GET /api/learner/get-course-proficiency-require' },
        { id: 'list-my-course', name: 'DS khóa đăng ký', path: 'GET /api/Learner/list-my-course' },
        { id: 'user-by-ids', name: 'User theo IDs', path: 'GET /api/user/get-info-user-by-ids' },
        { id: 'content-detail', name: 'Chi tiết nội dung', path: 'GET /api/learner/get-course-content-detail' },
        { id: 'set-complete', name: 'Hoàn thành bài', path: 'POST /api/learner/set-complete-course-content-basic' },
        { id: 'course-by-ids', name: 'Khóa theo IDs', path: 'GET /api/Course/get-list-course-by-ids' },
        { id: 'certification', name: 'Chứng chỉ', path: 'GET /api/certification/get-certification-user' },
        { id: 'update-content', name: 'Cập nhật tiến độ', path: 'POST /api/learner/update-course-content-user' },
      ]
    },
    {
      id: 'grp-exam', name: 'Kỳ thi (Excel)', icon: '📝',
      apis: [
        { id: 'start-exam', name: 'Bắt đầu thi', path: 'PATCH /api/examtest/start-exam' },
        { id: 'set-answer', name: 'Nộp bài thi', path: 'POST /api/examtest/set-answer-question' },
      ]
    },
    {
      id: 'grp-05', name: 'JMeter Samplers (mặc định tắt)', icon: '⚙️', defaultOff: true,
      apis: [
        { id: 'dis-general-eval', name: 'Đánh giá tổng (2)', path: 'GET /api/course/get-general-evaluation' },
        { id: 'dis-set-complete', name: 'Hoàn thành (2)', path: 'POST /api/learner/set-complete-course-content-basic' },
        { id: 'dis-proficiency', name: 'Năng lực', path: 'GET /api/proficiency/get-by-course-id' },
      ]
    },
  ];

  /* ========== DOM ========== */
  var $ = function (id) { return document.getElementById(id); };
  var configForm        = $('configForm');
  var runBtn            = $('runBtn');
  var stopBtn           = $('stopBtn');
  var consoleOutput     = $('consoleOutput');
  var consoleDot        = $('consoleDot');
  var progressContainer = $('progressContainer');
  var progressFill      = $('progressFill');
  var progressPercent   = $('progressPercent');
  var progressLabel     = $('progressLabel');
  var progressDetails   = $('progressDetails');
  var metricsGrid       = $('metricsGrid');
  var reportSection     = $('reportSection');
  var historyList       = $('historyList');
  var clearBtn          = $('clearBtn');
  var copyBtn           = $('copyBtn');
  var advancedToggle    = $('advancedToggle');
  var advancedContent   = $('advancedContent');
  var executorToggle    = $('executorToggle');
  var iterationsGroup   = $('iterationsGroup');
  var durationGroup     = $('durationGroup');
  var refreshHistoryBtn = $('refreshHistoryBtn');

  // Excel selectors
  var excelFile          = $('excelFile');
  var excelInfo          = $('excelInfo');
  var excelFileName      = $('excelFileName');
  var excelFileDetails   = $('excelFileDetails');
  var useExcel           = $('useExcel');
  var useSavedTokens     = $('useSavedTokens');
  var useSavedTokensGroup= $('useSavedTokensGroup');
  var loginExcelBtn      = $('loginExcelBtn');
  var stopLoginExcelBtn  = $('stopLoginExcelBtn');
  var loginExcelProgress = $('loginExcelProgress');
  var loginExcelProgressBar = $('loginExcelProgressBar');
  var loginExcelProgressText = $('loginExcelProgressText');
  var excelLoginErrors   = $('excelLoginErrors');
  var excelErrorCount    = $('excelErrorCount');
  var copyExcelErrorsBtn = $('copyExcelErrorsBtn');
  var excelErrorsList    = $('excelErrorsList');

  var eventSource  = null;
  var consoleText  = '';
  var currentExec  = 'shared-iterations';
  var summaryLines = [];
  var inSummary    = false;
  var knownResultFiles = []; // files that existed BEFORE current test

  /* ========== FETCH LATEST RESULT (from server memory) ========== */
  function fetchLatestResult(attempt) {
    var maxAttempts = 10;
    var delay = attempt < 2 ? 500 : 1500; // Much shorter delays since result is in memory

    setTimeout(function () {
      // Try memory cache first (instant)
      fetch('/api/latest-result').then(function (r) {
        if (r.ok) return r.json();
        throw new Error('no-cache');
      }).then(function (resp) {
        if (resp && resp.data && resp.data.metrics) {
          log('info', '📊 Kết quả đã sẵn sàng (từ bộ nhớ)');
          displayResult(resp.data);
          loadHistory();
          return;
        }
        throw new Error('invalid');
      }).catch(function () {
        // Fallback: try file-based loading
        if (attempt < maxAttempts) {
          if (attempt % 3 === 0) log('info', '⏳ Đang chờ kết quả... (lần ' + (attempt + 1) + '/' + maxAttempts + ')');
          fetchLatestResult(attempt + 1);
        } else {
          // Final fallback: try loading newest file
          fetch('/api/results').then(function (r) { return r.json(); }).then(function (files) {
            if (files && files.length > 0) {
              return fetch('/api/results/' + files[0]).then(function (r) { return r.json(); }).then(function (data) {
                if (data && data.metrics) {
                  log('info', '📊 Đã tải báo cáo: ' + files[0]);
                  displayResult(data);
                }
                loadHistory();
              });
            } else {
              log('error', '⚠️ Không tìm thấy kết quả. Hãy bấm vào kết quả trong "Lịch sử Test" bên dưới.');
              loadHistory();
            }
          }).catch(function () {
            log('error', '⚠️ Lỗi tải kết quả.');
            loadHistory();
          });
        }
      });
    }, delay);
  }

  /* ========== CONFIG PERSISTENCE (localStorage) ========== */
  var CONFIG_KEY = 'k6_dashboard_config';

  // IDs of all text/number input fields to persist
  var PERSIST_INPUTS = ['vus', 'iterations', 'duration', 'apiBaseUrl', 'webBaseUrl',
    'courseId', 'courseContentId', 'topicId', 'roleId', 'userStart', 'userEnd',
    'sleepSeconds', 'maxDuration'];

  // IDs of all checkbox fields to persist
  var PERSIST_CHECKBOXES = ['useExcel', 'useSavedTokens'];

  function saveConfig() {
    var cfg = {};
    // Save input values
    PERSIST_INPUTS.forEach(function (id) {
      var el = $(id);
      if (el) cfg[id] = el.value;
    });
    // Save checkbox states
    PERSIST_CHECKBOXES.forEach(function (id) {
      var el = $(id);
      if (el) cfg[id] = el.checked;
    });
    // Save executor mode
    cfg._executor = currentExec;
    // Save selected APIs (array of checked API IDs)
    cfg._apisConfigured = true; // Flag: user has touched API selection
    var checkedApis = [];
    document.querySelectorAll('.api-single:checked').forEach(function (cb) {
      checkedApis.push(cb.value);
    });
    cfg._selectedApis = checkedApis;

    try {
      localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
    } catch (e) { /* quota exceeded, ignore */ }
  }

  function restoreConfig() {
    var raw;
    try { raw = localStorage.getItem(CONFIG_KEY); } catch (e) { return; }
    if (!raw) return;
    var cfg;
    try { cfg = JSON.parse(raw); } catch (e) { return; }

    // Restore input values
    PERSIST_INPUTS.forEach(function (id) {
      var el = $(id);
      if (el && cfg[id] !== undefined) el.value = cfg[id];
    });
    // Restore checkbox states
    PERSIST_CHECKBOXES.forEach(function (id) {
      var el = $(id);
      if (el && cfg[id] !== undefined) el.checked = cfg[id];
    });
    // Restore executor mode
    if (cfg._executor) {
      currentExec = cfg._executor;
      executorToggle.querySelectorAll('.toggle').forEach(function (btn) {
        btn.classList.toggle('active', btn.dataset.value === currentExec);
      });
      iterationsGroup.classList.toggle('hidden', currentExec === 'constant-vus');
      durationGroup.classList.toggle('hidden', currentExec !== 'constant-vus');
    }
    // Restore Excel options visibility
    if (cfg.useExcel) {
      toggleExcelOptions();
      updateLoginCheckboxVisually();
    }

    return cfg;
  }

  function restoreApiSelection(cfg) {
    if (!cfg || !cfg._selectedApis) return;
    var selected = cfg._selectedApis;
    // If user never configured APIs (first visit), keep defaults
    if (!cfg._apisConfigured) return;
    // Restore saved selection (including empty = user intentionally deselected all)
    // Restore saved selection
    document.querySelectorAll('.api-single').forEach(function (cb) {
      cb.checked = selected.indexOf(cb.value) !== -1;
    });
    // Sync group checkboxes
    document.querySelectorAll('.api-grp-check').forEach(function (grp) {
      var siblings = document.querySelectorAll('.api-single[data-group="' + grp.dataset.group + '"]');
      grp.checked = Array.from(siblings).every(function (s) { return s.checked; });
    });
    updateApiCounter();
  }

  function bindAutoSave() {
    // Auto-save on any input change
    PERSIST_INPUTS.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('input', saveConfig);
    });
    PERSIST_CHECKBOXES.forEach(function (id) {
      var el = $(id);
      if (el) el.addEventListener('change', saveConfig);
    });
    // Auto-save on API checkbox changes
    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('api-single') || e.target.classList.contains('api-grp-check')) {
        saveConfig();
      }
    });
  }

  /* ========== INIT ========== */
  function init() {
    var savedCfg = restoreConfig();
    bindEvents();
    renderApiSelection();
    restoreApiSelection(savedCfg);
    bindAutoSave();
    connectSSE();
    loadHistory();
    loadExcelStatus();
    checkExcelLoginOnLoad();
  }

  function bindEvents() {
    configForm.addEventListener('submit', onRun);
    stopBtn.addEventListener('click', onStop);
    clearBtn.addEventListener('click', clearConsole);
    copyBtn.addEventListener('click', copyConsole);
    refreshHistoryBtn.addEventListener('click', loadHistory);

    executorToggle.querySelectorAll('.toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        executorToggle.querySelectorAll('.toggle').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentExec = btn.dataset.value;
        iterationsGroup.classList.toggle('hidden', currentExec === 'constant-vus');
        durationGroup.classList.toggle('hidden', currentExec !== 'constant-vus');
        saveConfig();
      });
    });

    advancedToggle.addEventListener('click', function () {
      advancedContent.classList.toggle('hidden');
      advancedToggle.querySelector('.chevron').classList.toggle('open');
    });

    $('apiToggle').addEventListener('click', function () {
      $('apiContent').classList.toggle('hidden');
      $('apiToggle').querySelector('.chevron').classList.toggle('open');
    });

    excelFile.addEventListener('change', onExcelUpload);
    useExcel.addEventListener('change', function () {
      toggleExcelOptions();
      updateLoginCheckboxVisually();
    });
    useSavedTokens.addEventListener('change', updateLoginCheckboxVisually);
    loginExcelBtn.addEventListener('click', onLoginExcel);
    stopLoginExcelBtn.addEventListener('click', onStopLoginExcel);
    copyExcelErrorsBtn.addEventListener('click', copyExcelErrors);
  }

  /* ========== API SELECTION ========== */
  function renderApiSelection() {
    var container = $('apiContent');
    if (!container) return;
    var html = '<div class="api-toolbar">' +
      '<button type="button" class="btn-sm" id="selectAllApis">Chọn tất cả</button>' +
      '<button type="button" class="btn-sm" id="deselectAllApis">Bỏ chọn</button>' +
      '<span class="api-counter" id="apiCounter"></span></div>';
    var skipped = useExcel.checked && useSavedTokens.checked;
    html += '<div class="api-group"><label class="api-group-header">' +
      '<input type="checkbox" id="loginGroupCheckbox" class="api-check" ' + (skipped ? '' : 'checked') + ' disabled>' +
      '<span class="api-group-icon">🔐</span>' +
      '<span id="loginGroupName" class="api-group-name">' + (skipped ? 'Đăng nhập (Đã bỏ qua — Sử dụng Token lưu sẵn)' : 'Đăng nhập (bắt buộc — lấy token)') + '</span>' +
      '</label><div class="api-items"><label class="api-item locked">' +
      '<input type="checkbox" id="loginItemCheckbox" class="api-check" ' + (skipped ? '' : 'checked') + ' disabled>' +
      '<span class="api-name">Login</span>' +
      '<span class="api-path">POST /api/user/login</span></label></div></div>';
    API_CATALOG.forEach(function (group) {
      var on = !group.defaultOff;
      html += '<div class="api-group"><label class="api-group-header">' +
        '<input type="checkbox" class="api-check api-grp-check" data-group="' + group.id + '"' + (on ? ' checked' : '') + '>' +
        '<span class="api-group-icon">' + group.icon + '</span>' +
        '<span class="api-group-name">' + group.name + '</span>' +
        '<span class="api-group-count">' + group.apis.length + '</span></label><div class="api-items">' +
        group.apis.map(function (api) {
          return '<label class="api-item"><input type="checkbox" class="api-check api-single" data-group="' + group.id + '" value="' + api.id + '"' + (on ? ' checked' : '') + '>' +
            '<span class="api-name">' + api.name + '</span><span class="api-path">' + api.path + '</span></label>';
        }).join('') + '</div></div>';
    });
    container.innerHTML = html;
    bindApiEvents();
    updateApiCounter();
  }

  function bindApiEvents() {
    $('selectAllApis').addEventListener('click', function () {
      document.querySelectorAll('.api-single, .api-grp-check').forEach(function (cb) { cb.checked = true; });
      updateApiCounter();
      saveConfig();
    });
    $('deselectAllApis').addEventListener('click', function () {
      document.querySelectorAll('.api-single, .api-grp-check').forEach(function (cb) { cb.checked = false; });
      updateApiCounter();
      saveConfig();
    });
    document.querySelectorAll('.api-grp-check').forEach(function (grp) {
      grp.addEventListener('change', function () {
        document.querySelectorAll('.api-single[data-group="' + grp.dataset.group + '"]')
          .forEach(function (cb) { cb.checked = grp.checked; });
        updateApiCounter();
        saveConfig();
      });
    });
    document.querySelectorAll('.api-single').forEach(function (cb) {
      cb.addEventListener('change', function () {
        var siblings = document.querySelectorAll('.api-single[data-group="' + cb.dataset.group + '"]');
        var grp = document.querySelector('.api-grp-check[data-group="' + cb.dataset.group + '"]');
        if (grp) grp.checked = Array.from(siblings).every(function (s) { return s.checked; });
        updateApiCounter();
      });
    });
  }

  function updateApiCounter() {
    var total = document.querySelectorAll('.api-single').length;
    var checked = document.querySelectorAll('.api-single:checked').length;
    var text = checked + '/' + total;
    var counter = $('apiCounter'); var badge = $('apiBadge');
    if (counter) counter.textContent = text;
    if (badge) badge.textContent = text;
  }

  function getSelectedApis() {
    var all = document.querySelectorAll('.api-single');
    var checked = document.querySelectorAll('.api-single:checked');
    if (checked.length === all.length) return null;
    return Array.from(checked).map(function (cb) { return cb.value; }).join(',');
  }

  /* ========== SSE ========== */
  function connectSSE() {
    if (eventSource) eventSource.close();
    eventSource = new EventSource('/api/stream');
    eventSource.onmessage = function (e) { handleMsg(JSON.parse(e.data)); };
    eventSource.onerror = function () { setTimeout(connectSSE, 3000); };
  }

  function handleMsg(d) {
    switch (d.type) {
      case 'init':
        if (d.running) setRunning(true);
        break;
      case 'status':
        if (d.status === 'running') {
          setRunning(true);
          clearConsole();
          reportSection.classList.add('hidden');
          // Snapshot existing result files to detect the NEW one after test finishes
          fetch('/api/results').then(function (r) { return r.json(); }).then(function (files) {
            knownResultFiles = files || [];
          }).catch(function () { knownResultFiles = []; });
          log('info', '▶ Bắt đầu test — ' + new Date(d.timestamp).toLocaleTimeString());
          log('info', '─'.repeat(58));
        } else if (d.status === 'finished') {
          setRunning(false);
          var sec = (d.elapsed / 1000).toFixed(1);
          var ok = d.exitCode === 0;
          log('info', '─'.repeat(58));
          if (d.exitCode === null && d.signal) {
            log('error', '💀 k6 bị kill bởi signal: ' + d.signal + ' sau ' + sec + ' giây');
            log('error', '   Nguyên nhân có thể: hết RAM, process bị trùng, hoặc hệ thống kill');
          } else {
            log(ok ? 'summary' : 'error',
              (ok ? '✅' : '❌') + ' Hoàn thành trong ' + sec + ' giây  (exit ' + d.exitCode + ')');
          }
          progressLabel.textContent = ok ? 'Hoàn thành ✓' : 'Thất bại ✗';
          // Auto-fetch detailed report (result may already be in server memory)
          fetchLatestResult(0);
          setTimeout(loadHistory, 2000);
        }
        break;
      case 'result_ready':
        // Server captured JSON from k6 stdout — fetch it immediately from memory
        log('info', '⚡ Kết quả sẵn sàng trong bộ nhớ');
        fetch('/api/latest-result').then(function (r) {
          if (r.ok) return r.json();
          return null;
        }).then(function (resp) {
          if (resp && resp.data && resp.data.metrics) {
            displayResult(resp.data);
            loadHistory();
          }
        }).catch(function () {});
        break;
      case 'stdout':
      case 'stderr':
        log(classify(d.message), d.message);
        parseProgress(d.message);
        parseSummary(d.message);
        break;
      case 'error':
        log('error', 'LỖI: ' + d.message);
        break;
    }
  }

  /* ========== CONSOLE ========== */
  function classify(line) {
    if (line.includes('level=error') || line.includes('level=warning')) return 'error';
    if (line.includes('level=info')) return 'info';
    if (/\[\s*\d+%\s*\]/.test(line)) return 'progress';
    if (line.includes('════') || line.includes('────') || /Lỗi|Tổng request|Thời gian|Request\/giây|Dữ liệu|Báo cáo/i.test(line)) return 'summary';
    return 'stderr';
  }

  function log(cls, text) {
    var w = consoleOutput.querySelector('.console-welcome');
    if (w) w.remove();
    var el = document.createElement('div');
    el.className = 'console-line ' + cls;
    el.textContent = text;
    consoleOutput.appendChild(el);
    consoleText += text + '\n';
    consoleOutput.scrollTop = consoleOutput.scrollHeight;
  }

  function clearConsole() { consoleOutput.innerHTML = ''; consoleText = ''; }

  function copyConsole() {
    navigator.clipboard.writeText(consoleText).then(function () {
      copyBtn.textContent = '✅';
      setTimeout(function () { copyBtn.textContent = '📋'; }, 1200);
    });
  }

  /* ========== PROGRESS ========== */
  function parseProgress(line) {
    // k6 progress format examples:
    // "default   [  10% ] 00m05.3s, 500/7000 shared iters"
    // "default   [ 100% ] 01m30.0s, 7000/7000 shared iters"
    // "default ✓ [ 100% ] 01m30.0s, 7000/7000 shared iters"
    var m = line.match(/\[\s*(\d+)\s*%\s*\]/);
    if (!m) {
      // Also try without brackets: e.g. "10% complete"
      m = line.match(/(\d+)%/);
      if (!m) return;
    }
    var pct = parseInt(m[1], 10);
    progressContainer.classList.remove('hidden');
    progressFill.style.width = pct + '%';
    progressPercent.textContent = pct + '%';
    progressLabel.textContent = pct >= 100 ? 'Hoàn thành ✓' : 'Đang chạy…';
    var detail = '';
    // Match time: "00m05.3s" or "1m30.0s/5m0s"
    var tm = line.match(/(\d+m[\d.]+s)/);
    if (tm) detail += tm[1] + ' đã chạy';
    // Match iterations: "500/7000 shared iters" or "500/7000"
    var it = line.match(/(\d+)\/(\d+)\s*(?:shared\s+iters|VUs)/);
    if (!it) it = line.match(/(\d+)\/(\d+)/);
    if (it) detail += (detail ? ' · ' : '') + it[1] + '/' + it[2] + ' lượt';
    if (detail) progressDetails.textContent = detail;
  }

  /* ========== SUMMARY (quick cards from text) ========== */
  function parseSummary(line) {
    if (line.includes('Báo cáo Test Hiệu năng')) { inSummary = true; summaryLines = []; return; }
    if (inSummary) {
      if (line.includes('========') && summaryLines.length > 0) {
        inSummary = false;
        showQuickMetrics(summaryLines);
        return;
      }
      if (!line.includes('────')) summaryLines.push(line);
    }
  }

  function showQuickMetrics(lines) {
    var kv = {};
    lines.forEach(function (l) { var m = l.match(/^(.+?):\s*(.+)$/); if (m) kv[m[1].trim()] = m[2].trim(); });
    metricsGrid.classList.remove('hidden');
    setCard('metricRequests', 'metricRequestsValue', kv['Tổng request'], null);
    setCard('metricLoginRate', 'metricLoginRateValue', kv['Lỗi đăng nhập'], rateClass(parseFloat(kv['Lỗi đăng nhập'])));
    setCard('metricApiRate', 'metricApiRateValue', kv['Lỗi API'], rateClass(parseFloat(kv['Lỗi API'])));
    setCard('metricP95', 'metricP95Value', kv['Thời gian P95'], msClass(parseFloat(kv['Thời gian P95'])));
  }

  function setCard(cid, vid, text, cls) {
    if (!text) return;
    $(vid).textContent = text;
    $(cid).className = 'metric-card' + (cls ? ' ' + cls : '');
  }
  function rateClass(v) { return v === 0 ? 'success' : v < 10 ? 'warning' : 'danger'; }
  function msClass(v) { return v < 1000 ? 'success' : v < 5000 ? 'warning' : 'danger'; }

  /* ========== DETAILED REPORT (from JSON) ========== */
  function displayResult(data) {
    if (!data || !data.metrics) return;
    var m = data.metrics;
    metricsGrid.classList.remove('hidden');
    if (m.http_reqs) setCard('metricRequests', 'metricRequestsValue', String(m.http_reqs.values.count), null);
    if (m.login_failures) {
      var lr = (m.login_failures.values.rate * 100).toFixed(2) + '%';
      setCard('metricLoginRate', 'metricLoginRateValue', lr, rateClass(parseFloat(lr)));
    }
    if (m.api_failures) {
      var ar = (m.api_failures.values.rate * 100).toFixed(2) + '%';
      setCard('metricApiRate', 'metricApiRateValue', ar, rateClass(parseFloat(ar)));
    }
    if (m.testgov2_request_duration) {
      var p = m.testgov2_request_duration.values['p(95)'].toFixed(2) + 'ms';
      setCard('metricP95', 'metricP95Value', p, msClass(parseFloat(p)));
    } else if (m.http_req_duration) {
      var p2 = m.http_req_duration.values['p(95)'].toFixed(2) + 'ms';
      setCard('metricP95', 'metricP95Value', p2, msClass(parseFloat(p2)));
    }
    renderDetailedReport(data);
  }

  function exportReport(data) {
    var win = window.open('', '_blank');
    if (!win) {
      alert('Vui lòng cho phép trình duyệt mở tab mới để hiển thị báo cáo.');
      return;
    }

    var m = data.metrics;
    var meta = data.metadata || {};
    var testRunDurationMs = data.state ? data.state.testRunDurationMs : null;
    var durationText = testRunDurationMs ? (testRunDurationMs / 1000).toFixed(1) + ' giây' : '—';

    var allPass = true;
    if (m.login_failures && m.login_failures.values.rate >= 0.10) allPass = false;
    if (m.api_failures && m.api_failures.values.rate >= 0.10) allPass = false;
    if (m.http_req_failed && m.http_req_failed.values.rate >= 0.10) allPass = false;
    if (m.testgov2_request_duration && m.testgov2_request_duration.values['p(95)'] >= 5000) allPass = false;

    var statusTitle = allPass ? 'ĐẠT (PASS)' : 'KHÔNG ĐẠT (FAIL)';
    var statusColor = allPass ? '#16a34a' : '#dc2626';
    var statusBg = allPass ? '#f0fdf4' : '#fef2f2';
    var statusBorder = allPass ? '#bbf7d0' : '#fecaca';

    function fmtMs(val) {
      return (val !== undefined && val !== null) ? val.toFixed(2) + ' ms' : '—';
    }

    function renderTimingRow(label, metric) {
      if (!metric) return '<tr><td class="label"><strong>' + label + '</strong></td><td colspan="7" style="text-align:center; color:#94a3b8;">Không có dữ liệu</td></tr>';
      var d = metric.values;
      return '<tr>' +
        '<td class="label"><strong>' + label + '</strong></td>' +
        '<td>' + fmtMs(d.min) + '</td>' +
        '<td>' + fmtMs(d.avg) + '</td>' +
        '<td>' + fmtMs(d.med) + '</td>' +
        '<td>' + fmtMs(d.max) + '</td>' +
        '<td>' + fmtMs(d['p(90)']) + '</td>' +
        '<td style="font-weight:600;">' + fmtMs(d['p(95)']) + '</td>' +
        '<td>' + fmtMs(d['p(99)']) + '</td>' +
        '</tr>';
    }

    function renderErrorRow(label, metric) {
      if (!metric) return '<tr><td>' + label + '</td><td colspan="2" style="text-align:center; color:#94a3b8;">Không có dữ liệu</td></tr>';
      var v = metric.values;
      var rate = (v.rate * 100).toFixed(2) + '%';
      var isBad = v.rate >= 0.10;
      return '<tr>' +
        '<td>' + label + '</td>' +
        '<td class="' + (isBad ? 'bad' : 'good') + '">' + rate + '</td>' +
        '<td>' + (v.passes + v.fails) + '</td>' +
        '</tr>';
    }

    function renderChecksSummary(checks) {
      if (!checks) return '<p style="color:#64748b; font-style:italic; font-size:13px; margin:0;">Không cấu hình checks kiểm tra.</p>';
      var cv = checks.values;
      var total = cv.passes + cv.fails;
      var rate = (cv.rate * 100).toFixed(2) + '%';
      return '<table class="data-table" style="margin:0; width:100%;">' +
        '<tr><td style="font-weight:600; width:50%;">Tổng số checks</td><td>' + total + '</td></tr>' +
        '<tr><td style="font-weight:600; color:#16a34a;">Đạt (Pass)</td><td class="good">' + cv.passes + '</td></tr>' +
        '<tr><td style="font-weight:600; color:#dc2626;">Không đạt (Fail)</td><td class="' + (cv.fails > 0 ? 'bad' : 'good') + '">' + cv.fails + '</td></tr>' +
        '<tr><td style="font-weight:600;">Tỷ lệ đạt</td><td style="font-weight:700;">' + rate + '</td></tr>' +
        '</table>';
    }

    function renderExportPerApiTable() {
      var perApi = extractPerApiMetrics(m);
      if (Object.keys(perApi).length === 0 && data.root_group) {
        perApi = extractPerApiFromChecks(data.root_group);
      }
      var apiNames = Object.keys(perApi);
      if (apiNames.length === 0) return '<tr><td colspan="10" style="text-align:center; color:#94a3b8;">Không có dữ liệu chi tiết từng API</td></tr>';
      
      apiNames.sort(function (a, b) {
        var aAvg = perApi[a].http_req_duration ? perApi[a].http_req_duration.values.avg : 0;
        var bAvg = perApi[b].http_req_duration ? perApi[b].http_req_duration.values.avg : 0;
        return bAvg - aAvg;
      });

      var rows = [];
      for (var j = 0; j < apiNames.length; j++) {
        var apiN = apiNames[j];
        var apiD = perApi[apiN];
        var dur = apiD.http_req_duration ? apiD.http_req_duration.values : null;
        var reqs = apiD.http_reqs ? apiD.http_reqs.values : null;
        var fail = apiD.http_req_failed ? apiD.http_req_failed.values : null;
        var fRate = fail ? (fail.rate * 100).toFixed(1) : '0.0';
        
        var totalCount = reqs ? reqs.count : 0;
        var failCount = fail ? fail.passes : 0;
        var successCount = fail ? fail.fails : totalCount;
        
        var method = apiN.split(' ')[0];
        var cleanPath = apiN.substring(method.length + 1);
        
        var badgeClass = '';
        if (method === 'GET') badgeClass = 'badge badge-get';
        else if (method === 'POST') badgeClass = 'badge badge-post';
        else if (method === 'PUT') badgeClass = 'badge badge-put';
        else if (method === 'PATCH') badgeClass = 'badge badge-patch';
        else if (method === 'DELETE') badgeClass = 'badge badge-delete';
        else badgeClass = 'badge badge-other';
        
        var methodBadge = '<span class="' + badgeClass + '">' + method + '</span>';
        
        var successText = successCount;
        var failText = failCount > 0 
          ? '<span style="color:#dc2626; font-weight:600;">' + failCount + '</span>' 
          : '0';

        rows.push(
          '<tr>' +
          '<td>' + (j + 1) + '</td>' +
          '<td style="white-space:nowrap; text-align:left;">' + methodBadge + ' ' + escHtml(cleanPath) + '</td>' +
          '<td>' + totalCount + '</td>' +
          '<td>' + successText + '</td>' +
          '<td>' + failText + '</td>' +
          '<td>' + (dur ? dur.min.toFixed(0) + ' ms' : '—') + '</td>' +
          '<td>' + (dur ? dur.avg.toFixed(0) + ' ms' : '—') + '</td>' +
          '<td>' + (dur ? dur.max.toFixed(0) + ' ms' : '—') + '</td>' +
          '<td style="font-weight:600;">' + (dur ? dur['p(95)'].toFixed(0) + ' ms' : '—') + '</td>' +
          '<td class="' + (parseFloat(fRate) > 0 ? 'bad' : 'good') + '">' + fRate + '%</td>' +
          '</tr>'
        );
      }
      return rows.join('');
    }

    function renderFailedAccountsTable() {
      if (!data.failedAccounts || data.failedAccounts.length === 0) return '';
      var rows = data.failedAccounts.map(function (acc, index) {
        return '<tr>' +
          '<td>' + (index + 1) + '</td>' +
          '<td style="text-align:left; font-family:monospace; word-break:break-all;">' + escHtml(acc.user) + '</td>' +
          '<td style="color:#dc2626; text-align:left;">' + escHtml(acc.error) + '</td>' +
          '</tr>';
      }).join('');
      return '<div class="section" style="page-break-inside: avoid;">\n' +
        '  <div class="section-title" style="color: #dc2626; border-bottom: 1.5px solid #fca5a5;">6. Danh sách tài khoản đăng nhập thất bại (' + data.failedAccounts.length + ' tài khoản)</div>\n' +
        '  <table class="data-table">\n' +
        '    <thead>\n' +
        '      <tr>\n' +
        '        <th style="width: 60px;">STT</th>\n' +
        '        <th>Tài khoản (Email)</th>\n' +
        '        <th>Lỗi chi tiết</th>\n' +
        '      </tr>\n' +
        '    </thead>\n' +
        '    <tbody>\n' +
        rows + '\n' +
        '    </tbody>\n' +
        '  </table>\n' +
        '</div>\n';
    }

    var maxVus = m.vus_max ? m.vus_max.values.value : (m.vus ? m.vus.values.max : '—');
    var totalRequests = m.http_reqs ? m.http_reqs.values.count : '—';
    var throughput = m.http_reqs ? m.http_reqs.values.rate.toFixed(2) + ' req/s' : '—';
    var successRate = m.http_req_failed ? ((1 - m.http_req_failed.values.rate) * 100).toFixed(2) + '%' : '100.0%';

    var htmlStr = '<!DOCTYPE html>\n' +
      '<html lang="vi">\n' +
      '<head>\n' +
      '  <meta charset="UTF-8">\n' +
      '  <title>Báo cáo Kết quả Kiểm thử Hiệu năng Hệ thống</title>\n' +
      '  <style>\n' +
      '    body {\n' +
      '      font-family: "Segoe UI", Arial, sans-serif;\n' +
      '      color: #1e293b;\n' +
      '      line-height: 1.5;\n' +
      '      background: #fff;\n' +
      '      margin: 0;\n' +
      '      padding: 40px;\n' +
      '    }\n' +
      '    .report-title-container {\n' +
      '      text-align: center;\n' +
      '      margin-bottom: 30px;\n' +
      '      border-bottom: 2px solid #0f172a;\n' +
      '      padding-bottom: 20px;\n' +
      '    }\n' +
      '    .report-title-container h1 {\n' +
      '      font-size: 24px;\n' +
      '      text-transform: uppercase;\n' +
      '      margin: 0 0 10px 0;\n' +
      '      color: #0f172a;\n' +
      '      letter-spacing: 0.5px;\n' +
      '    }\n' +
      '    .report-title-container p {\n' +
      '      margin: 0;\n' +
      '      color: #64748b;\n' +
      '      font-size: 13px;\n' +
      '    }\n' +
      '    .section {\n' +
      '      margin-bottom: 30px;\n' +
      '      page-break-inside: avoid;\n' +
      '    }\n' +
      '    .section-title {\n' +
      '      font-size: 15px;\n' +
      '      font-weight: 700;\n' +
      '      text-transform: uppercase;\n' +
      '      border-bottom: 1.5px solid #cbd5e1;\n' +
      '      padding-bottom: 6px;\n' +
      '      margin-bottom: 15px;\n' +
      '      color: #0f172a;\n' +
      '    }\n' +
      '    .grid-2 {\n' +
      '      display: grid;\n' +
      '      grid-template-columns: 1fr 1fr;\n' +
      '      gap: 20px;\n' +
      '    }\n' +
      '    .info-table {\n' +
      '      width: 100%;\n' +
      '      border-collapse: collapse;\n' +
      '    }\n' +
      '    .info-table td {\n' +
      '      padding: 8px 12px;\n' +
      '      font-size: 13px;\n' +
      '      border-bottom: 1px solid #f1f5f9;\n' +
      '      text-align: left;\n' +
      '    }\n' +
      '    .info-table td.label {\n' +
      '      font-weight: 600;\n' +
      '      color: #475569;\n' +
      '      width: 40%;\n' +
      '    }\n' +
      '    .data-table {\n' +
      '      width: 100%;\n' +
      '      border-collapse: collapse;\n' +
      '      margin-top: 10px;\n' +
      '      margin-bottom: 10px;\n' +
      '    }\n' +
      '    .data-table th, .data-table td {\n' +
      '      border: 1px solid #cbd5e1;\n' +
      '      padding: 10px 12px;\n' +
      '      font-size: 12px;\n' +
      '      text-align: center;\n' +
      '    }\n' +
      '    .data-table td.label {\n' +
      '      text-align: left;\n' +
      '    }\n' +
      '    .data-table th {\n' +
      '      background: #f8fafc;\n' +
      '      font-weight: 600;\n' +
      '      color: #334155;\n' +
      '    }\n' +
      '    .data-table td.good {\n' +
      '      color: #16a34a;\n' +
      '      font-weight: 600;\n' +
      '    }\n' +
      '    .data-table td.bad {\n' +
      '      color: #dc2626;\n' +
      '      font-weight: 600;\n' +
      '    }\n' +
      '    .status-banner {\n' +
      '      padding: 16px 20px;\n' +
      '      border-radius: 8px;\n' +
      '      border: 1px solid;\n' +
      '      margin-bottom: 30px;\n' +
      '      text-align: center;\n' +
      '      font-weight: 700;\n' +
      '      font-size: 16px;\n' +
      '    }\n' +
      '    .badge {\n' +
      '      display: inline-block;\n' +
      '      padding: 3px 6px;\n' +
      '      font-size: 10px;\n' +
      '      font-weight: 700;\n' +
      '      border-radius: 4px;\n' +
      '      color: #fff;\n' +
      '      text-transform: uppercase;\n' +
      '      margin-right: 6px;\n' +
      '    }\n' +
      '    .badge-get { background-color: #0ea5e9; }\n' +
      '    .badge-post { background-color: #22c55e; }\n' +
      '    .badge-put { background-color: #f59e0b; }\n' +
      '    .badge-patch { background-color: #8b5cf6; }\n' +
      '    .badge-delete { background-color: #ef4444; }\n' +
      '    .badge-other { background-color: #64748b; }\n' +
      '    .print-actions {\n' +
      '      display: flex;\n' +
      '      justify-content: flex-end;\n' +
      '      gap: 10px;\n' +
      '      margin-bottom: 30px;\n' +
      '    }\n' +
      '    .btn-print {\n' +
      '      background: #6366f1;\n' +
      '      color: white;\n' +
      '      border: none;\n' +
      '      padding: 10px 20px;\n' +
      '      border-radius: 6px;\n' +
      '      font-weight: 600;\n' +
      '      cursor: pointer;\n' +
      '      font-family: inherit;\n' +
      '    }\n' +
      '    .btn-close {\n' +
      '      background: #f1f5f9;\n' +
      '      color: #475569;\n' +
      '      border: 1px solid #cbd5e1;\n' +
      '      padding: 10px 20px;\n' +
      '      border-radius: 6px;\n' +
      '      font-weight: 600;\n' +
      '      cursor: pointer;\n' +
      '      font-family: inherit;\n' +
      '    }\n' +
      '    @media print {\n' +
      '      .print-actions { display: none; }\n' +
      '      body { padding: 0; }\n' +
      '    }\n' +
      '  </style>\n' +
      '</head>\n' +
      '<body>\n' +
      '  <div class="print-actions">\n' +
      '    <button class="btn-close" onclick="window.close()">Đóng cửa sổ</button>\n' +
      '    <button class="btn-print" onclick="window.print()">In báo cáo / Lưu PDF</button>\n' +
      '  </div>\n' +
      '  <div class="report-title-container">\n' +
      '    <h1>Báo cáo Kết quả Kiểm thử Hiệu năng Hệ thống</h1>\n' +
      '    <p>Thời gian xuất báo cáo: ' + new Date().toLocaleString('vi-VN') + ' | Được tạo bởi k6 Runner Dashboard</p>\n' +
      '  </div>\n' +
      '  <div class="status-banner" style="background: ' + statusBg + '; color: ' + statusColor + '; border-color: ' + statusBorder + ';">\n' +
      '    KẾT QUẢ ĐÁNH GIÁ CHUNG: ' + statusTitle + '<br>\n' +
      '    <span style="font-size:13px; font-weight:normal; color:#475569; margin-top:5px; display:inline-block;">\n' +
      (allPass ? 'Tất cả các tiêu chí lỗi (Đăng nhập, API, HTTP Request) nằm trong ngưỡng cho phép (< 10%) và thời gian phản hồi đạt yêu cầu.'
               : 'Cảnh báo: Tỷ lệ lỗi vượt quá ngưỡng cho phép (>= 10%) hoặc có chỉ số thời gian phản hồi vượt mức giới hạn.') + '\n' +
      '    </span>\n' +
      '  </div>\n' +
      '  <div class="section">\n' +
      '    <div class="section-title">1. Thông tin cấu hình kiểm thử (Test Configurations)</div>\n' +
      '    <div class="grid-2">\n' +
      '      <table class="info-table">\n' +
      '        <tr><td class="label">API Base URL</td><td>' + escHtml(meta.apiBaseUrl || '—') + '</td></tr>\n' +
      '        <tr><td class="label">Web Base URL</td><td>' + escHtml(meta.webBaseUrl || '—') + '</td></tr>\n' +
      '        <tr><td class="label">Chế độ kiểm thử</td><td>' + (meta.executor === 'shared-iterations' ? 'Chia sẻ lượt chạy (Shared Iterations)' : 'Người dùng ảo cố định (Constant VUs)') + '</td></tr>\n' +
      '        <tr><td class="label">Thời gian chạy thực tế</td><td>' + (meta.timestamp ? new Date(meta.timestamp).toLocaleString('vi-VN') : '—') + '</td></tr>\n' +
      '      </table>\n' +
      '      <table class="info-table">\n' +
      '        <tr><td class="label">Số người dùng ảo (VU)</td><td>' + (meta.vus || '—') + ' VUs (Dải: ' + (meta.userStart || '—') + ' - ' + (meta.userEnd || '—') + ')</td></tr>\n' +
      '        <tr><td class="label">Thời lượng / Số lượt</td><td>' + (meta.executor === 'shared-iterations' ? (meta.iterations || '—') + ' lượt chạy' : (meta.duration || '—')) + '</td></tr>\n' +
      '        <tr><td class="label">Mục tiêu (Course / Content)</td><td>Course ID: ' + (meta.courseId || '—') + ' | Content ID: ' + (meta.courseContentId || '—') + '</td></tr>\n' +
      '        <tr><td class="label">Chủ đề (Topic / Role)</td><td>Topic ID: ' + (meta.topicId || '—') + ' | Role ID: ' + (meta.roleId || '—') + '</td></tr>\n' +
      '      </table>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="section">\n' +
      '    <div class="section-title">2. Tóm tắt kết quả (Executive Summary)</div>\n' +
      '    <table class="data-table">\n' +
      '      <thead>\n' +
      '        <tr>\n' +
      '          <th>Chỉ số chính (KPIs)</th>\n' +
      '          <th>Giá trị thực tế</th>\n' +
      '          <th>Mô tả</th>\n' +
      '        </tr>\n' +
      '      </thead>\n' +
      '      <tbody>\n' +
      '        <tr><td class="label"><strong>Người dùng ảo tối đa (Max VUs)</strong></td><td>' + maxVus + '</td><td>Số luồng người dùng chạy đồng thời lớn nhất.</td></tr>\n' +
      '        <tr><td class="label"><strong>Thời gian chạy test (Duration)</strong></td><td>' + durationText + '</td><td>Tổng thời gian tiến hành cuộc kiểm thử tải.</td></tr>\n' +
      '        <tr><td class="label"><strong>Tổng số yêu cầu (Total Requests)</strong></td><td>' + totalRequests + '</td><td>Tổng số request HTTP gửi đi trong suốt quá trình test.</td></tr>\n' +
      '        <tr><td class="label"><strong>Thông lượng (Throughput)</strong></td><td>' + throughput + '</td><td>Tốc độ xử lý yêu cầu trung bình của hệ thống trên giây (RPS).</td></tr>\n' +
      '        <tr><td class="label"><strong>Tỷ lệ thành công (Success Rate)</strong></td><td class="' + (m.http_req_failed && m.http_req_failed.values.rate < 0.1 ? 'good' : 'bad') + '">' + successRate + '</td><td>Tỷ lệ yêu cầu hoàn thành không lỗi.</td></tr>\n' +
      '        <tr><td class="label"><strong>Dung lượng truyền tải (Data Transferred)</strong></td><td>Nhận: ' + (m.data_received ? fmtBytes(m.data_received.values.count) : '—') + ' | Gửi: ' + (m.data_sent ? fmtBytes(m.data_sent.values.count) : '—') + '</td><td>Tổng lượng băng thông dữ liệu mạng được truyền qua lại.</td></tr>\n' +
      '      </tbody>\n' +
      '    </table>\n' +
      '  </div>\n' +
      '  <div class="section">\n' +
      '    <div class="section-title">3. Thống kê thời gian phản hồi (Response Time Metrics)</div>\n' +
      '    <table class="data-table">\n' +
      '      <thead>\n' +
      '        <tr>\n' +
      '          <th>Loại chỉ số</th>\n' +
      '          <th>Min (Nhỏ nhất)</th>\n' +
      '          <th>Avg (Trung bình)</th>\n' +
      '          <th>Median (Trung vị)</th>\n' +
      '          <th>Max (Lớn nhất)</th>\n' +
      '          <th>P90 (90%)</th>\n' +
      '          <th>P95 (95%)</th>\n' +
      '          <th>P99 (99%)</th>\n' +
      '        </tr>\n' +
      '      </thead>\n' +
      '      <tbody>\n' +
      renderTimingRow('Tổng thời gian HTTP (Duration)', m.http_req_duration) + '\n' +
      renderTimingRow('Thời gian chờ (TTFB)', m.http_req_waiting) + '\n' +
      renderTimingRow('Thời gian kết nối (Connecting)', m.http_req_connecting) + '\n' +
      renderTimingRow('Bắt tay bảo mật (TLS Handshaking)', m.http_req_tls_handshaking) + '\n' +
      '      </tbody>\n' +
      '    </table>\n' +
      '    <p style="font-size:11px; color:#64748b; margin-top:5px; font-style:italic; text-align:left;">\n' +
      '      * Đơn vị đo: mili-giây (ms). Các chỉ số P90, P95, P99 thể hiện thời gian phản hồi tối đa của 90%, 95%, 99% lượng request.\n' +
      '    </p>\n' +
      '  </div>\n' +
      '  <div class="section">\n' +
      '    <div class="section-title">4. Thống kê lỗi & Kết quả kiểm tra (Errors & Verification)</div>\n' +
      '    <div class="grid-2">\n' +
      '      <div>\n' +
      '        <h4 style="margin:0 0 8px 0; color:#334155; text-align:left;">Tỷ lệ lỗi (Error Rates)</h4>\n' +
      '        <table class="data-table" style="margin:0; width:100%;">\n' +
      '          <thead>\n' +
      '            <tr>\n' +
      '              <th>Loại giao dịch</th>\n' +
      '              <th>Tỷ lệ lỗi</th>\n' +
      '              <th>Tổng mẫu</th>\n' +
      '            </tr>\n' +
      '          </thead>\n' +
      '          <tbody>\n' +
      renderErrorRow('Đăng nhập (Excel)', m.login_failures) + '\n' +
      renderErrorRow('Các API Hệ thống', m.api_failures) + '\n' +
      renderErrorRow('Tất cả HTTP Requests', m.http_req_failed) + '\n' +
      '          </tbody>\n' +
      '        </table>\n' +
      '      </div>\n' +
      '      <div>\n' +
      '        <h4 style="margin:0 0 8px 0; color:#334155; text-align:left;">Kết quả kiểm tra (Checks)</h4>\n' +
      renderChecksSummary(m.checks) + '\n' +
      '      </div>\n' +
      '    </div>\n' +
      '  </div>\n' +
      '  <div class="section">\n' +
      '    <div class="section-title">5. Thống kê chi tiết từng API Endpoint (Per-API Statistics)</div>\n' +
      '    <table class="data-table">\n' +
      '      <thead>\n' +
      '        <tr>\n' +
      '          <th>#</th>\n' +
      '          <th>API Endpoint (Phương thức & Đường dẫn)</th>\n' +
      '          <th>Tổng số</th>\n' +
      '          <th>Hoàn thành</th>\n' +
      '          <th>Thất bại</th>\n' +
      '          <th>Min</th>\n' +
      '          <th>Avg</th>\n' +
      '          <th>Max</th>\n' +
      '          <th>P95</th>\n' +
      '          <th>Tỷ lệ lỗi</th>\n' +
      '        </tr>\n' +
      '      </thead>\n' +
      '      <tbody>\n' +
      renderExportPerApiTable() + '\n' +
      '      </tbody>\n' +
      '    </table>\n' +
      '  </div>\n' +
      renderFailedAccountsTable() + '\n' +
      '  <script>\n' +
      '    window.onload = function() {\n' +
      '      setTimeout(function() {\n' +
      '        window.print();\n' +
      '      }, 500);\n' +
      '    };\n' +
      '  </script>\n' +
      '</body>\n' +
      '</html>';

    win.document.write(htmlStr);
    win.document.close();
  }

  function renderDetailedReport(data) {
    var m = data.metrics;
    var testRunDurationMs = data.state ? data.state.testRunDurationMs : null;
    var html = '';

    // ── Status banner ──
    var allPass = true;
    if (m.login_failures && m.login_failures.values.rate >= 0.10) allPass = false;
    if (m.api_failures && m.api_failures.values.rate >= 0.10) allPass = false;
    if (m.http_req_failed && m.http_req_failed.values.rate >= 0.10) allPass = false;
    if (m.testgov2_request_duration && m.testgov2_request_duration.values['p(95)'] >= 5000) allPass = false;
    
    html += '<div class="report-header-row" style="display: flex; gap: 16px; justify-content: space-between; align-items: center; margin-bottom: 16px;">' +
      '<div class="report-status ' + (allPass ? 'pass' : 'fail') + '" style="flex: 1; margin: 0; text-align: left; line-height: 1.4;">' +
      (allPass ? '✅ TEST ĐẠT — Tất cả chỉ số nằm trong ngưỡng cho phép'
               : '❌ TEST KHÔNG ĐẠT — Một số chỉ số vượt ngưỡng cho phép') + '</div>' +
      '<button id="exportReportBtn" type="button" class="btn btn-run" style="flex: 0 0 auto; width: auto; height: 50px; margin: 0; padding: 0 24px; border-radius: var(--radius-lg); font-size: 13px; display: flex; align-items: center; gap: 8px;">' +
        '📄 <span>Xuất báo cáo</span>' +
      '</button>' +
    '</div>';

    // ── 0.1 Load Test Config Parameters (if available) ──
    if (data.metadata) {
      var meta = data.metadata;
      var execDetail = meta.executor === 'shared-iterations'
        ? 'Chia sẻ lượt (' + (meta.iterations || '—') + ' lượt)'
        : 'VU cố định (' + (meta.duration || '—') + ')';
      
      html += '<div class="report-card" style="margin-bottom:16px">' +
        '<div class="report-card-header">⚙️ Tham số cấu hình chạy test</div>' +
        '<div class="report-config-grid">' +
          '<div><strong style="color:var(--text-secondary)">API Base URL:</strong> <div style="font-family:var(--font-mono);margin-top:4px;word-break:break-all;color:var(--text-primary)">' + escHtml(meta.apiBaseUrl || '—') + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Web Base URL:</strong> <div style="font-family:var(--font-mono);margin-top:4px;word-break:break-all;color:var(--text-primary)">' + escHtml(meta.webBaseUrl || '—') + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Chế độ chạy:</strong> <div style="margin-top:4px;color:var(--text-primary)">' + execDetail + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Số Users (VU):</strong> <div style="margin-top:4px;color:var(--text-primary)">' + (meta.vus || '—') + ' VUs (Dải: ' + (meta.userStart || '—') + ' - ' + (meta.userEnd || '—') + ')</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Course / Content ID:</strong> <div style="margin-top:4px;color:var(--text-primary)">' + (meta.courseId || '—') + ' / ' + (meta.courseContentId || '—') + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Topic / Role ID:</strong> <div style="margin-top:4px;color:var(--text-primary)">' + (meta.topicId || '—') + ' / ' + (meta.roleId || '—') + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Thời gian nghỉ (sleep):</strong> <div style="margin-top:4px;color:var(--text-primary)">' + (meta.sleepSeconds != null ? meta.sleepSeconds + 's' : '—') + '</div></div>' +
          '<div><strong style="color:var(--text-secondary)">Thời gian chạy thực tế:</strong> <div style="margin-top:4px;color:var(--text-primary)">' + (meta.timestamp ? new Date(meta.timestamp).toLocaleString('vi-VN') : '—') + '</div></div>' +
        '</div>' +
      '</div>';
    }

    // ── 0. Load Test Overview Grid ──
    var maxVus = m.vus_max ? m.vus_max.values.value : (m.vus ? m.vus.values.max : '—');
    var durationText = testRunDurationMs ? (testRunDurationMs / 1000).toFixed(1) + 's' : '—';
    var totalRequests = m.http_reqs ? m.http_reqs.values.count : '—';
    var throughput = m.http_reqs ? m.http_reqs.values.rate.toFixed(2) + ' req/s' : '—';
    var successRate = m.http_req_failed ? ((1 - m.http_req_failed.values.rate) * 100).toFixed(2) + '%' : '100.0%';
    var dataReceived = m.data_received ? fmtBytes(m.data_received.values.count) : '—';
    var dataSent = m.data_sent ? fmtBytes(m.data_sent.values.count) : '—';

    html += '<div class="report-overview-grid">' +
      '<div class="overview-card">' +
        '<div class="overview-card-value">' + maxVus + '</div>' +
        '<div class="overview-card-label">Virtual Users (VUs)</div>' +
      '</div>' +
      '<div class="overview-card">' +
        '<div class="overview-card-value">' + durationText + '</div>' +
        '<div class="overview-card-label">Thời gian chạy</div>' +
      '</div>' +
      '<div class="overview-card">' +
        '<div class="overview-card-value">' + totalRequests + '</div>' +
        '<div class="overview-card-label">Tổng Request</div>' +
      '</div>' +
      '<div class="overview-card">' +
        '<div class="overview-card-value">' + throughput + '</div>' +
        '<div class="overview-card-label">Thông lượng (RPS)</div>' +
      '</div>' +
      '<div class="overview-card">' +
        '<div class="overview-card-value">' + successRate + '</div>' +
        '<div class="overview-card-label">Tỷ lệ thành công</div>' +
      '</div>' +
      '<div class="overview-card">' +
        '<div class="overview-card-value" style="font-size:11px;word-break:break-all">' + dataReceived + ' / ' + dataSent + '</div>' +
        '<div class="overview-card-label">Nhận / Gửi</div>' +
      '</div>' +
    '</div>';

    function fmtMs(val) {
      return (val !== undefined && val !== null) ? val.toFixed(2) + 'ms' : '—';
    }

    // ── 1. Timing table ──
    if (m.http_req_duration) {
      var d = m.http_req_duration.values;
      html += '<div class="report-card"><div class="report-card-header">⏱️ Thời gian phản hồi</div>' +
        '<table class="report-table"><thead><tr>' +
        '<th>Chỉ số</th><th>Trung bình</th><th>Nhỏ nhất</th><th>Trung vị</th><th>Lớn nhất</th><th>P90</th><th>P95</th><th>P99</th>' +
        '</tr></thead><tbody>' +
        '<tr><td class="label">HTTP Duration</td>' +
        '<td>' + fmtMs(d.avg) + '</td>' +
        '<td>' + fmtMs(d.min) + '</td>' +
        '<td>' + fmtMs(d.med) + '</td>' +
        '<td>' + fmtMs(d.max) + '</td>' +
        '<td>' + fmtMs(d['p(90)']) + '</td>' +
        '<td class="' + (d['p(95)'] !== undefined ? msClass(d['p(95)']) : '') + '">' + fmtMs(d['p(95)']) + '</td>' +
        '<td>' + fmtMs(d['p(99)']) + '</td></tr>';
      if (m.http_req_waiting) {
        var w = m.http_req_waiting.values;
        html += '<tr><td class="label">Chờ phản hồi (TTFB)</td>' +
          '<td>' + fmtMs(w.avg) + '</td><td>' + fmtMs(w.min) + '</td>' +
          '<td>' + fmtMs(w.med) + '</td><td>' + fmtMs(w.max) + '</td>' +
          '<td>' + fmtMs(w['p(90)']) + '</td><td>' + fmtMs(w['p(95)']) + '</td>' +
          '<td>' + fmtMs(w['p(99)']) + '</td></tr>';
      }
      if (m.http_req_connecting) {
        var c = m.http_req_connecting.values;
        html += '<tr><td class="label">Kết nối</td>' +
          '<td>' + fmtMs(c.avg) + '</td><td>' + fmtMs(c.min) + '</td>' +
          '<td>' + fmtMs(c.med) + '</td><td>' + fmtMs(c.max) + '</td>' +
          '<td>' + fmtMs(c['p(90)']) + '</td><td>' + fmtMs(c['p(95)']) + '</td>' +
          '<td>' + fmtMs(c['p(99)']) + '</td></tr>';
      }
      if (m.http_req_tls_handshaking) {
        var t = m.http_req_tls_handshaking.values;
        html += '<tr><td class="label">TLS Handshake</td>' +
          '<td>' + fmtMs(t.avg) + '</td><td>' + fmtMs(t.min) + '</td>' +
          '<td>' + fmtMs(t.med) + '</td><td>' + fmtMs(t.max) + '</td>' +
          '<td>' + fmtMs(t['p(90)']) + '</td><td>' + fmtMs(t['p(95)']) + '</td>' +
          '<td>' + fmtMs(t['p(99)']) + '</td></tr>';
      }
      html += '</tbody></table></div>';
    }

    // ── 2. Error rates + Network (side by side) ──
    html += '<div class="report-row-pair">';

    // Error rates
    html += '<div class="report-card"><div class="report-card-header">❌ Tỷ lệ lỗi</div>' +
      '<table class="report-table"><thead><tr><th>Loại</th><th>Tỷ lệ</th><th>Tổng mẫu</th><th>Kết quả</th></tr></thead><tbody>';
    if (m.login_failures) {
      var lv = m.login_failures.values;
      var lr2 = (lv.rate * 100).toFixed(2);
      html += '<tr><td class="label">Đăng nhập</td><td class="' + rateClass(parseFloat(lr2)) + '">' + lr2 + '%</td>' +
        '<td>' + (lv.passes + lv.fails) + '</td>' +
        '<td>' + statusBadge(parseFloat(lr2)) + '</td></tr>';
    }
    if (m.api_failures) {
      var av = m.api_failures.values;
      var ar2 = (av.rate * 100).toFixed(2);
      html += '<tr><td class="label">API</td><td class="' + rateClass(parseFloat(ar2)) + '">' + ar2 + '%</td>' +
        '<td>' + (av.passes + av.fails) + '</td>' +
        '<td>' + statusBadge(parseFloat(ar2)) + '</td></tr>';
    }
    if (m.http_req_failed) {
      var hv = m.http_req_failed.values;
      var hr = (hv.rate * 100).toFixed(2);
      html += '<tr><td class="label">HTTP Request</td><td class="' + rateClass(parseFloat(hr)) + '">' + hr + '%</td>' +
        '<td>' + (hv.passes + hv.fails) + '</td>' +
        '<td>' + statusBadge(parseFloat(hr)) + '</td></tr>';
    }
    html += '</tbody></table></div>';

    // Network & throughput
    html += '<div class="report-card"><div class="report-card-header">📡 Lưu lượng & Thông lượng</div>' +
      '<table class="report-table"><thead><tr><th>Chỉ số</th><th>Giá trị</th><th>Tốc độ</th></tr></thead><tbody>';
    if (m.http_reqs) {
      html += '<tr><td class="label">Tổng request</td><td>' + m.http_reqs.values.count +
        '</td><td>' + m.http_reqs.values.rate.toFixed(2) + ' req/s</td></tr>';
    }
    if (m.iterations) {
      html += '<tr><td class="label">Iterations</td><td>' + m.iterations.values.count +
        '</td><td>' + m.iterations.values.rate.toFixed(2) + ' iter/s</td></tr>';
    }
    if (m.data_received) {
      html += '<tr><td class="label">Dữ liệu nhận</td><td>' + fmtBytes(m.data_received.values.count) +
        '</td><td>' + fmtBytes(m.data_received.values.rate) + '/s</td></tr>';
    }
    if (m.data_sent) {
      html += '<tr><td class="label">Dữ liệu gửi</td><td>' + fmtBytes(m.data_sent.values.count) +
        '</td><td>' + fmtBytes(m.data_sent.values.rate) + '/s</td></tr>';
    }
    html += '</tbody></table></div>';
    html += '</div>'; // end report-row-pair

    // ── 3. Checks ──
    if (m.checks) {
      var cv = m.checks.values;
      var total = cv.passes + cv.fails;
      var passRate = (cv.rate * 100).toFixed(2);
      html += '<div class="report-card"><div class="report-card-header">✅ Kiểm tra (Checks)</div>' +
        '<table class="report-table"><thead><tr><th>Chỉ số</th><th>Giá trị</th></tr></thead><tbody>' +
        '<tr><td class="label">Tổng checks</td><td>' + total + '</td></tr>' +
        '<tr><td class="label">Đạt</td><td class="good">' + cv.passes + '</td></tr>' +
        '<tr><td class="label">Không đạt</td><td class="' + (cv.fails > 0 ? 'bad' : 'good') + '">' + cv.fails + '</td></tr>' +
        '<tr><td class="label">Tỷ lệ đạt</td><td class="' + (parseFloat(passRate) >= 90 ? 'good' : 'bad') + '">' + passRate + '%</td></tr>' +
        '</tbody></table></div>';
    }

    // ── 4. Per-API detailed table ──
    var perApi = extractPerApiMetrics(m);
    if (Object.keys(perApi).length === 0 && data.root_group) {
      perApi = extractPerApiFromChecks(data.root_group);
    }
    var apiNames = Object.keys(perApi);
    if (apiNames.length > 0) {
      apiNames.sort(function (a, b) {
        var aAvg = perApi[a].http_req_duration ? perApi[a].http_req_duration.values.avg : 0;
        var bAvg = perApi[b].http_req_duration ? perApi[b].http_req_duration.values.avg : 0;
        return bAvg - aAvg;
      });
      html += '<div class="report-card"><div class="report-card-header">📋 Thống kê chi tiết từng API (' + apiNames.length + ' Endpoints)</div>' +
        '<div class="report-table-wrap"><table class="report-table">' +
        '<thead><tr>' +
        '<th>#</th>' +
        '<th>API Endpoint</th>' +
        '<th>Tổng số</th>' +
        '<th>Hoàn thành</th>' +
        '<th>Thất bại</th>' +
        '<th>Min</th>' +
        '<th>TB (Avg)</th>' +
        '<th>Max</th>' +
        '<th>Thời gian P95</th>' +
        '<th>Server (TTFB)</th>' +
        '<th>Tỷ lệ lỗi</th>' +
        '</tr></thead><tbody>';
      for (var j = 0; j < apiNames.length; j++) {
        var apiN = apiNames[j];
        var apiD = perApi[apiN];
        var dur = apiD.http_req_duration ? apiD.http_req_duration.values : null;
        var wait = apiD.http_req_waiting ? apiD.http_req_waiting.values : null;
        var reqs = apiD.http_reqs ? apiD.http_reqs.values : null;
        var fail = apiD.http_req_failed ? apiD.http_req_failed.values : null;
        var fRate = fail ? (fail.rate * 100).toFixed(1) : '0.0';
        
        var totalCount = reqs ? reqs.count : 0;
        var failCount = fail ? fail.passes : 0;
        var successCount = fail ? fail.fails : totalCount;
        
        var method = apiN.split(' ')[0];
        var cleanPath = apiN.substring(method.length + 1);
        var methodBadge = '';
        if (method === 'GET') {
          methodBadge = '<span class="badge badge-get">GET</span>';
        } else if (method === 'POST') {
          methodBadge = '<span class="badge badge-post">POST</span>';
        } else if (method === 'PUT') {
          methodBadge = '<span class="badge badge-put">PUT</span>';
        } else if (method === 'PATCH') {
          methodBadge = '<span class="badge badge-patch">PATCH</span>';
        } else if (method === 'DELETE') {
          methodBadge = '<span class="badge badge-delete">DELETE</span>';
        } else {
          methodBadge = '<span class="badge badge-other">' + method + '</span>';
        }

        var successText = '<span class="good" style="font-weight:600">' + successCount + '</span>';
        var failText = failCount > 0 
          ? '<span class="bad" style="font-weight:700">' + failCount + '</span>' 
          : '<span style="color:var(--text-muted)">0</span>';

        html += '<tr><td>' + (j + 1) + '</td>' +
          '<td class="label" style="white-space:nowrap">' + methodBadge + escHtml(cleanPath) + '</td>' +
          '<td>' + totalCount + '</td>' +
          '<td>' + successText + '</td>' +
          '<td>' + failText + '</td>' +
          '<td>' + (dur ? dur.min.toFixed(0) + 'ms' : '—') + '</td>' +
          '<td>' + (dur ? dur.avg.toFixed(0) + 'ms' : '—') + '</td>' +
          '<td>' + (dur ? dur.max.toFixed(0) + 'ms' : '—') + '</td>' +
          '<td class="' + (dur ? msClass(dur['p(95)']) : '') + '">' + (dur ? dur['p(95)'].toFixed(0) + 'ms' : '—') + '</td>' +
          '<td>' + (wait ? wait['p(95)'].toFixed(0) + 'ms' : '—') + '</td>' +
          '<td class="' + rateClass(parseFloat(fRate)) + '">' + fRate + '%</td></tr>';
      }
      html += '</tbody></table></div></div>';
    }

    // ── 5. Failed Accounts List (for Excel Bulk Login) ──
    if (data.failedAccounts && data.failedAccounts.length > 0) {
      html += '<div class="report-card" style="margin-top: 16px; border-color: rgba(239, 68, 68, 0.3); background: rgba(239, 68, 68, 0.02);">' +
        '<div class="report-card-header" style="color: var(--danger); font-weight: 700; display: flex; justify-content: space-between; align-items: center; background: rgba(239, 68, 68, 0.04); border-bottom: 1px solid rgba(239, 68, 68, 0.2);">' +
          '<span>❌ Danh sách tài khoản đăng nhập thất bại (' + data.failedAccounts.length + ' tài khoản)</span>' +
          '<button id="copyFailedAccountsReportBtn" type="button" class="btn btn-secondary btn-sm" style="padding: 4px 10px; font-size: 11px; margin: 0; width: auto; height: auto; border-color: rgba(239, 68, 68, 0.3);">Sao chép danh sách</button>' +
        '</div>' +
        '<div style="max-height: 250px; overflow-y: auto; padding: 0 16px;">' +
          '<table class="report-table" style="width: 100%; border-collapse: collapse;">' +
            '<thead><tr><th style="width: 50px; border-bottom: 1px solid rgba(239, 68, 68, 0.2);">STT</th><th style="border-bottom: 1px solid rgba(239, 68, 68, 0.2);">Tài khoản (Email)</th><th style="border-bottom: 1px solid rgba(239, 68, 68, 0.2);">Lỗi chi tiết</th></tr></thead>' +
            '<tbody>' +
              data.failedAccounts.map(function (acc, index) {
                return '<tr>' +
                  '<td style="border-bottom: 1px solid rgba(239, 68, 68, 0.1);">' + (index + 1) + '</td>' +
                  '<td class="label" style="word-break: break-all; font-family: var(--font-mono); border-bottom: 1px solid rgba(239, 68, 68, 0.1);">' + escHtml(acc.user) + '</td>' +
                  '<td style="color: var(--danger); font-family: var(--font-sans); border-bottom: 1px solid rgba(239, 68, 68, 0.1);">' + escHtml(acc.error) + '</td>' +
                '</tr>';
              }).join('') +
            '</tbody>' +
          '</table>' +
        '</div>' +
      '</div>';
    }

    reportSection.innerHTML = html;
    reportSection.classList.remove('hidden');

    var copyFailedBtn = $('copyFailedAccountsReportBtn');
    if (copyFailedBtn) {
      copyFailedBtn.addEventListener('click', function () {
        var textToCopy = data.failedAccounts.map(function (acc) {
          return acc.user + ' - ' + acc.error;
        }).join('\n');
        navigator.clipboard.writeText(textToCopy).then(function () {
          copyFailedBtn.textContent = 'Đã chép ✓';
          setTimeout(function () { copyFailedBtn.textContent = 'Sao chép danh sách'; }, 1500);
        });
      });
    }

    var exportBtn = $('exportReportBtn');
    if (exportBtn) {
      exportBtn.addEventListener('click', function () {
        exportReport(data);
      });
    }
  }

  function extractPerApiMetrics(metrics) {
    var apis = {};
    var keys = Object.keys(metrics);
    for (var i = 0; i < keys.length; i++) {
      var nameMatch = keys[i].match(/\{.*?name:([^,}]+)/);
      if (!nameMatch) continue;
      var base = keys[i].split('{')[0];
      var apiName = nameMatch[1].trim();
      if (!apis[apiName]) apis[apiName] = {};
      apis[apiName][base] = metrics[keys[i]];
    }
    return apis;
  }

  function extractPerApiFromChecks(rootGroup) {
    var apis = {};
    if (!rootGroup) return apis;

    function traverse(group) {
      if (group.checks && group.checks.length) {
        group.checks.forEach(function (chk) {
          var match = chk.name.match(/^((?:GET|POST|PUT|DELETE|OPTIONS)\s+\S+):\s+status is 2xx\/3xx$/);
          if (match) {
            var apiName = match[1];
            if (!apis[apiName]) {
              apis[apiName] = {
                http_reqs: {
                  values: {
                    count: 0
                  }
                },
                http_req_failed: {
                  values: {
                    passes: 0,
                    fails: 0,
                    rate: 0
                  }
                },
                http_req_duration: null
              };
            }
            var passes = chk.passes || 0;
            var fails = chk.fails || 0;
            var total = passes + fails;
            apis[apiName].http_reqs.values.count += total;
            apis[apiName].http_req_failed.values.passes += fails;
            apis[apiName].http_req_failed.values.fails += passes;
          }
        });
      }
      if (group.groups && group.groups.length) {
        group.groups.forEach(traverse);
      }
    }

    traverse(rootGroup);

    Object.keys(apis).forEach(function (apiName) {
      var item = apis[apiName];
      var total = item.http_reqs.values.count;
      var fails = item.http_req_failed.values.passes;
      item.http_req_failed.values.rate = total > 0 ? (fails / total) : 0;
    });

    return apis;
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function statusBadge(rate) {
    if (rate === 0) return '<span class="good">✅ Đạt</span>';
    if (rate < 10) return '<span class="warn">⚠️ Chấp nhận</span>';
    return '<span class="bad">❌ Không đạt</span>';
  }

  function fmtBytes(bytes) {
    if (bytes < 1024) return bytes.toFixed(0) + ' B';
    if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / 1048576).toFixed(2) + ' MB';
  }

  /* ========== RUN / STOP ========== */
  function onRun(e) {
    e.preventDefault();
    var cfg = {
      executor: currentExec,
      vus: $('vus').value,
      apiBaseUrl: $('apiBaseUrl').value,
      webBaseUrl: $('webBaseUrl').value,
      useExcel: useExcel.checked ? 'true' : 'false',
      useSavedTokens: useSavedTokens.checked ? 'true' : 'false',
    };
    if (currentExec === 'shared-iterations') cfg.iterations = $('iterations').value;
    else cfg.duration = $('duration').value;
    ['courseId','courseContentId','topicId','roleId','sleepSeconds','maxDuration','userStart','userEnd'].forEach(function (f) {
      var el = $(f); if (el && el.value) cfg[f] = el.value;
    });
    var enabledApis = getSelectedApis();
    if (enabledApis !== null) {
      // Pass enabledApis to k6: empty = only login, non-empty = selected APIs
      cfg.enabledApis = enabledApis === '' ? '__NONE__' : enabledApis;
    }

    metricsGrid.classList.add('hidden');
    reportSection.classList.add('hidden');
    progressContainer.classList.remove('hidden');
    progressFill.style.width = '0%';
    progressPercent.textContent = '0%';
    progressLabel.textContent = 'Đang khởi động…';
    progressDetails.textContent = '';
    summaryLines = []; inSummary = false;

    fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cfg),
    })
      .then(function (r) { return r.json(); })
      .then(function (d) { if (d.error) log('error', d.error); })
      .catch(function (err) { log('error', 'Khởi chạy thất bại: ' + err.message); setRunning(false); });
  }

  function onStop() {
    fetch('/api/stop', { method: 'POST' })
      .then(function (r) { return r.json(); })
      .then(function () { log('info', '⏹ Đang dừng…'); })
      .catch(function (err) { log('error', 'Dừng thất bại: ' + err.message); });
  }

  function setRunning(on) {
    runBtn.classList.toggle('hidden', on);
    stopBtn.classList.toggle('hidden', !on);
    consoleDot.className = 'console-dot ' + (on ? 'running' : 'finished');
    configForm.querySelectorAll('input').forEach(function (el) { el.disabled = on; });
    executorToggle.querySelectorAll('.toggle').forEach(function (el) { el.disabled = on; });
  }

  /* ========== HISTORY ========== */
  function loadHistory() {
    fetch('/api/results').then(function (r) { return r.json(); }).then(function (files) {
      if (!files.length) {
        historyList.innerHTML = '<div class="history-empty">Chưa có kết quả test nào.</div>';
        return;
      }
      historyList.innerHTML = files.map(function (f) {
        var ts = f.replace('testgov2-', '').replace('.json', '').replace(/T/, ' ');
        return '<div class="history-item" data-file="' + f + '">' +
          '<span class="history-item-name">' + f + '</span>' +
          '<span class="history-item-date">' + ts + '</span></div>';
      }).join('');
      historyList.querySelectorAll('.history-item').forEach(function (el) {
        el.addEventListener('click', function () { loadResult(el.dataset.file); });
      });
    }).catch(function () {
      historyList.innerHTML = '<div class="history-empty">Không thể tải lịch sử.</div>';
    });
  }

  function loadResult(file) {
    fetch('/api/results/' + file).then(function (r) { return r.json(); }).then(function (data) {
      clearConsole();
      log('info', '📂 Đang xem: ' + file);
      log('info', '─'.repeat(58));
      displayResult(data);
    }).catch(function (err) { log('error', 'Lỗi tải kết quả: ' + err.message); });
  }

  /* ========== EXCEL FUNCTIONS ========== */
  function loadExcelStatus() {
    fetch('/api/get-excel-data')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.count > 0) {
          excelInfo.classList.remove('hidden');
          excelFileName.textContent = 'Dữ liệu đã lưu trên máy chủ';
          excelFileDetails.textContent = d.count + ' học viên (' + d.tokenCount + ' token)';
          useSavedTokensGroup.classList.remove('hidden');
          excelActionsGroup.classList.remove('hidden');
          if (d.tokenCount > 0) {
            useSavedTokens.checked = true;
          } else {
            useSavedTokens.checked = false;
          }
          updateLoginCheckboxVisually();
        }
      })
      .catch(function () {});
  }

  function toggleExcelOptions() {
    var show = useExcel.checked;
    useSavedTokensGroup.classList.toggle('hidden', !show);
    excelActionsGroup.classList.toggle('hidden', !show);
  }

  function updateLoginCheckboxVisually() {
    var skipped = useExcel.checked && useSavedTokens.checked;
    var loginGroupCheckbox = $('loginGroupCheckbox');
    var loginItemCheckbox = $('loginItemCheckbox');
    var loginGroupName = $('loginGroupName');
    
    if (loginGroupCheckbox && loginItemCheckbox && loginGroupName) {
      if (skipped) {
        loginGroupCheckbox.checked = false;
        loginItemCheckbox.checked = false;
        loginGroupName.textContent = 'Đăng nhập (Đã bỏ qua — Sử dụng Token lưu sẵn)';
      } else {
        loginGroupCheckbox.checked = true;
        loginItemCheckbox.checked = true;
        loginGroupName.textContent = 'Đăng nhập (bắt buộc — lấy token)';
      }
    }
  }

  function onExcelUpload(e) {
    var file = e.target.files[0];
    if (!file) return;

    var reader = new FileReader();
    reader.onload = function (evt) {
      try {
        var data = new Uint8Array(evt.target.result);
        var workbook = XLSX.read(data, { type: 'array' });
        var firstSheetName = workbook.SheetNames[0];
        var worksheet = workbook.Sheets[firstSheetName];
        
        var hasHeaders = function (arr) {
          if (!arr || arr.length === 0) return false;
          var keys = Object.keys(arr[0]).map(function (k) { return String(k).trim().toLowerCase(); });
          var hasUser = keys.some(function (k) { return k === 'user' || k === 'username' || k === 'email' || k === 'tài khoản' || k === 'tai khoan'; });
          var hasPass = keys.some(function (k) { return k === 'pass' || k === 'password' || k === 'mật khẩu' || k === 'mat khau'; });
          return hasUser && hasPass;
        };

        var json = null;
        // 1. Thử đọc từ dòng thứ 2 (range: 1) trước theo yêu cầu của user
        var jsonRange1 = XLSX.utils.sheet_to_json(worksheet, { range: 1 });
        if (hasHeaders(jsonRange1)) {
          json = jsonRange1;
        } else {
          // 2. Thử đọc từ dòng đầu tiên (range: 0)
          var jsonRange0 = XLSX.utils.sheet_to_json(worksheet, { range: 0 });
          if (hasHeaders(jsonRange0)) {
            json = jsonRange0;
          } else {
            // 3. Thử các dòng tiếp theo (range: 2 đến 5)
            for (var r = 2; r <= 5; r++) {
              var tempJson = XLSX.utils.sheet_to_json(worksheet, { range: r });
              if (hasHeaders(tempJson)) {
                json = tempJson;
                break;
              }
            }
          }
        }

        // Mặc định nếu không tự động nhận diện được, lấy dữ liệu đọc từ dòng thứ 2 (range: 1)
        if (!json) {
          json = jsonRange1 || XLSX.utils.sheet_to_json(worksheet, { range: 1 });
        }

        if (!json || json.length === 0) {
          alert('File Excel không có dữ liệu hoặc sai định dạng!');
          return;
        }

        var mapped = json.map(function (row) {
          var r = {};
          Object.keys(row).forEach(function (k) {
            var keyTrim = k.trim();
            var keyLower = keyTrim.toLowerCase();
            var val = row[k];
            if (typeof val === 'string') val = val.trim();
            
            // Chuẩn hóa tên cột để k6 và server sử dụng
            if (keyLower === 'user' || keyLower === 'username' || keyLower === 'email' || keyLower === 'tài khoản' || keyLower === 'tai khoan') {
              r['User'] = val;
            } else if (keyLower === 'pass' || keyLower === 'password' || keyLower === 'mật khẩu' || keyLower === 'mat khau') {
              r['Pass'] = val;
            } else if (keyLower === 'testlearnermapid' || keyLower === 'examineeid' || keyLower === 'examinee_id' || keyLower === 'test_learner_map_id') {
              r['testLearnerMapId'] = val;
            } else if (keyLower === 'testcodeid' || keyLower === 'testcode_id' || keyLower === 'test_code_id') {
              r['testCodeId'] = val;
            } else if (keyLower === 'questionid' || keyLower === 'question_id') {
              r['questionId'] = val;
            } else if (keyLower === 'answerid' || keyLower === 'answer_id') {
              r['answerId'] = val;
            } else {
              r[keyTrim] = val;
            }
          });
          return r;
        });

        var firstRow = mapped[0];
        if (firstRow.User === undefined || firstRow.Pass === undefined) {
          alert('File Excel phải chứa ít nhất hai cột "User" và "Pass" (hoặc "Tài khoản" và "Mật khẩu")!');
          return;
        }

        excelFileName.textContent = file.name;
        excelFileDetails.textContent = mapped.length + ' học viên (Đang tải...)';
        excelInfo.classList.remove('hidden');

        // Check if tokens exist, ask user whether to keep or clear
        var clearTokens = false;
        fetch('/api/get-excel-data').then(function (r) { return r.json(); }).then(function (d) {
          if (d.tokenCount > 0) {
            clearTokens = !confirm(
              '⚠️ Hiện có ' + d.tokenCount + ' token đã lưu từ lần đăng nhập trước.\n\n' +
              '• Bấm OK → GIỮ LẠI token cũ và tự động ghép vào Excel mới\n' +
              '• Bấm Cancel → XÓA HẾT token cũ (cần đăng nhập lại)'
            );
          }
          return fetch('/api/save-excel-data?clearTokens=' + (clearTokens ? 'true' : 'false'), {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mapped)
          });
        }).then(function (r) { return r.json(); })
          .then(function (res) {
            if (res.success) {
              useExcel.checked = true;
              toggleExcelOptions();
              loadExcelStatus();
              var tokenMsg = res.tokenMatched > 0
                ? ' — ✅ Đã tự động ghép ' + res.tokenMatched + '/' + mapped.length + ' token từ lần đăng nhập trước'
                : '';
              log('info', '📂 Đã tải file Excel: ' + file.name + ' (' + mapped.length + ' dòng)' + tokenMsg);
              if (res.tokenMatched > 0) {
                useSavedTokens.checked = true;
                updateLoginCheckboxVisually();
                saveConfig();
                log('info', '💡 Đã tự động bật "Sử dụng Token đã lưu" vì tìm thấy ' + res.tokenMatched + ' token đã đăng nhập trước đó.');
              }
            } else {
              alert('Lưu dữ liệu Excel thất bại!');
            }
          })
          .catch(function (err) {
            alert('Lỗi tải dữ liệu lên: ' + err.message);
          });

      } catch (err) {
        alert('Lỗi đọc file Excel: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  var loginPollTimer = null;
  function onLoginExcel() {
    var apiBaseUrl = $('apiBaseUrl').value;
    var webBaseUrl = $('webBaseUrl').value;
    loginExcelBtn.disabled = true;
    stopLoginExcelBtn.classList.remove('hidden');
    loginExcelProgress.classList.remove('hidden');
    
    // Clear previous errors
    excelLoginErrors.classList.add('hidden');
    excelErrorsList.innerHTML = '';
    excelErrorCount.textContent = '0';
    
    clearConsole();
    
    fetch('/api/login-excel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiBaseUrl: apiBaseUrl, webBaseUrl: webBaseUrl, vus: $('vus').value })
    })
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.error) {
          log('error', 'Lỗi đăng nhập Excel: ' + d.error);
          resetLoginState();
        } else {
          log('info', '🔐 Bắt đầu đăng nhập hàng loạt cho ' + d.total + ' học viên...');
          pollLoginStatus();
        }
      })
      .catch(function (err) {
        log('error', 'Không thể kết nối đến server: ' + err.message);
        resetLoginState();
      });
  }

  function onStopLoginExcel() {
    fetch('/api/login-excel-stop', { method: 'POST' })
      .then(function() {
        log('info', '⏹ Đã gửi yêu cầu dừng đăng nhập hàng loạt.');
      })
      .catch(function() {});
  }

  function pollLoginStatus() {
    if (loginPollTimer) clearInterval(loginPollTimer);
    loginPollTimer = setInterval(function () {
      fetch('/api/login-excel-status')
        .then(function (r) { return r.json(); })
        .then(function (d) {
          var pct = d.total > 0 ? Math.round((d.current / d.total) * 100) : 0;
          loginExcelProgressBar.style.width = pct + '%';
          loginExcelProgressText.textContent = 'Đang đăng nhập: ' + d.current + '/' + d.total + 
            ' (Thành công: ' + d.success + ', Thất bại: ' + d.failed + ')';
          
          // Render failed accounts in sidebar
          if (d.failedAccounts && d.failedAccounts.length > 0) {
            excelLoginErrors.classList.remove('hidden');
            excelErrorCount.textContent = d.failedAccounts.length;
            excelErrorsList.innerHTML = d.failedAccounts.map(function (acc) {
              return '<div style="border-bottom: 1px solid rgba(255,255,255,0.02); padding-bottom: 2px;">' +
                '<span style="color: var(--text-primary); font-weight: 500; word-break: break-all;">' + escHtml(acc.user) + '</span>: ' +
                '<span style="color: var(--danger);">' + escHtml(acc.error) + '</span>' +
                '</div>';
            }).join('');
          } else {
            excelLoginErrors.classList.add('hidden');
            excelErrorsList.innerHTML = '';
            excelErrorCount.textContent = '0';
          }
          
          if (!d.running) {
            clearInterval(loginPollTimer);
            loginPollTimer = null;
            log('info', '✔️ Tiến trình đăng nhập hoàn tất. Thành công: ' + d.success + '/' + d.total);
            if (d.failed > 0) {
              log('error', '❌ Đăng nhập thất bại cho ' + d.failed + ' tài khoản. Chi tiết hiển thị ở mục lỗi phía dưới.');
            }
            resetLoginState();
            loadExcelStatus();
            
            if (d.reportFile) {
              setTimeout(function () {
                loadResult(d.reportFile);
                loadHistory();
              }, 500);
            }
          }
        })
        .catch(function () {
          clearInterval(loginPollTimer);
          loginPollTimer = null;
          resetLoginState();
        });
    }, 1000);
  }

  function resetLoginState() {
    loginExcelBtn.disabled = false;
    stopLoginExcelBtn.classList.add('hidden');
  }

  function copyExcelErrors() {
    var textToCopy = '';
    var items = excelErrorsList.querySelectorAll('div');
    items.forEach(function (item) {
      textToCopy += item.textContent + '\n';
    });
    if (!textToCopy) return;
    navigator.clipboard.writeText(textToCopy).then(function () {
      copyExcelErrorsBtn.textContent = 'Đã chép ✓';
      setTimeout(function () { copyExcelErrorsBtn.textContent = 'Sao chép'; }, 1500);
    });
  }

  function checkExcelLoginOnLoad() {
    fetch('/api/login-excel-status')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        if (d.running) {
          loginExcelBtn.disabled = true;
          stopLoginExcelBtn.classList.remove('hidden');
          loginExcelProgress.classList.remove('hidden');
          pollLoginStatus();
        }
      })
      .catch(function () {});
  }

  /* ========== GO ========== */
  init();
  })();
  
  
