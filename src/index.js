import { parse } from 'path'
import { cloneDeep } from 'lodash'
import multimatch from 'multimatch'
import Debug from 'debug'
import Sharp from 'sharp'

const debug = Debug('metalsmith-sharp')

function replacePlaceholders (text, placeholders) {
  return text.replace(/\{([^}]+)\}/g, (match, pattern) => {
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

        // src pattern will be reset when passing options on per file basis
        if (file.sharp) {
          file.sharp = [].concat(file.sharp)
          file.sharp.forEach(function (option) {
            option.src = filename
          })
        }

        // combine option sets passed on module call with options given on a per file basis
        const combinedOptionsList = file.sharp ? optionsList.concat(file.sharp) : optionsList

        // Iterate over all option sets.
        return combinedOptionsList.reduce((stepSequence, options) => {
          const stepOptions = {
            ...defaultOptions,
            ...options
          }

          if (multimatch(filename, stepOptions.src).length === 0) {
            return stepSequence
          }

          debug(`processing ${filename}`)

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
