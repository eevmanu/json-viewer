const Module = require('module');
const originalRequire = Module.prototype.require;

const mockChrome = {
  storage: {
    local: {
      get: function(keys, callback) {
        if (mockChrome.storage.local.mockGet) {
          mockChrome.storage.local.mockGet(keys, callback);
        } else {
          callback({});
        }
      },
      set: function(data, callback) {
        if (mockChrome.storage.local.mockSet) {
          mockChrome.storage.local.mockSet(data, callback);
        } else {
          callback();
        }
      }
    }
  },
  runtime: {
    lastError: null
  }
};

// Mock chrome-framework before requiring storage.js
Module.prototype.require = function(path) {
  if (path === 'chrome-framework') {
    return mockChrome;
  }
  return originalRequire.apply(this, arguments);
};

const Storage = require('../extension/src/json-viewer/storage.js');
const test = require('node:test');
const assert = require('node:assert');

test('Storage.load() tests', async (t) => {
  t.afterEach(() => {
    mockChrome.runtime.lastError = null;
    mockChrome.storage.local.mockGet = null;
    mockChrome.storage.local.mockSet = null;
  });

  await t.test('resolves options successfully when JSON is valid', async () => {
    const mockData = {
      theme: 'default',
      addons: JSON.stringify({ prependHeader: true }),
      structure: JSON.stringify({ test: 1 })
    };

    mockChrome.storage.local.mockGet = (key, callback) => {
      callback({
        'v2.options': JSON.stringify(mockData)
      });
    };

    const options = await Storage.load();
    assert.strictEqual(options.theme, 'default');
    assert.strictEqual(options.addons.prependHeader, true);
  });

  await t.test('rejects with SyntaxError when main optionsStr is invalid JSON', async () => {
    mockChrome.storage.local.mockGet = (key, callback) => {
      callback({
        'v2.options': 'invalid_json_string{'
      });
    };

    await assert.rejects(
      async () => {
        await Storage.load();
      },
      (err) => {
        return err instanceof SyntaxError;
      }
    );
  });

  await t.test('rejects with SyntaxError when options.addons is invalid JSON', async () => {
    const mockData = {
      theme: 'default',
      addons: 'invalid_json_string{',
      structure: JSON.stringify({ test: 1 })
    };

    mockChrome.storage.local.mockGet = (key, callback) => {
      callback({
        'v2.options': JSON.stringify(mockData)
      });
    };

    await assert.rejects(
      async () => {
        await Storage.load();
      },
      (err) => {
        return err instanceof SyntaxError;
      }
    );
  });

  await t.test('rejects with SyntaxError when options.structure is invalid JSON', async () => {
    const mockData = {
      theme: 'default',
      addons: JSON.stringify({ prependHeader: true }),
      structure: 'invalid_json_string{'
    };

    mockChrome.storage.local.mockGet = (key, callback) => {
      callback({
        'v2.options': JSON.stringify(mockData)
      });
    };

    await assert.rejects(
      async () => {
        await Storage.load();
      },
      (err) => {
        return err instanceof SyntaxError;
      }
    );
  });
});
