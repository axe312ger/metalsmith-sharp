# metalsmith-sharp

> A fully flexible [sharp](http://sharp.dimens.io/) implementation for [Metalsmith](http://www.metalsmith.io/)

[![](https://img.shields.io/npm/v/metalsmith-sharp.svg)](https://www.npmjs.com/package/metalsmith-sharp)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://axe312.mit-license.org)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![Build Status](https://img.shields.io/circleci/project/axe312ger/metalsmith-sharp.svg?maxAge=2592000)](https://circleci.com/gh/axe312ger/metalsmith-sharp)
[![CodeCov Badge](https://img.shields.io/codecov/c/github/axe312ger/metalsmith-sharp.svg?maxAge=2592000)](https://codecov.io/gh/axe312ger/metalsmith-sharp)
[![semantic-release](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Install

```js
npm install metalsmith-sharp
```

## Usage

Just use it as regular Metalsmith plugin. An ES-Modules version is exposed as well, ready to be used with `import sharp from 'metalsmith-sharp'`

```js
const Metalsmith = require('metalsmith')
const sharp = require('metalsmith-sharp')

Metalsmith(__dirname)
  .use(
    sharp({
      methods: [
        {
          name: 'resize',
          args: [200, 200]
        },
        {
          name: 'resize',
          args: { fit: 'inside' }
        },
        {
          name: 'toFormat',
          args: ['jpeg']
        }
      ]
    })
  )
  .build((err) => {
    if (err) return console.error(err)
    console.log('Build successfully finished! It is 🥙 time!')
  })
```

You can also do multiple image manipulations in one call:

```js
const Metalsmith = require('metalsmith')
const sharp = require('metalsmith-sharp')

Metalsmith(__dirname)
  .use(
    sharp([
      {
        namingPattern: '{dir}{name}-version-1{ext}',
        methods: [
          { name: 'normalize' },
          { name: 'flop' },
          {
            name: 'trim',
            args: 15
          }
        ]
      },
      {
        namingPattern: '{dir}{name}-version-2{ext}',
        methods: [
          { name: 'normalize' },
          {
            name: 'trim',
            args: 30
          }
        ]
      }
    ])
  )
  .build((err) => {
    if (err) return console.error(err)
    console.log('Build successfully finished! It is 🥙 time!')
  })
```

For further examples can be found in the test directory.

## Options

Default options:
```js
{
  src: '**/*.jpg',
  namingPattern: '{dir}{base}',
  methods: [],
  moveFile: false
}
```

### methods

Array of method objects that will trigger the corresponding sharp method. They will be called with the passed arguments and in the given order.

Check the [sharp API documentation](http://sharp.dimens.io/en/stable/api/) for a full list of supported methods.

```js
{
  methods: [
    {
      name: 'anySharpMethod',
      args: [ 400, 300 ]
    }
  ]
}
```

#### args

args can be specified as an array that will be passed directly into the method or as a callback function.

The callback function will be provided with the [image metadata](http://sharp.dimens.io/en/stable/api-input/#metadata) and should return an array.

```js
{
  method: [
    {
      name: 'resize',
      args: (metadata) => ([
        Math.round(metadata.width * 0.5),
        Math.round(metadata.height * 0.5)
      ])
    }
  ]
}
```

### src

Glob for matching source files. All [minimatch features](https://github.com/isaacs/minimatch#features) are supported.

```js
{
  src: '**/*.jpg'
}
```

### namingPattern

Renaming pattern for the resulting file. By default, the input file will be overwritten.

Supported placeholders:
* `{dir}`: Directory of file followed by slash
* `{base}`: Full filename with extension
* `{name}`: Filename without extension
* `{ext}`: File extension with leading dot

```js
{
  namingPattern: '{dir}/{name}-thumb{ext}'
}
```

### moveFile

If the resulting file has a different name, the default behavior is to create a new file and keep the input file. Set this option to true to delete the input file.

```js
{
  moveFile: true
}
```

## Development

This project follows the [standard](https://github.com/feross/standard) coding and the [conventional changelog](https://github.com/conventional-changelog/conventional-changelog-angular/blob/master/convention.md) commit message style. Also it is configured to never decrease the code coverage of its tests.

Also make sure you check out all available npm scripts via `npm run`.

## Contributing

Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/axe312ger/metalsmith-sharp/issues/new).
But before doing anything, please read the [CONTRIBUTING.md](./CONTRIBUTING.md) guidelines.
