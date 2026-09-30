import { readFileSync, writeFileSync, copyFileSync, mkdirSync, existsSync, readdirSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));

const HOST = process.argv[2] || 'localhost';
const BASE_PATH = (process.env.BASE_PATH || '').replace(/\/+$/, '');

const tests = (await import('./src/tests/index.mjs')).default;
const template = readFileSync(resolve(__dirname, 'src/template.html'), 'utf-8');

function cspSha256(source) {
  return "'sha256-" + createHash('sha256').update(source, 'utf8').digest('base64') + "'";
}

// Collect the SHA-256 hashes of every inline `<script>` and `<style>` block in
// the rendered page. External scripts (those with a `src` attribute) are not
// hashed; they are covered by `'self'`/`'strict-dynamic'` instead.
function collectHashes(html, tag) {
  const hashes = [];
  const re = tag === 'script'
    ? /<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi
    : /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    hashes.push(cspSha256(match[1]));
  }
  return hashes;
}

// Build the page's CSP.
// Note that adblock scriptlet injections are not subject to any page-defined CSP.
function buildCsp(html) {
  const scriptHashes = collectHashes(html, 'script');
  const styleHashes = collectHashes(html, 'style');

  const directives = [
    "default-src 'none'",
    // `'unsafe-eval'` is required for the `noeval-if` test to fail when the filter rule is absent
    "script-src 'self' 'strict-dynamic' 'unsafe-eval' " + scriptHashes.join(' '),
    "style-src " + styleHashes.join(' '),
    // `data:` is needed for uBO's `$redirect` resources (e.g. 1x1.gif, noop.json)
    "img-src 'self' data:",
    "connect-src 'self' data:",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-src 'none'",
    "form-action 'none'",
    "manifest-src 'none'",
    "media-src 'none'",
    "worker-src 'none'"
  ];

  return directives.join('; ');
}

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

  const html = template
    .replaceAll('{{BASE_PATH}}', BASE_PATH)
    .replace('{{FIXTURE_HTML}}', fixtureHtml)
    .replace('{{SECONDARY_SECTION}}', secondarySection)
    .replace('{{TEST_DATA}}', testData)
    .replace('{{RUNNER}}', runner);

  // Derive CSP from the fully assembled page so that every inline script
  // inline script and the inline stylesheet have their hashes allowlisted
  return html.replace('{{CONTENT_SECURITY_POLICY}}', buildCsp(html));
}

function generateFilters(testList, host) {
  const lines = [];
  lines.push(`! Title: uBO Scriptlet & Resource Test Suite for ${host}`);
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

if (existsSync(resolve(__dirname, 'dist'))) {
  rmSync(resolve(__dirname, 'dist'), { recursive: true });
}
mkdirSync(resolve(__dirname, 'dist'), { recursive: true });

copyResources();
console.log('Copied resources to dist/resources/');

writeFileSync(resolve(__dirname, 'dist/filters.txt'), generateFilters(tests, HOST), 'utf-8');
console.log('Generated dist/filters.txt with ' + tests.length + ' test rule groups');

writeFileSync(resolve(__dirname, 'dist/index.html'), generateIndexHtml(tests, []), 'utf-8');
console.log('Generated dist/index.html with ' + tests.length + ' tests');

console.log('Done.');
