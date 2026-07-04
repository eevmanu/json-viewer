const test = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('path');

test('manifest.json validation', async (t) => {
  const manifestPath = path.join(__dirname, '../extension/manifest.json');
  const manifestContent = fs.readFileSync(manifestPath, 'utf8');
  let manifest;

  await t.test('should be a valid JSON', () => {
    assert.doesNotThrow(() => {
      manifest = JSON.parse(manifestContent);
    });
  });

  await t.test('should have a clean host_permissions without redundant schemes', () => {
    const hostPermissions = manifest.host_permissions || [];
    assert.ok(Array.isArray(hostPermissions), 'host_permissions should be an array');

    const hasAllUrls = hostPermissions.includes('<all_urls>');
    const hasWildcardScheme = hostPermissions.includes('*://*/*');

    if (hasAllUrls && hasWildcardScheme) {
      assert.fail('Redundant host_permissions: manifest.json contains both "<all_urls>" and "*://*/*" which is redundant.');
    }
  });
});
