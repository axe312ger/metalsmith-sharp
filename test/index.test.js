import { join } from 'path'
import test from 'ava'
import Metalsmith from 'metalsmith'
import resemble from 'node-resemble-js'

import sharp from '../src/index'

const FIXTURES_DIR = join(__dirname, 'fixtures')

test.beforeEach(async (t) => {
  const metalsmith = Metalsmith(FIXTURES_DIR)
    .source('./input')
    .destination('./results')

  t.context = {
    metalsmith
  }
})

test.cb('test renaming', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp({
      namingPattern: '{dir}renamed{ext}'
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('renamed.jpg')
      t.not(fileIndex, -1)
      t.pass()
      t.end()
    })
})

test.cb('test renaming with dir special case', (t) => {
  const { metalsmith } = t.context
  const resultDir = join(metalsmith._directory, metalsmith._destination)

  metalsmith
    .use((files) => {
      files[join(resultDir, 'example.jpg')] = files['example.jpg']
      delete files['example.jpg']
    })
    .use(sharp({
      namingPattern: '{dir}rename-full-path{ext}'
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf(join(resultDir, 'rename-full-path.jpg'))
      t.true(fileIndex !== -1)
      t.pass()
      t.end()
    })
})

test.cb('test moving of files', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp({
      namingPattern: '{dir}renamed{ext}',
      moveFile: true
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      t.is(fileList.length, 1)
      t.is(fileList[0], 'renamed.jpg')
      t.pass()
      t.end()
    })
})

test.cb('test method without arguments', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp({
      namingPattern: '{dir}negated{ext}',
      methods: [
        {
          name: 'negate'
        }
      ]
    }))
    .build(async (err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('negated.jpg')
      t.true(fileIndex !== -1)

      const expected = join(FIXTURES_DIR, 'expected', 'negated.jpg')
      const result = join(FIXTURES_DIR, 'results', fileList[fileIndex])

      resemble(expected)
        .compareTo(result)
        .onComplete((data) => {
          if (data.misMatchPercentage < 0.1) {
            t.pass()
            return t.end()
          }
          t.fail('resulting image differs from expected one')
          t.end()
        })
    })
})

test.cb('test method with arguments', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp({
      namingPattern: '{dir}extracted{ext}',
      methods: [
        {
          name: 'extract',
          args: {
            left: 300,
            top: 100,
            width: 400,
            height: 200
          }
        }
      ]
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('extracted.jpg')
      t.true(fileIndex !== -1)

      const expected = join(FIXTURES_DIR, 'expected', 'extracted.jpg')
      const result = join(FIXTURES_DIR, 'results', fileList[fileIndex])

      resemble(expected)
        .compareTo(result)
        .onComplete((data) => {
          if (data.misMatchPercentage < 0.1) {
            t.pass()
            return t.end()
          }
          t.fail('resulting image differs from expected one')
          t.end()
        })
    })
})

test.cb('test with set of options', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp([
      {
        namingPattern: '{dir}{name}-version-1{ext}',
        methods: [
          {
            name: 'normalize'
          },
          {
            name: 'flop'
          },
          {
            name: 'trim',
            args: 15
          }
        ]
      },
      {
        namingPattern: '{dir}{name}-version-2{ext}',
        methods: [
          {
            name: 'normalize'
          },
          {
            name: 'trim',
            args: 30
          }
        ]
      }
    ]))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      t.is(fileList.length, 3)
      t.true(fileList.indexOf('example-version-1.jpg') !== -1)
      t.true(fileList.indexOf('example-version-2.jpg') !== -1)

      resemble(join(FIXTURES_DIR, 'expected', 'example-version-1.jpg'))
        .compareTo(join(FIXTURES_DIR, 'results', 'example-version-1.jpg'))
        .onComplete((data) => {
          if (data.misMatchPercentage < 0.1) {
            return resemble(join(FIXTURES_DIR, 'expected', 'example-version-2.jpg'))
              .compareTo(join(FIXTURES_DIR, 'results', 'example-version-2.jpg'))
              .onComplete((data) => {
                if (data.misMatchPercentage < 0.1) {
                  t.pass()
                  return t.end()
                }
                t.fail('resulting image version 2 differs from expected one')
                t.end()
              })
          }
          t.fail('resulting image version 2 differs from expected one')
          t.end()
        })
    })
})

test.cb('test skipping of matching files', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use((files) => {
      files['not.matching'] = { ...files[Object.keys(files)[0]] }
    })
    .use(sharp({
      methods: [
        {
          name: 'negate'
        }
      ]
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      t.not(files[fileList[0]].contents.length, files[fileList[1]].contents.length)
      t.pass()
      t.end()
    })
})

test.cb('test unknown placeholders', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use(sharp({
      namingPattern: '{unknown-placeholder}{ext}'
    }))
    .build((err, files) => {
      if (err) {
        t.fail()
        t.end()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('{unknown-placeholder}.jpg')
      t.true(fileIndex !== -1)
      t.pass()
      t.end()
    })
})

test.cb('test catch of invalid image data error', (t) => {
  const { metalsmith } = t.context

  metalsmith
    .use((files) => {
      files['example.jpg'].contents = new Buffer('')
    })
    .use(sharp())
    .build((err, files) => {
      if (err) {
        t.not(err.toString().indexOf('Input buffer contains unsupported image format'), -1)
        t.pass()
        return t.end()
      }
      t.fail('no error was thrown')
      t.end()
    })
})
