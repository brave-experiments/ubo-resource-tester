export default [
  {
    id: 'aopr',
    rules: ['{{HOST}}##+js(aopr, UboAoprGlobal)'],
    setup: function() {
      window.UboAoprGlobal = { value: 42 };
    },
    check: function() {
      try {
        const x = window.UboAoprGlobal;
        return { pass: false, detail: 'property read succeeded' };
      } catch(e) {
        return { pass: true, detail: 'property read threw: ' + e.message };
      }
    }
  },
  {
    id: 'aopw',
    rules: ['{{HOST}}##+js(aopw, UboAopwTarget)'],
    setup: function() {},
    check: function() {
      try {
        window.UboAopwTarget = 123;
        return { pass: false, detail: 'property write succeeded' };
      } catch(e) {
        return { pass: true, detail: 'property write threw: ' + e.message };
      }
    }
  },
  {
    id: 'acis',
    rules: ['{{HOST}}##+js(acis, UboTestAcis)'],
    setupHtml: '<script>window.UboTestAcis = true;</script>',
    setup: function() {},
    check: function() {
      let val;
      try { val = window.UboTestAcis; } catch(e) { val = undefined; }
      return { pass: val !== true, detail: 'UboTestAcis = ' + val };
    }
  },
  {
    id: 'aeld',
    rules: ['{{HOST}}##+js(aeld, click)'],
    setup: function() {
      window.UboTestAeldClicked = false;
      document.body.addEventListener('click', function() {
        window.UboTestAeldClicked = true;
      });
    },
    check: function() {
      document.body.dispatchEvent(new Event('click'));
      return { pass: window.UboTestAeldClicked === false, detail: 'clicked = ' + window.UboTestAeldClicked };
    }
  },
  {
    id: 'prevent-setTimeout',
    rules: ['{{HOST}}##+js(prevent-setTimeout, boo!)'],
    setup: function() {
      window.UboTestTimeoutFired = false;
      setTimeout(function() {
        window.UboTestTimeoutFired = true; /* boo! */
      }, 5);
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 30));
      return { pass: window.UboTestTimeoutFired === false, detail: 'timeoutFired = ' + window.UboTestTimeoutFired };
    }
  },
  {
    id: 'prevent-setInterval',
    rules: ['{{HOST}}##+js(prevent-setInterval, boo!)'],
    setup: function() {
      window.UboTestIntervalCount = 0;
      const id = setInterval(function() {
        window.UboTestIntervalCount++; /* boo! */
      }, 5);
      window.UboTestIntervalId = id;
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 30));
      if (window.UboTestIntervalId) clearInterval(window.UboTestIntervalId);
      return { pass: window.UboTestIntervalCount === 0, detail: 'intervalCount = ' + window.UboTestIntervalCount };
    }
  },
  {
    id: 'set-constant',
    rules: ['{{HOST}}##+js(set-constant, UboTestConst, true)'],
    setup: function() {
      window.UboTestConst = false;
    },
    check: function() {
      return { pass: window.UboTestConst === true, detail: 'UboTestConst = ' + window.UboTestConst };
    }
  },
  {
    id: 'trusted-set-constant',
    rules: ['{{HOST}}##+js(trusted-set-constant, UboTestTrustedConst, 42)'],
    setup: function() {
      window.UboTestTrustedConst = 0;
    },
    check: function() {
      return { pass: window.UboTestTrustedConst === 42, detail: 'UboTestTrustedConst = ' + window.UboTestTrustedConst };
    }
  },
  {
    id: 'set-attr',
    rules: ['{{HOST}}##+js(set-attr, #ubo-test-set-attr, data-attr, true)'],
    setupHtml: '<a id="ubo-test-set-attr" href="about:blank">link</a>',
    setup: function() {},
    check: function() {
      const el = document.getElementById('ubo-test-set-attr');
      const val = el ? el.getAttribute('data-attr') : null;
      return { pass: val === 'true', detail: 'data-attr = ' + val };
    }
  },
  {
    id: 'remove-class',
    rules: ['{{HOST}}##+js(remove-class, ad-banner, #ubo-test-remove-class)'],
    setupHtml: '<div id="ubo-test-remove-class" class="content ad-banner"></div>',
    setup: function() {},
    check: function() {
      const el = document.getElementById('ubo-test-remove-class');
      return { pass: el && !el.classList.contains('ad-banner'), detail: 'has ad-banner class = ' + (el ? el.classList.contains('ad-banner') : 'no element') };
    }
  },
  {
    id: 'remove-node-text',
    rules: ['{{HOST}}##+js(remove-node-text, #text, remove-node-text-needle)'],
    setupHtml: '<div class="ubo-test-remove-node-text">remove-node-text-needle</div>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('.ubo-test-remove-node-text');
      return { pass: el && el.textContent.trim() === '', detail: 'text = ' + (el ? JSON.stringify(el.textContent) : 'no element') };
    }
  },
  {
    id: 'replace-node-text',
    rules: ['{{HOST}}##+js(replace-node-text, #text, replace-node-text-needle, replaced)'],
    setupHtml: '<div class="ubo-test-replace-node-text">replace-node-text-needle</div>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('.ubo-test-replace-node-text');
      const txt = el ? el.textContent : '';
      return { pass: txt.includes('replaced'), detail: 'text = ' + JSON.stringify(txt) };
    }
  },
  {
    id: 'href-sanitizer',
    rules: ['{{HOST}}##+js(href-sanitizer, a.ubo-test-href)'],
    setupHtml: '<a class="ubo-test-href" href="javascript:alert(1)">link</a>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('a.ubo-test-href');
      const href = el ? el.getAttribute('href') : '';
      return { pass: href && !href.startsWith('javascript:'), detail: 'href = ' + href };
    }
  },
  {
    id: 'set-cookie',
    rules: ['{{HOST}}##+js(set-cookie, uboTestSetCookie, enabled)'],
    setup: function() {},
    check: function() {
      return { pass: document.cookie.indexOf('uboTestSetCookie=enabled') !== -1, detail: 'cookie = ' + document.cookie };
    }
  },
  {
    id: 'trusted-set-cookie',
    rules: ['{{HOST}}##+js(trusted-set-cookie, uboTestTrustedCookie, trusted)'],
    setup: function() {},
    check: function() {
      return { pass: document.cookie.indexOf('uboTestTrustedCookie=trusted') !== -1, detail: 'cookie = ' + document.cookie };
    }
  },
  {
    id: 'set-local-storage-item',
    rules: ['{{HOST}}##+js(trusted-set-local-storage-item, uboTestLS, value)'],
    setup: function() {},
    check: function() {
      const v = localStorage.getItem('uboTestLS');
      return { pass: v === 'value', detail: 'uboTestLS = ' + v };
    }
  },
  {
    id: 'trusted-set-local-storage-item',
    rules: ['{{HOST}}##+js(trusted-set-local-storage-item, uboTestTrustedLS, trustedValue)'],
    setup: function() {},
    check: function() {
      const v = localStorage.getItem('uboTestTrustedLS');
      return { pass: v === 'trustedValue', detail: 'uboTestTrustedLS = ' + v };
    }
  },
  {
    id: 'prevent-fetch',
    rules: ['{{HOST}}##+js(prevent-fetch, /test-prevent-fetch\\.json/)'],
    setup: function() {
      window.UboTestFetchResult = null;
      fetch('/resources/test-prevent-fetch.json')
        .then(r => r.text())
        .then(function(t) { window.UboTestFetchResult = t; })
        .catch(function(e) { window.UboTestFetchResult = 'ERROR:' + e.message; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const pass = window.UboTestFetchResult === '';
      return { pass: pass, detail: 'fetch result length = ' + (window.UboTestFetchResult ? window.UboTestFetchResult.length : 'null') };
    }
  },
  {
    id: 'trusted-prevent-fetch',
    rules: ['{{HOST}}##+js(trusted-prevent-fetch, /test-trusted-prevent-fetch\\.json/)'],
    setup: function() {
      window.UboTestTrustedFetchResult = null;
      fetch('/resources/test-trusted-prevent-fetch.json')
        .then(r => r.text())
        .then(function(t) { window.UboTestTrustedFetchResult = t; })
        .catch(function(e) { window.UboTestTrustedFetchResult = 'ERROR:' + e.message; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const pass = window.UboTestTrustedFetchResult === '';
      return { pass: pass, detail: 'trusted fetch result length = ' + (window.UboTestTrustedFetchResult ? window.UboTestTrustedFetchResult.length : 'null') };
    }
  },
  {
    id: 'prevent-xhr',
    rules: ['{{HOST}}##+js(prevent-xhr, /test-prevent-xhr\\.json/)'],
    setup: function() {
      window.UboTestXhrResult = null;
      const xhr = new XMLHttpRequest();
      xhr.open('GET', '/resources/test-prevent-xhr.json', true);
      xhr.onload = function() { window.UboTestXhrResult = xhr.responseText; };
      xhr.onerror = function() { window.UboTestXhrResult = 'ERROR'; };
      xhr.send();
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const pass = window.UboTestXhrResult === '';
      return { pass: pass, detail: 'xhr result length = ' + (window.UboTestXhrResult ? window.UboTestXhrResult.length : 'null') };
    }
  },
  {
    id: 'json-prune',
    rules: ['{{HOST}}##+js(json-prune, test_json_prune)'],
    setup: function() {
      window.UboTestJsonPruneResult = null;
      fetch('/resources/test-json-prune.json')
        .then(r => r.text())
        .then(function(j) { window.UboTestJsonPruneResult = JSON.parse(j); })
        .catch(function(e) { window.UboTestJsonPruneResult = { _error: e.message }; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const r = window.UboTestJsonPruneResult;
      const pass = r && r.test_json_prune === undefined && r.data && Array.isArray(r.data);
      return { pass: pass, detail: 'field pruned = ' + (r ? (r.test_json_prune === undefined ? 'yes' : 'no') : 'null') };
    }
  },
  {
    id: 'json-prune-fetch-response',
    rules: ['{{HOST}}##+js(json-prune-fetch-response, test_json_prune_fetch_response)'],
    setup: function() {
      window.UboTestJsonPruneFetchResult = null;
      fetch('/resources/test-json-prune-fetch-response.json')
        .then(r => r.json())
        .then(function(j) { window.UboTestJsonPruneFetchResult = j; })
        .catch(function(e) { window.UboTestJsonPruneFetchResult = { _error: e.message }; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const r = window.UboTestJsonPruneFetchResult;
      const pass = r && r.test_json_prune_fetch_response === undefined && r.data && Array.isArray(r.data);
      return { pass: pass, detail: 'field pruned = ' + (r ? (r.test_json_prune_fetch_response === undefined ? 'yes' : 'no') : 'null') };
    }
  },
  {
    id: 'trusted-replace-fetch-response',
    rules: ['{{HOST}}##+js(trusted-replace-fetch-response, test_trusted_replace_fetch_response, testPass)'],
    setup: function() {
      window.UboTestReplaceFetchResult = null;
      fetch('/resources/test-trusted-replace-fetch-response.json')
        .then(r => r.json())
        .then(function(t) { window.UboTestReplaceFetchResult = t; })
        .catch(function(e) { window.UboTestReplaceFetchResult = 'ERROR:' + e.message; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const r = window.UboTestReplaceFetchResult;
      const pass = r.testPass !== undefined && r.data !== undefined && Array.isArray(r.data);
      return { pass, detail: 'replaced = ' + JSON.stringify(r) };
    }
  },
  {
    id: 'noeval-if',
    rules: ['{{HOST}}##+js(noeval-if, /testPayload/)'],
    setup: function() {
      window.UboTestEvalRan = false;
    },
    check: function() {
      try {
        eval('window.UboTestEvalRan = true; /* testPayload */');
        return { pass: window.UboTestEvalRan === false, detail: 'evalRan = ' + window.UboTestEvalRan };
      } catch(e) {
        return { pass: true, detail: 'eval threw: ' + e.message };
      }
    }
  },
  {
    id: 'redirect-noop-js',
    rules: ['/resources/test-redirect-noop.js^$script,redirect=noop.js'],
    setupHtml: '<script src="/resources/test-redirect-noop.js"></script>',
    setup: function() {},
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 200));
      return { pass: window.__testRedirectNoop__ === undefined, detail: 'sentinel = ' + window.__testRedirectNoop__ };
    }
  },
  {
    id: 'redirect-1x1-gif',
    rules: ['/resources/test-redirect-1x1-gif.gif^$image,redirect=1x1.gif'],
    setup: function() {
      window.UboTestGifLoaded = false;
      window.UboTestGifError = false;
      const img = new Image();
      img.onload = function() { window.UboTestGifLoaded = true; };
      img.onerror = function() { window.UboTestGifError = true; };
      img.src = '/resources/test-redirect-1x1-gif.gif';
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      return { pass: window.UboTestGifLoaded === true, detail: 'loaded = ' + window.UboTestGifLoaded + ', error = ' + window.UboTestGifError };
    }
  },
  {
    id: 'redirect-noop-json',
    rules: ['/resources/test-redirect-noop-json.json^$xmlhttprequest,redirect=noop.json'],
    setup: function() {
      window.UboTestNoopJsonResult = null;
      fetch('/resources/test-redirect-noop-json.json')
        .then(r => r.text())
        .then(function(t) { window.UboTestNoopJsonResult = t; })
        .catch(function(e) { window.UboTestNoopJsonResult = 'ERROR'; });
    },
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 300));
      const pass = window.UboTestNoopJsonResult === '{}';
      return { pass: pass, detail: 'json = ' + window.UboTestNoopJsonResult };
    }
  },
  {
    id: 'redirect-surrogate-adsbygoogle',
    rules: ['/resources/test-redirect-surrogate-adsbygoogle.js^$script,redirect=googlesyndication_adsbygoogle.js'],
    setupHtml: '<script src="/resources/test-redirect-surrogate-adsbygoogle.js"></script>',
    setup: function() {},
    check: async function() {
      await new Promise(resolve => setTimeout(resolve, 200));
      const hasSentinel = typeof window.__testRedirectSurrogateAdsbygoogle__ !== 'undefined';
      const hasAdsbygoogle = typeof window.adsbygoogle !== 'undefined';
      return { pass: hasAdsbygoogle && !hasSentinel, detail: 'sentinel = ' + window.__testRedirectSurrogateAdsbygoogle__ + ', adsbygoogle = ' + typeof window.adsbygoogle };
    }
  }
];
