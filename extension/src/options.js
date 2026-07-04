require('./options-styles');
var CodeMirror = require('codemirror');
require('codemirror/addon/fold/foldcode');
require('codemirror/addon/fold/foldgutter');
require('codemirror/addon/fold/brace-fold');
require('codemirror/mode/javascript/javascript');
require('codemirror/addon/hint/show-hint');
require('codemirror/addon/hint/css-hint');
require('codemirror/mode/css/css');
var sweetAlert = require('sweetalert');

var Storage = require('./json-viewer/storage');
var renderThemeList = require('./json-viewer/options/render-theme-list');
var renderAddons = require('./json-viewer/options/render-addons');
var renderStructure = require('./json-viewer/options/render-structure');
var renderStyle = require('./json-viewer/options/render-style');
var bindSaveButton = require('./json-viewer/options/bind-save-button');
var bindResetButton = require('./json-viewer/options/bind-reset-button');

function isValidJSON(pseudoJSON) {
  try {
    JSON.parse(pseudoJSON);
    return true;

  } catch(e) {
    return false;
  }
}

function renderVersion() {
  var version = process.env.VERSION;
  var versionLink = document.getElementsByClassName('version')[0];
  versionLink.innerHTML = version;
  versionLink.href = "https://github.com/tulios/json-viewer/tree/" + version;
}

function onLoaded() {
  Storage.load().then(function(currentOptions) {
    renderVersion();
    renderThemeList(CodeMirror, currentOptions.theme);
    var addonsEditor = renderAddons(CodeMirror, currentOptions.addons);
    var structureEditor = renderStructure(CodeMirror, currentOptions.structure);
    var styleEditor = renderStyle(CodeMirror, currentOptions.style);
    
    var optionsThemeSelect = document.getElementById("optionsTheme");
    if (optionsThemeSelect) {
      optionsThemeSelect.value = currentOptions.optionsTheme || "dark";
      var updateTheme = function(val) {
        if (val === "light") {
          document.body.classList.remove("dark-mode");
          document.body.classList.add("light-mode");
        } else {
          document.body.classList.remove("light-mode");
          document.body.classList.add("dark-mode");
        }
      };
      updateTheme(optionsThemeSelect.value);
      optionsThemeSelect.onchange = function() {
        updateTheme(optionsThemeSelect.value);
      };
    }

    bindResetButton();
    bindSaveButton([addonsEditor, structureEditor, styleEditor], function(options) {
      if (!isValidJSON(options.addons)) {
        sweetAlert("Ops!", "\"Add-ons\" isn't a valid JSON", "error");

      } else if (!isValidJSON(options.structure)) {
        sweetAlert("Ops!", "\"Structure\" isn't a valid JSON", "error");

      } else {
        Storage.save(options).then(function() {
          sweetAlert("Success", "Options saved!", "success");
        }).catch(function(err) {
          sweetAlert("Ops!", "Failed to save options: " + err.message, "error");
        });
      }
    });
  }).catch(function(err) {
    console.error("Failed to load options", err);
  });
}

document.addEventListener("DOMContentLoaded", onLoaded, false);
