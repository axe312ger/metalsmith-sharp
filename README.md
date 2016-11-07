# metalsmith-sharp

> A fully flexible [sharp](http://sharp.dimens.io/) implementation for [Metalsmith](http://www.metalsmith.io/)

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](https://axe312.mit-license.org)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?style=flat)](https://github.com/feross/standard)
[![Build Status](https://img.shields.io/circleci/project/axe312ger/metalsmith-sharp/prototype.svg?maxAge=2592000)](https://circleci.com/gh/axe312ger/metalsmith-sharp)
[![CodeCov Badge](https://img.shields.io/codecov/c/github/axe312ger/metalsmith-sharp.svg?maxAge=2592000)](https://codecov.io/gh/axe312ger/metalsmith-sharp)
![David](https://img.shields.io/david/axe312ger/metalsmith-sharp.svg)
![David](https://img.shields.io/david/dev/axe312ger/metalsmith-sharp.svg)
[![semantic-release](https://img.shields.io/badge/%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)

## Install

```js
npm install --save metalsmith-sharp
```

## Usage

Just use it as regular Metalsmith plugin. If your environment does not support the import syntax, see further below.

```js
import Metalsmith from 'metalsmith'
import sharp from 'metalsmith-sharp'

Metalsmith('/path/to/project')
  .use(sharp({
    methods: [
      {
        name: 'resize',
        args: [ 200, 200 ]
      },
      { name: 'max' },
      {
        name: 'toFormat',
        args: [ 'jpeg' ]
      }
    ]
  }))
  .build()
```

### Node 6
```js
const sharp = require('metalsmith-sharp')
```

### Node 4
A version for the LTS version of node is also supplied. You can require it like this:

```js
const sharp = require('metalsmith-sharp/dist/node4')
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

### src

Glob for matching source files. All [minimatch features]() are supported.

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

If the resulting file has a different name, the default behavior is to create a new file. Set this option to false to delete the input file.

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
