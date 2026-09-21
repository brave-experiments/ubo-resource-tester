export default [
  {
    id: 'aopr',
    rules: ['{{HOST}}##+js(aopr, testAopr)'],
    setup: function() {
      window.testAopr = { value: 42 };
    },
    check: function() {
      try {
        const x = window.testAopr;
        return { pass: false, detail: 'property read succeeded' };
      } catch(e) {
        return { pass: true, detail: 'property read threw: ' + e.message };
      }
    }
  },
  {
    id: 'aopw',
    rules: ['{{HOST}}##+js(aopw, testAopw)'],
    setup: function() {},
    check: function() {
      try {
        window.testAopw = 123;
        return { pass: false, detail: 'property write succeeded' };
      } catch(e) {
        return { pass: true, detail: 'property write threw: ' + e.message };
      }
    }
  },
  {
    id: 'acis',
    rules: ['{{HOST}}##+js(acis, testAcis)'],
    setupHtml: '<script>window.testAcis = true;</script>',
    setup: function() {},
    check: function() {
      let val;
      try { val = window.testAcis; } catch(e) { val = undefined; }
      return { pass: val !== true, detail: 'testAcis = ' + val };
    }
  },
  {
    id: 'aeld',
    rules: ['{{HOST}}##+js(aeld, click)'],
    setup: function(ctx) {
      ctx.clicked = false;
      document.body.addEventListener('click', function() {
        ctx.clicked = true;
      });
    },
    check: function(ctx) {
      document.body.dispatchEvent(new Event('click'));
      return { pass: ctx.clicked === false, detail: 'clicked = ' + ctx.clicked };
    }
  },
  {
    id: 'prevent-setTimeout',
    rules: ['{{HOST}}##+js(prevent-setTimeout, prevent-setTimeout-needle!)'],
    setup: function(ctx) {
      ctx.timeoutFired = false;
      setTimeout(function() {
        ctx.timeoutFired = true; /* prevent-setTimeout-needle! */
      }, 5);
    },
    check: async function(ctx) {
      await new Promise(resolve => setTimeout(resolve, 30));
      return { pass: ctx.timeoutFired === false, detail: 'timeoutFired = ' + ctx.timeoutFired };
    }
  },
  {
    id: 'prevent-setInterval',
    rules: ['{{HOST}}##+js(prevent-setInterval, prevent-setInterval-needle!)'],
    setup: function(ctx) {
      ctx.intervalCount = 0;
      const id = setInterval(function() {
        ctx.intervalCount++; /* prevent-setInterval-needle! */
      }, 5);
      ctx.intervalId = id;
    },
    check: async function(ctx) {
      await new Promise(resolve => setTimeout(resolve, 30));
      if (ctx.intervalId) clearInterval(ctx.intervalId);
      return { pass: ctx.intervalCount === 0, detail: 'intervalCount = ' + ctx.intervalCount };
    }
  },
  {
    id: 'set-constant',
    rules: ['{{HOST}}##+js(set-constant, testSetConstant, true)'],
    setup: function() {
      window.testSetConstant = false;
    },
    check: function() {
      return { pass: window.testSetConstant === true, detail: 'testSetConstant = ' + window.testSetConstant };
    }
  },
  {
    id: 'trusted-set-constant',
    rules: ['{{HOST}}##+js(trusted-set-constant, testTrustedSetConstant, 42)'],
    setup: function() {
      window.testTrustedSetConstant = 0;
    },
    check: function() {
      return { pass: window.testTrustedSetConstant === 42, detail: 'testTrustedSetConstant = ' + window.testTrustedSetConstant };
    }
  },
  {
    id: 'set-attr',
    rules: ['{{HOST}}##+js(set-attr, #test-set-attr, data-attr, true)'],
    setupHtml: '<a id="test-set-attr" href="about:blank">link</a>',
    setup: function() {},
    check: function() {
      const el = document.getElementById('test-set-attr');
      const val = el ? el.getAttribute('data-attr') : null;
      return { pass: val === 'true', detail: 'data-attr = ' + val };
    }
  },
  {
    id: 'remove-class',
    rules: ['{{HOST}}##+js(remove-class, ad-banner, #test-remove-class)'],
    setupHtml: '<div id="test-remove-class" class="content ad-banner"></div>',
    setup: function() {},
    check: function() {
      const el = document.getElementById('test-remove-class');
      return { pass: el && !el.classList.contains('ad-banner'), detail: 'has ad-banner class = ' + (el ? el.classList.contains('ad-banner') : 'no element') };
    }
  },
  {
    id: 'remove-node-text',
    rules: ['{{HOST}}##+js(remove-node-text, #text, remove-node-text-needle)'],
    setupHtml: '<div class="test-remove-node-text">remove-node-text-needle</div>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('.test-remove-node-text');
      return { pass: el && el.textContent.trim() === '', detail: 'text = ' + (el ? JSON.stringify(el.textContent) : 'no element') };
    }
  },
  {
    id: 'replace-node-text',
    rules: ['{{HOST}}##+js(replace-node-text, #text, replace-node-text-needle, replaced)'],
    setupHtml: '<div class="test-replace-node-text">replace-node-text-needle</div>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('.test-replace-node-text');
      const txt = el ? el.textContent : '';
      return { pass: txt.includes('replaced'), detail: 'text = ' + JSON.stringify(txt) };
    }
  },
  {
    id: 'href-sanitizer',
    rules: ['{{HOST}}##+js(href-sanitizer, a.test-href-sanitizer)'],
    setupHtml: '<a class="test-href-sanitizer" href="javascript:alert(1)">link</a>',
    setup: function() {},
    check: function() {
      const el = document.querySelector('a.test-href-sanitizer');
      const href = el ? el.getAttribute('href') : '';
      return { pass: href && !href.startsWith('javascript:'), detail: 'href = ' + href };
    }
  },
  {
    id: 'set-cookie',
    rules: ['{{HOST}}##+js(set-cookie, testSetCookie, enabled)'],
    setup: function() {},
    check: async function() {
      const c = await cookieStore.get('testSetCookie');
      return { pass: c !== null && c.value === 'enabled', detail: 'testSetCookie = ' + c?.value };
    }
  },
  {
    id: 'trusted-set-cookie',
    rules: ['{{HOST}}##+js(trusted-set-cookie, testTrustedCookie, trusted)'],
    setup: function() {},
    check: async function() {
      const c = await cookieStore.get('testTrustedCookie');
      return { pass: c !== null && c.value === 'trusted', detail: 'testTrustedCookie = ' + c?.value };
    }
  },
  {
    id: 'set-local-storage-item',
    rules: ['{{HOST}}##+js(set-local-storage-item, testSetLocalStorageItem, enabled)'],
    setup: function() {},
    check: function() {
      const v = localStorage.getItem('testSetLocalStorageItem');
      return { pass: v === 'enabled', detail: 'testSetLocalStorageItem = ' + v };
    }
  },
  {
    id: 'trusted-set-local-storage-item',
    rules: ['{{HOST}}##+js(trusted-set-local-storage-item, testTrustedSetLocalStorageItem, trustedValue)'],
    setup: function() {},
    check: function() {
      const v = localStorage.getItem('testTrustedSetLocalStorageItem');
      return { pass: v === 'trustedValue', detail: 'testTrustedSetLocalStorageItem = ' + v };
    }
  },
  {
    id: 'noeval-if',
    rules: ['{{HOST}}##+js(noeval-if, /testPayload/)'],
    setup: function() {
      window.testEvalRan = false;
    },
    check: function() {
      try {
        eval('window.testEvalRan = true; /* testPayload */');
        return { pass: window.testEvalRan === false, detail: 'evalRan = ' + window.testEvalRan };
      } catch(e) {
        return { pass: true, detail: 'eval threw: ' + e.message };
      }
    }
  },
  {
    id: 'prevent-fetch',
    rules: ['{{HOST}}##+js(prevent-fetch, /test-prevent-fetch\\.json/)'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-prevent-fetch.json')
        .then(r => r.text())
        .catch(e => 'ERROR:' + e.message);
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r === '';
      return { pass, detail: 'fetch result length = ' + (r ? r.length : 'null') };
    }
  },
  {
    id: 'trusted-prevent-fetch',
    rules: ['{{HOST}}##+js(trusted-prevent-fetch, /test-trusted-prevent-fetch\\.json/)'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-trusted-prevent-fetch.json')
        .then(r => r.text())
        .catch(e => 'ERROR:' + e.message);
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r === '';
      return { pass, detail: 'trusted fetch result length = ' + (r ? r.length : 'null') };
    }
  },
  {
    id: 'prevent-xhr',
    rules: ['{{HOST}}##+js(prevent-xhr, /test-prevent-xhr\\.json/)'],
    setup: function(ctx) {
      ctx.result = new Promise(resolve => {
        const xhr = new XMLHttpRequest();
        xhr.open('GET', 'resources/test-prevent-xhr.json', true);
        xhr.onload = function() { resolve(xhr.responseText); };
        xhr.onerror = function() { resolve('ERROR'); };
        xhr.send();
      });
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r === '';
      return { pass, detail: 'xhr result length = ' + (r ? r.length : 'null') };
    }
  },
  {
    id: 'json-prune',
    rules: ['{{HOST}}##+js(json-prune, test_json_prune)'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-json-prune.json')
        .then(r => r.text())
        .then(j => JSON.parse(j))
        .catch(e => ({ _error: e.message }));
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r && r.test_json_prune === undefined && r.data && Array.isArray(r.data);
      return { pass, detail: 'field pruned = ' + (r ? (r.test_json_prune === undefined ? 'yes' : 'no') : 'null') };
    }
  },
  {
    id: 'json-prune-fetch-response',
    rules: ['{{HOST}}##+js(json-prune-fetch-response, test_json_prune_fetch_response)'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-json-prune-fetch-response.json')
        .then(r => r.json())
        .catch(e => ({ _error: e.message }));
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r && r.test_json_prune_fetch_response === undefined && r.data && Array.isArray(r.data);
      return { pass, detail: 'field pruned = ' + (r ? (r.test_json_prune_fetch_response === undefined ? 'yes' : 'no') : 'null') };
    }
  },
  {
    id: 'trusted-replace-fetch-response',
    rules: ['{{HOST}}##+js(trusted-replace-fetch-response, test_trusted_replace_fetch_response, testPass)'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-trusted-replace-fetch-response.json')
        .then(r => r.json())
        .catch(e => 'ERROR:' + e.message);
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r.testPass !== undefined && r.data !== undefined && Array.isArray(r.data);
      return { pass, detail: 'replaced = ' + JSON.stringify(r) };
    }
  },
  {
    id: 'redirect-noop-js',
    rules: ['/resources/test-redirect-noop.js^$domain={{HOST}},script,redirect=noop.js'],
    setup: function(ctx) {
      ctx.ready = new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'resources/test-redirect-noop.js';
        script.onload = script.onerror = resolve;
        document.body.appendChild(script);
      });
    },
    check: async function(ctx) {
      await ctx.ready;
      return { pass: window.__testNoopJs__ === undefined, detail: 'sentinel = ' + window.__testNoopJs__ };
    }
  },
  {
    id: 'redirect-1x1-gif',
    rules: ['/resources/test-redirect-1x1-gif.gif^$domain={{HOST}},image,redirect=1x1.gif'],
    setup: function(ctx) {
      ctx.result = new Promise(resolve => {
        const img = new Image();
        img.onload = function() { resolve({ loaded: true, error: false }); };
        img.onerror = function() { resolve({ loaded: false, error: true }); };
        img.src = 'resources/test-redirect-1x1-gif.gif';
      });
    },
    check: async function(ctx) {
      const r = await ctx.result;
      return { pass: r.loaded === true, detail: 'loaded = ' + r.loaded + ', error = ' + r.error };
    }
  },
  {
    id: 'redirect-noop-json',
    rules: ['/resources/test-redirect-noop-json.json^$domain={{HOST}},xmlhttprequest,redirect=noop.json'],
    setup: function(ctx) {
      ctx.result = fetch('resources/test-redirect-noop-json.json')
        .then(r => r.text())
        .catch(e => 'ERROR');
    },
    check: async function(ctx) {
      const r = await ctx.result;
      const pass = r === '{}';
      return { pass, detail: 'json = ' + r };
    }
  },
  {
    id: 'redirect-surrogate-adsbygoogle',
    rules: ['/resources/test-redirect-surrogate-adsbygoogle.js^$domain={{HOST}},script,redirect=googlesyndication_adsbygoogle.js'],
    setup: function(ctx) {
      ctx.ready = new Promise(resolve => {
        const script = document.createElement('script');
        script.src = 'resources/test-redirect-surrogate-adsbygoogle.js';
        script.onload = script.onerror = resolve;
        document.body.appendChild(script);
      });
    },
    check: async function(ctx) {
      await ctx.ready;
      const hasSentinel = typeof window.__testRedirectSurrogateAdsbygoogle__ !== 'undefined';
      const hasAdsbygoogle = typeof window.adsbygoogle !== 'undefined';
      return { pass: hasAdsbygoogle && !hasSentinel, detail: 'sentinel = ' + window.__testRedirectSurrogateAdsbygoogle__ + ', adsbygoogle = ' + typeof window.adsbygoogle };
    }
  }
];
