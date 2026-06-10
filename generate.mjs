import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.argv[2] || 'localhost';

const tests = (await import('./src/tests/index.mjs')).default;

function generateIndexHtml(testList, secondaryPages) {
  const runner = readFileSync(resolve(__dirname, 'src/runner/runner.js'), 'utf-8');

  let fixtureHtml = '';
  testList.forEach(function(t) {
    if (t.setupHtml) {
      fixtureHtml += '    ' + t.setupHtml + '\n';
    }
  });
  if (fixtureHtml) {
    fixtureHtml = fixtureHtml;
  }

  const testData = testList.map(function(t) {
    return '{\n' +
      '    id: ' + JSON.stringify(t.id) + ',\n' +
      '    setup: ' + t.setup.toString() + ',\n' +
      '    check: ' + t.check.toString() + '\n' +
      '  }';
  }).join(',\n    ');

  const secondaryLinks = (secondaryPages || []).map(function(sp) {
    return '<li><a href="' + sp + '" target="_blank">' + sp + '</a></li>';
  }).join('\n      ');

  return '<!DOCTYPE html>\n' +
'<html lang="en">\n' +
'<head>\n' +
'  <meta charset="UTF-8">\n' +
'  <title>uBO Scriptlet / Resource Regression Tests</title>\n' +
'  <style>\n' +
'    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #1a1a2e; color: #e0e0e0; }\n' +
'    #test-results { max-width: 900px; margin: 0 auto; }\n' +
'    h1 { font-size: 1.4em; border-bottom: 1px solid #333; padding-bottom: 10px; margin-bottom: 16px; color: #ccc; }\n' +
'    .test-row { padding: 6px 10px; margin: 4px 0; border-radius: 4px; font-family: "SFMono-Regular", Consolas, monospace; font-size: 13px; display: flex; gap: 12px; align-items: baseline; }\n' +
'    .pass { background: #1b3a1b; }\n' +
'    .fail { background: #3a1b1b; }\n' +
'    .status { font-weight: bold; min-width: 40px; }\n' +
'    .pass .status { color: #4caf50; }\n' +
'    .fail .status { color: #f44336; }\n' +
'    .id { color: #80cbc4; min-width: 200px; }\n' +
'    .detail { color: #aaa; font-size: 12px; }\n' +
'    .summary { margin-top: 20px; padding: 12px; border-radius: 4px; font-weight: bold; font-size: 15px; text-align: center; }\n' +
'    .summary-pass { background: #1b5e20; color: #a5d6a7; }\n' +
'    .summary-fail { background: #b71c1c; color: #ef9a9a; }\n' +
'    .secondary-pages { margin-top: 24px; padding: 12px; background: #16213e; border-radius: 4px; }\n' +
'    .secondary-pages h2 { font-size: 1em; color: #aaa; margin: 0 0 8px 0; }\n' +
'    .secondary-pages a { color: #80cbc4; }\n' +
'    #setup { display: none; }\n' +
'  </style>\n' +
'</head>\n' +
'<body>\n' +
'  <div id="setup">' + fixtureHtml + '</div>\n' +
'  <h1>uBO Scriptlet / Resource Regression Tests</h1>\n' +
'  <div id="test-results"></div>\n' +
(secondaryLinks ? '  <div class="secondary-pages">\n    <h2>Secondary test pages</h2>\n    <ul>\n      ' + secondaryLinks + '\n    </ul>\n  </div>\n' : '') +
'  <script>\n' +
'    window.__RESOURCE_TESTS__ = [\n    ' + testData + '\n    ];\n' +
'  </script>\n' +
'  <script>\n' +
'    (function() {\n' +
'      let base = document.querySelector("base");\n' +
'      if (!base) { base = document.createElement("base"); document.head.appendChild(base); }\n' +
'      base.href = "/";\n' +
'    })();\n' +
'  </script>\n' +
'  <script>\n' + runner + '\n' +
'  </script>\n' +
'</body>\n' +
'</html>';
}

function generateFilters(testList, host) {
  const lines = [];
  lines.push('! uBO Scriptlet / Resource Regression Test Suite');
  lines.push('! Generated for host: ' + host);
  lines.push('! Apply this in uBO > My filters or subscribe as a list.');
  lines.push('! Tests requiring [Trusted] scriptlets need "Allow custom filters requiring trust" enabled.');
  lines.push('');

  testList.forEach(function(test) {
    lines.push('! ' + test.id);
    test.rules.forEach(function(rule) {
      lines.push(rule.replace(/\{\{HOST\}\}/g, host));
    });
    lines.push('');
  });

  return lines.join('\n');
}

function copyResources() {
  const srcDir = resolve(__dirname, 'src/resources');
  const dstDir = resolve(__dirname, 'dist/resources');

  if (!existsSync(dstDir)) {
    mkdirSync(dstDir, { recursive: true });
  }

  const items = readdirSync(srcDir);
  items.forEach(function(item) {
    copyFileSync(resolve(srcDir, item), resolve(dstDir, item));
  });
}

console.log('Generating test suite for host: ' + HOST);

copyResources();
console.log('Copied resources to dist/resources/');

writeFileSync(resolve(__dirname, 'dist/filters.txt'), generateFilters(tests, HOST), 'utf-8');
console.log('Generated dist/filters.txt with ' + tests.length + ' test rule groups');

writeFileSync(resolve(__dirname, 'dist/index.html'), generateIndexHtml(tests, []), 'utf-8');
console.log('Generated dist/index.html with ' + tests.length + ' tests');

console.log('Done.');
