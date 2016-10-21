import { parse } from 'path'
import { cloneDeep } from 'lodash'
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

function runSharp (image, options) {
  const sharp = Sharp(image.contents)

  options.methods.forEach((method) => {
    const args = [].concat(method.args)
    sharp[method.name](...args)
  })

  return sharp
  .toBuffer()
}

export default function (userOptions) {
  const defaultOptions = {
    src: '**/*.jpg',
    namingPattern: '{dir}{base}',
    methods: [],
    moveFile: false
  }

  const optionsList = [].concat(userOptions)

  // Return metalsmith plugin.
  return function (files, metalsmith, done) {
    Object.keys(files).reduce((fileSequence, filename) => {
      return fileSequence.then(() => {
        const file = files[filename]
        const replacements = getReplacements(filename)

        // Iterate over all option sets.
        return optionsList.reduce((stepSequence, options) => {
          const stepOptions = {
            ...defaultOptions,
            ...options
          }

          if (!minimatch(filename, stepOptions.src)) {
            return stepSequence
          }

          const image = cloneDeep(file)

          // Run sharp and save new file.
          return stepSequence
          .then(() => runSharp(image, stepOptions))
          .catch((err) => {
            err.message = `Could not process file "${filename}":\n${err.message}`
            return Promise.reject(err)
          })
          .then((buffer, info) => {
            const dist = replacePlaceholders(stepOptions.namingPattern, replacements)
            image.contents = buffer
            files[dist] = image

            if (filename !== dist && stepOptions.moveFile) {
              delete files[filename]
            }
          })
        }, Promise.resolve())
      })
    }, Promise.resolve())
    .then(() => {
      done()
    })
    .catch((err) => {
      done(err)
    })
  }
}
