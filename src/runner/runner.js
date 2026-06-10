(function() {
  'use strict';

  const resultsContainer = document.getElementById('test-results');
  const tests = window.__RESOURCE_TESTS__ || [];
  const results = [];

  if (!resultsContainer) {
    resultsContainer = document.createElement('div');
    resultsContainer.id = 'test-results';
    document.body.appendChild(resultsContainer);
  }

  document.documentElement.dataset.resourceTests = 'running';

  function renderResults() {
    let passCount = 0;
    let failCount = 0;
    resultsContainer.innerHTML = '';

    results.forEach(function(r) {
      const row = document.createElement('div');
      row.className = 'test-row ' + (r.pass ? 'pass' : 'fail');

      const statusEl = document.createElement('span');
      statusEl.className = 'status';
      statusEl.textContent = r.pass ? 'PASS' : 'FAIL';
      row.appendChild(statusEl);

      const idEl = document.createElement('span');
      idEl.className = 'id';
      idEl.textContent = r.id;
      row.appendChild(idEl);

      if (r.detail) {
        const detailEl = document.createElement('span');
        detailEl.className = 'detail';
        detailEl.textContent = r.detail;
        row.appendChild(detailEl);
      }

      resultsContainer.appendChild(row);

      if (r.pass) passCount++; else failCount++;
    });

    const summary = document.createElement('div');
    summary.className = 'summary';

    if (failCount === 0) {
      summary.textContent = 'ALL TESTS PASS (' + passCount + '/' + tests.length + ')';
      summary.className += ' summary-pass';
    } else {
      summary.textContent = 'FAILURES: ' + failCount + ' / ' + tests.length + ' total (pass: ' + passCount + ')';
      summary.className += ' summary-fail';
    }

    resultsContainer.prepend(summary);

    const overallPass = failCount === 0;
    document.documentElement.dataset.resourceTests = overallPass ? 'pass' : 'fail';

    window.__RESOURCE_TEST_RESULTS__ = {
      host: window.location.hostname,
      generatedAt: new Date().toISOString(),
      summary: { total: tests.length, pass: passCount, fail: failCount },
      results: results
    };
  }

  function runSingle(test, _idx) {
    const ctx = {};
    return new Promise(function(resolve) {
      try {
        if (test.setup) {
          (test.setup)(ctx);
        }
      } catch (e) {
        results.push({ id: test.id, pass: false, detail: 'setup threw: ' + e.message });
        resolve();
        return;
      }

      let checkResult;
      try {
        checkResult = (test.check)(ctx);
      } catch (e) {
        results.push({ id: test.id, pass: false, detail: 'check threw: ' + e.message });
        resolve();
        return;
      }

      if (checkResult && typeof checkResult.then === 'function') {
        checkResult.then(function(val) {
          if (val && typeof val === 'object' && 'pass' in val) {
            results.push({ id: test.id, pass: !!val.pass, detail: val.detail || '' });
          } else {
            results.push({ id: test.id, pass: !!val, detail: String(val) });
          }
          resolve();
        });
      } else {
        if (checkResult && typeof checkResult === 'object' && 'pass' in checkResult) {
          results.push({ id: test.id, pass: !!checkResult.pass, detail: checkResult.detail || '' });
        } else {
          results.push({ id: test.id, pass: !!checkResult, detail: String(checkResult) });
        }
        resolve();
      }
    });
  }

  function runAll() {
    setTimeout(() => Promise.all(tests.map(runSingle)).then(renderResults), 100);
  }

  runAll();
})();
