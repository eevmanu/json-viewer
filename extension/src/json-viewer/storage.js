var defaults = require('./options/defaults');
var merge = require('./merge');
var Promise = require('promise');
var chrome = require('chrome-framework');

var OLD_NAMESPACE = "options";
var NAMESPACE = "v2.options";

module.exports = {
  save: function(obj) {
    return new Promise(function(resolve, reject) {
      var data = {};
      data[NAMESPACE] = JSON.stringify(obj);
      chrome.storage.local.set(data, function() {
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
        } else {
          resolve();
        }
      });
    });
  },

  load: function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      chrome.storage.local.get(NAMESPACE, function(result) {
        if (chrome.runtime.lastError) {
          return reject(chrome.runtime.lastError);
        }

        var optionsStr = result[NAMESPACE];
        
        // If nothing in chrome.storage.local, try migrating from localStorage (if available)
        if (!optionsStr && typeof localStorage !== 'undefined') {
          var localOptionsStr = localStorage.getItem(NAMESPACE);
          localOptionsStr = self.restoreOldOptions(localOptionsStr);
          if (localOptionsStr) {
            optionsStr = localOptionsStr;
            // Async save to chrome.storage.local
            try {
              var parsed = JSON.parse(localOptionsStr);
              self.save(parsed).catch(function(e) { console.error(e); });
            } catch(err) {
              console.error(err);
            }
          }
        }

        var options = optionsStr ? JSON.parse(optionsStr) : {};
        options.theme = options.theme || defaults.theme;
        options.optionsTheme = options.optionsTheme || defaults.optionsTheme || "dark";
        options.addons = options.addons ? JSON.parse(options.addons) : {};
        options.addons = merge({}, defaults.addons, options.addons)
        options.structure = options.structure ? JSON.parse(options.structure) : defaults.structure;
        options.style = options.style && options.style.length > 0 ? options.style : defaults.style;
        resolve(options);
      });
    });
  },

  restoreOldOptions: function(optionsStr) {
    var oldOptions = localStorage.getItem(OLD_NAMESPACE);
    var options = null;

    if (optionsStr === null && oldOptions !== null) {
      try {
        oldOptions = JSON.parse(oldOptions);
        if(!oldOptions || typeof oldOptions !== "object") oldOptions = {};

        options = {};
        options.theme = oldOptions.theme;
        options.addons = {
          prependHeader: JSON.parse(oldOptions.prependHeader || defaults.addons.prependHeader),
          maxJsonSize: parseInt(oldOptions.maxJsonSize || defaults.addons.maxJsonSize, 10)
        }

        // Update to at least the new max value
        if (options.addons.maxJsonSize < defaults.addons.maxJsonSize) {
          options.addons.maxJsonSize = defaults.addons.maxJsonSize;
        }

        options.addons = JSON.stringify(options.addons);
        options.structure = JSON.stringify(defaults.structure);
        options.style = defaults.style;
        
        // Save to localStorage synchronously
        localStorage.setItem(NAMESPACE, JSON.stringify(options));
        optionsStr = JSON.stringify(options);

      } catch(e) {
        console.error('[JSONViewer] error: ' + e.message, e);

      } finally {
        localStorage.removeItem(OLD_NAMESPACE);
      }
    }

    return optionsStr;
  }
}
