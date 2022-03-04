import { join } from 'path'
import Metalsmith from 'metalsmith'
import resemble from 'node-resemble-js'

import sharp from '../src/index'

const FIXTURES_DIR = join(__dirname, 'fixtures')
const EXPECTED_DIR = join(FIXTURES_DIR, 'expected')
const RESULT_DIR = join(FIXTURES_DIR, 'results')

let metalsmith

beforeEach(async () => {
  metalsmith = Metalsmith(FIXTURES_DIR)
    .source('./input')
    .destination('./results')
})

test('test renaming', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{dir}renamed{ext}',
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('renamed.jpg')
      expect(fileIndex).not.toBe(-1)
      done()
    })
})

test('test renaming with dir special case', (done) => {
  metalsmith
    .use((files) => {
      files[join(RESULT_DIR, 'example.jpg')] = files['example.jpg']
      delete files['example.jpg']
    })
    .use(
      sharp({
        namingPattern: '{dir}rename-full-path{ext}',
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf(
        join(RESULT_DIR, 'rename-full-path.jpg')
      )
      expect(fileIndex !== -1).toBe(true)
      done()
    })
})

test('test moving of files', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{dir}renamed{ext}',
        moveFile: true,
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      expect(fileList.length).toBe(1)
      expect(fileList[0]).toBe('renamed.jpg')
      done()
    })
})

test('test method without arguments', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{dir}negated{ext}',
        methods: [{ name: 'negate' }],
      })
    )
    .build(async (err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('negated.jpg')
      expect(fileIndex !== -1).toBe(true)

      const expected = join(EXPECTED_DIR, 'negated.jpg')
      const result = join(RESULT_DIR, 'negated.jpg')

      resemble(expected)
        .compareTo(result)
        .onComplete((data) => {
          if (data.misMatchPercentage <= 1) {
            return done()
          }
          done.fail(
            'resulting image differs from expected one by ' +
              data.misMatchPercentage
          )
          done()
        })
    })
})

test('test method with arguments', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{dir}extracted{ext}',
        methods: [
          {
            name: 'extract',
            args: {
              left: 300,
              top: 100,
              width: 400,
              height: 200,
            },
          },
        ],
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('extracted.jpg')
      expect(fileIndex !== -1).toBe(true)

      const expected = join(EXPECTED_DIR, 'extracted.jpg')
      const result = join(RESULT_DIR, 'extracted.jpg')

      resemble(expected)
        .compareTo(result)
        .onComplete((data) => {
          if (data.misMatchPercentage <= 1) {
            return done()
          }
          done.fail(
            'resulting image differs from expected one by ' +
              data.misMatchPercentage
          )
          done()
        })
    })
})

test('test method with callback for arguments', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{dir}scaled{ext}',
        methods: [
          {
            name: 'resize',
            args: (metadata) => [
              Math.round(metadata.width * 0.5),
              Math.round(metadata.height * 0.5),
            ],
          },
        ],
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('scaled.jpg')
      expect(fileIndex !== -1).toBe(true)

      const expected = join(EXPECTED_DIR, 'scaled.jpg')
      const result = join(RESULT_DIR, 'scaled.jpg')

      resemble(expected)
        .compareTo(result)
        .onComplete((data) => {
          if (data.misMatchPercentage <= 1) {
            return done()
          }
          done.fail(
            'resulting image differs from expected one by ' +
              data.misMatchPercentage
          )
          done()
        })
    })
})

test('test with set of options', (done) => {
  metalsmith
    .use(
      sharp([
        {
          namingPattern: '{dir}{name}-version-1{ext}',
          methods: [
            { name: 'normalize' },
            { name: 'flop' },
            {
              name: 'trim',
              args: 15,
            },
          ],
        },
        {
          namingPattern: '{dir}{name}-version-2{ext}',
          methods: [
            { name: 'normalize' },
            {
              name: 'trim',
              args: 70,
            },
          ],
        },
      ])
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      expect(fileList.length).toBe(3)
      expect(fileList.indexOf('example-version-1.jpg') !== -1).toBe(true)
      expect(fileList.indexOf('example-version-2.jpg') !== -1).toBe(true)

      resemble(join(EXPECTED_DIR, 'example-version-1.jpg'))
        .compareTo(join(RESULT_DIR, 'example-version-1.jpg'))
        .onComplete((data) => {
          if (data.misMatchPercentage <= 1) {
            return resemble(join(EXPECTED_DIR, 'example-version-2.jpg'))
              .compareTo(join(RESULT_DIR, 'example-version-2.jpg'))
              .onComplete((data) => {
                if (data.misMatchPercentage <= 1) {
                  return done()
                }
                done.fail(
                  'resulting image version 2 differs from expected one by ' +
                    data.misMatchPercentage
                )
                done()
              })
          }
          done.fail(
            'resulting image version 1 differs from expected one by ' +
              data.misMatchPercentage
          )
          done()
        })
    })
})

test('test skipping of matching files', (done) => {
  metalsmith
    .use((files) => {
      files['not.matching'] = { ...files[Object.keys(files)[0]] }
    })
    .use(
      sharp({
        methods: [{ name: 'negate' }],
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      expect(files[fileList[0]].contents.length).not.toBe(
        files[fileList[1]].contents.length
      )
      done()
    })
})

test('test unknown placeholders', (done) => {
  metalsmith
    .use(
      sharp({
        namingPattern: '{unknown-placeholder}{ext}',
      })
    )
    .build((err, files) => {
      if (err) {
        done.fail()
        done()
        throw err
      }
      const fileList = Object.keys(files)
      const fileIndex = fileList.indexOf('{unknown-placeholder}.jpg')
      expect(fileIndex !== -1).toBe(true)
      done()
    })
})

test('test catch of invalid image data error', (done) => {
  metalsmith
    .use((files) => {
      files['example.jpg'].contents = Buffer.from('this is not image data but some mocked text')
    })
    .use(sharp())
    .build((err, files) => {
      if (err) {
        expect(
          err
            .toString()
            .indexOf('buffer contains unsupported image format')
        ).not.toBe(-1)
        return done()
      }
      done.fail('no error was thrown')
      done()
    })
})
