import path from 'node:path'
import { expect, it } from 'vitest'
import { AliasAnalyzer } from '../src/alias-analyzer'

it('should work', async () => {
  const result = await AliasAnalyzer.fromTsConfig({
    compilerOptions: {
      paths: {
        // When starting with `./`, it will ignore the `baseUrl` and resolve the path based on the tsconfig.json file.
        '~/': ['./src/*'],
        '@/*': ['src/*'],
        '#/*': ['./test/*'],
      },
      baseUrl: './base',
    },
  }).analyze()

  expect(result).toStrictEqual({
    '~/': path.resolve('./src'),
    '@/': path.resolve('./base', 'src'),
    '#/': path.resolve('./test'),
  })
})
