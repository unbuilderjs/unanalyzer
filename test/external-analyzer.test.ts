import { expect, it } from 'vitest'
import { ExternalAnalyzer } from '../src/external-analyzer'

it('should work', async () => {
  const externalAnalyzer = ExternalAnalyzer.fromPackageJson({
    dependencies: {
      foo: '1.0.0',
      bar: '1.0.0',
    },
    devDependencies: {
      baz: '1.0.0',
      qux: '1.0.0',
    },
  })

  const external = externalAnalyzer.getExternalModules()
  const noExternal = externalAnalyzer.getNoExternalModules()
  expect(external).toStrictEqual(['foo', 'bar'])
  expect(noExternal).toStrictEqual(['baz', 'qux'])
})

it('should throw an error if there are duplicate dependencies', async () => {
  expect(() => {
    ExternalAnalyzer.fromPackageJson({
      dependencies: {
        foo: '1.0.0',
        bar: '1.0.0',
      },
      devDependencies: {
        foo: '1.0.0',
        baz: '1.0.0',
      },
    })
  }).toThrowError()
})
