"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("core-js/modules/es.regexp.exec.js");

require("core-js/modules/es.string.replace.js");

require("core-js/modules/es.array.iterator.js");

require("core-js/modules/es.promise.js");

var _path = require("path");

var _lodash = require("lodash");

var _minimatch = _interopRequireDefault(require("minimatch"));

var _debug = _interopRequireDefault(require("debug"));

var _sharp = _interopRequireDefault(require("sharp"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

const debug = (0, _debug.default)('metalsmith-sharp');

function replacePlaceholders(text, placeholders) {
  return text.replace(/\{([^}]+)\}/g, (match, pattern) => {
    if (pattern in placeholders) {
      return placeholders[pattern];
    }

    return match;
  });
}

function getReplacements(path) {
  const parsedPath = (0, _path.parse)(path);

  if (parsedPath.dir.length) {
    parsedPath.dir = `${parsedPath.dir}/`;
  }

  return parsedPath;
}

function runSharp(image, options) {
  const sharp = (0, _sharp.default)(image.contents);
  return sharp.metadata().then(metadata => {
    options.methods.forEach(method => {
      let args;

      if (typeof method.args === 'function') {
        args = method.args(metadata);
      } else {
        args = [].concat(method.args);
      }

      sharp[method.name](...args);
    });
    return sharp.toBuffer();
  });
}

function _default(userOptions) {
  const defaultOptions = {
    src: '**/*.jpg',
    namingPattern: '{dir}{base}',
    methods: [],
    moveFile: false
  };
  const optionsList = [].concat(userOptions); // Return metalsmith plugin.

  return function (files, metalsmith, done) {
    Object.keys(files).reduce((fileSequence, filename) => {
      return fileSequence.then(() => {
        const file = files[filename];
        const replacements = getReplacements(filename); // Iterate over all option sets.

        return optionsList.reduce((stepSequence, options) => {
          const stepOptions = _objectSpread(_objectSpread({}, defaultOptions), options);

          if (!(0, _minimatch.default)(filename, stepOptions.src)) {
            return stepSequence;
          }

          debug(`processing ${filename}`);
          const image = (0, _lodash.cloneDeep)(file); // Run sharp and save new file.

          return stepSequence.then(() => runSharp(image, stepOptions)).catch(err => {
            err.message = `Could not process file "${filename}":\n${err.message}`;
            return Promise.reject(err);
          }).then((buffer, info) => {
            const dist = replacePlaceholders(stepOptions.namingPattern, replacements);
            image.contents = buffer;
            files[dist] = image;

            if (filename !== dist && stepOptions.moveFile) {
              delete files[filename];
            }
          });
        }, Promise.resolve());
      });
    }, Promise.resolve()).then(() => {
      done();
    }).catch(err => {
      done(err);
    });
  };
}

module.exports = exports.default;