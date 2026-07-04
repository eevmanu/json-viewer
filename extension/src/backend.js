var chrome = require('chrome-framework');
var Storage = require('./json-viewer/storage');

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === "GET_OPTIONS") {
    Storage.load().then(function(options) {
      sendResponse({err: null, value: options});
    }).catch(function(err) {
      console.error('[JSONViewer] error: ' + err.message, err);
      sendResponse({err: err});
    });
    return true; // Keep the message channel open for async response
  }
});
