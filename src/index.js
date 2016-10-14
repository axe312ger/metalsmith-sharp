import { parse } from 'path'
import minimatch from 'minimatch'
import Sharp from 'sharp'

function replacePlaceholders (text, placeholders) {
  return text.replace(/\{([^\}]+)\}/g, (match, pattern) => {
    if (placeholders.hasOwnProperty(pattern)) {
      return placeholders[pattern]
    }
    return match
  })
}

function getReplacements (path) {
  const parsedPath = parse(path)
  if (parsedPath.dir.length) {
    parsedPath.dir = `${parsedPath.dir}/`
  }
  return parsedPath
}

export default function (options) {
  const defaultOptions = {
    src: '**/*.jpg',
    namingPattern: '{dir}{base}',
    methods: [],
    moveFile: false
  }

  options = {
    ...defaultOptions,
    ...options
  }

  return function (files, metalsmith, done) {
    const promises = Object.keys(files).map((filename) => {
      if (minimatch(filename, options.src)) {
        const file = files[filename]

        const replacements = getReplacements(filename)
        const dist = replacePlaceholders(options.namingPattern, replacements)
        const sharp = Sharp(file.contents)

        options.methods.forEach((method) => {
          const args = [].concat(method.args)
          sharp[method.name](...args)
        })

        return sharp
          .toBuffer()
          .catch((err) => {
            err.message = `Could not process file "${filename}":\n${err.message}`
            return Promise.reject(err)
          })
          .then((buffer, info) => {
            file.contents = buffer
            files[dist] = file

            if (filename !== dist && options.moveFile) {
              delete files[filename]
            }
          })
      }

      return Promise.resolve()
    })

    Promise.all(promises).then(() => {
      done()
    })
    .catch((err) => {
      done(err)
    })
  }
}
