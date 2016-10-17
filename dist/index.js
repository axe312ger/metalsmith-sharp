'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

exports.default = function (options) {
  const defaultOptions = {
    src: '**/*.jpg',
    namingPattern: '{dir}{base}',
    methods: [],
    moveFile: false
  };

  options = _extends({}, defaultOptions, options);

  return function (files, metalsmith, done) {
    const promises = Object.keys(files).map(filename => {
      if ((0, _minimatch2.default)(filename, options.src)) {
        const file = files[filename];

        const replacements = getReplacements(filename);
        const dist = replacePlaceholders(options.namingPattern, replacements);
        const sharp = (0, _sharp2.default)(file.contents);

        options.methods.forEach(method => {
          const args = [].concat(method.args);
          sharp[method.name](...args);
        });

        return sharp.toBuffer().catch(err => {
          err.message = `Could not process file "${ filename }":\n${ err.message }`;
          return Promise.reject(err);
        }).then((buffer, info) => {
          file.contents = buffer;
          files[dist] = file;

          if (filename !== dist && options.moveFile) {
            delete files[filename];
          }
        });
      }

      return Promise.resolve();
    });

    Promise.all(promises).then(() => {
      done();
    }).catch(err => {
      done(err);
    });
  };
};

var _path = require('path');

var _minimatch = require('minimatch');

var _minimatch2 = _interopRequireDefault(_minimatch);

var _sharp = require('sharp');

var _sharp2 = _interopRequireDefault(_sharp);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function replacePlaceholders(text, placeholders) {
  return text.replace(/\{([^\}]+)\}/g, (match, pattern) => {
    if (placeholders.hasOwnProperty(pattern)) {
      return placeholders[pattern];
    }
    return match;
  });
}

function getReplacements(path) {
  const parsedPath = (0, _path.parse)(path);
  if (parsedPath.dir.length) {
    parsedPath.dir = `${ parsedPath.dir }/`;
  }
  return parsedPath;
}