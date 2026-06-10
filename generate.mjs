import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.argv[2] || 'localhost';

const tests = (await import('./src/tests/index.mjs')).default;
const template = readFileSync(resolve(__dirname, 'src/template.html'), 'utf-8');

function generateIndexHtml(testList, secondaryPages) {
  const runner = readFileSync(resolve(__dirname, 'src/runner/runner.js'), 'utf-8');

  let fixtureHtml = '';
  testList.forEach(function(t) {
    if (t.setupHtml) {
      fixtureHtml += '    ' + t.setupHtml + '\n';
    }
  });

  const testData = testList.map(function(t) {
    return `{
    id: ${JSON.stringify(t.id)},
    setup: ${t.setup.toString()},
    check: ${t.check.toString()}
  }`;
  }).join(',\n    ');

  let secondarySection = '';
  if (secondaryPages && secondaryPages.length) {
    const links = secondaryPages.map(function(sp) {
      return `<li><a href="${sp}" target="_blank">${sp}</a></li>`;
    }).join('\n      ');
    secondarySection = `  <div class="secondary-pages">
    <h2>Secondary test pages</h2>
    <ul>
      ${links}
    </ul>
  </div>`;
  }

  return template
    .replace('{{FIXTURE_HTML}}', fixtureHtml)
    .replace('{{SECONDARY_SECTION}}', secondarySection)
    .replace('{{TEST_DATA}}', testData)
    .replace('{{RUNNER}}', runner);
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
