# uBO Scriptlet & Resource Regression Tests

This test suite is intended to assure correct behavior of uBlock Origin's [Resource Library](https://github.com/gorhill/ublock/wiki/Resources-Library), including both scriptlet injections and resource replacements.

## Usage

1. Visit the test page
2. Copy the filter list link
3. Subscribe to the filter list in your adblocker
4. Return to the page and press the `retry` button

## Building

```bash
node generate.mjs
```

## Serving

Static files are output to `./dist`. Serve with any static HTTP/S server, e.g.:

```bash
python -m http.server -d dist
```
