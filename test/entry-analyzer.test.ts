/* eslint-disable no-console */
import { it } from 'vitest'
import { EntryAnalyzer } from '../src/entry-analyzer'

it('should work', async () => {
  const result = await EntryAnalyzer.fromPackageJson({
    packageJson: {
      main: './dist/index.cjs',
      module: './dist/index.mjs',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          import: './dist/index.mjs',
          require: './dist/index.cjs',
          types: './dist/index.d.ts',
          entry: './src/index.ts',
        },
        './types': {
          import: './dist/types.mjs',
          require: './dist/types.cjs',
          types: './dist/types.d.ts',
        },
      },
    },
  })

  console.dir(await result.getRollupLikeResult(), { depth: null })
})
