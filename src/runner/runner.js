(function() {
  'use strict';

  const resultsContainer = document.getElementById('test-results');
  const tests = window.__RESOURCE_TESTS__ || [];
  const results = tests.map(function(t) { return { id: t.id, pass: null, detail: '' }; });
  let summaryEl = document.getElementById('test-summary');

  document.documentElement.dataset.resourceTests = 'running';

  function buildRow(r) {
    const row = document.createElement('div');
    if (r.pass === null) {
      row.className = 'test-row pending';
    } else {
      row.className = 'test-row ' + (r.pass ? 'pass' : 'fail');
    }

    const statusEl = document.createElement('span');
    statusEl.className = 'status';
    statusEl.textContent = r.pass === null ? '...' : (r.pass ? 'PASS' : 'FAIL');
    row.appendChild(statusEl);

    const idEl = document.createElement('span');
    idEl.className = 'id';
    idEl.textContent = r.id;
    row.appendChild(idEl);

    const detailEl = document.createElement('span');
    detailEl.className = 'detail';
    row.appendChild(detailEl);

    return row;
  }

  function updateRow(row, r) {
    row.className = 'test-row ' + (r.pass ? 'pass' : 'fail');
    row.firstChild.textContent = r.pass ? 'PASS' : 'FAIL';
    const detailEl = row.lastChild;
    if (detailEl && detailEl.className === 'detail') {
      detailEl.textContent = r.detail || '';
    }
  }

  function updateSummary() {
    let passCount = 0;
    let failCount = 0;
    let pendingCount = 0;

    results.forEach(function(r) {
      if (r.pass === null) {
        pendingCount++;
      } else if (r.pass) {
        passCount++;
      } else {
        failCount++;
      }
    });

    summaryEl.classList.remove('pending', 'pass', 'fail');
    if (pendingCount > 0) {
      summaryEl.classList.add('pending');
      summaryEl.textContent = 'Running... (' + passCount + ' pass, ' + failCount + ' fail, ' + pendingCount + ' pending of ' + tests.length + ')';
    } else if (failCount === 0) {
      summaryEl.classList.add('pass');
      summaryEl.textContent = 'ALL TESTS PASS (' + passCount + '/' + tests.length + ')';
    } else {
      summaryEl.classList.add('fail');
      summaryEl.textContent = 'FAILURES: ' + failCount + ' / ' + tests.length + ' total (pass: ' + passCount + ')';
    }

    if (pendingCount === 0) {
      const overallPass = failCount === 0;
      document.documentElement.dataset.resourceTests = overallPass ? 'pass' : 'fail';

      window.__RESOURCE_TEST_RESULTS__ = {
        host: window.location.hostname,
        summary: { total: tests.length, pass: passCount, fail: failCount },
        results: results
      };
    }
  }

  async function runSingle(test, idx, row) {
    const testContext = {};
    try {
      if (test.setup) {
        (test.setup)(testContext);
      }
    } catch (e) {
      results[idx] = { id: test.id, pass: false, detail: 'setup threw: ' + e.message };
      updateRow(row, results[idx]);
      updateSummary();
      return;
    }

    // Give scriptlet MutationObservers some time to settle before checking results
    await new Promise(resolve => setTimeout(resolve, 100));

    let checkResult;
    try {
      checkResult = (test.check)(testContext);
    } catch (e) {
      results[idx] = { id: test.id, pass: false, detail: 'check threw: ' + e.message };
      updateRow(row, results[idx]);
      updateSummary();
      return;
    }

    if (checkResult && typeof checkResult.then === 'function') {
      checkResult.then(function(val) {
        if (val && typeof val === 'object' && 'pass' in val) {
          results[idx] = { id: test.id, pass: !!val.pass, detail: val.detail || '' };
        } else {
          results[idx] = { id: test.id, pass: !!val, detail: String(val) };
        }
        updateRow(row, results[idx]);
        updateSummary();
      }).catch(function(e) {
        results[idx] = { id: test.id, pass: false, detail: 'check rejected: ' + e.message };
        updateRow(row, results[idx]);
        updateSummary();
      });
    } else {
      if (checkResult && typeof checkResult === 'object' && 'pass' in checkResult) {
        results[idx] = { id: test.id, pass: !!checkResult.pass, detail: checkResult.detail || '' };
      } else {
        results[idx] = { id: test.id, pass: !!checkResult, detail: String(checkResult) };
      }
      updateRow(row, results[idx]);
      updateSummary();
    }
  }

  function runAll() {
    summaryEl.textContent = 'Running... (0 pass, 0 fail, ' + tests.length + ' pending of ' + tests.length + ')';

    const rows = [];
    results.forEach(function(r) {
      const row = buildRow(r);
      rows.push(row);
      resultsContainer.appendChild(row);
    });

    tests.forEach(function(test, idx) {
      runSingle(test, idx, rows[idx]);
    });
  }

  runAll();

  window.__retryTests = function() {
    localStorage.clear();
    sessionStorage.clear();
    document.cookie.split(';').forEach(function(c) {
      const eqPos = c.indexOf('=');
      const name = eqPos > -1 ? c.substring(0, eqPos).trim() : c.trim();
      document.cookie = name + '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/';
    });
    location.reload();
  };
})();
