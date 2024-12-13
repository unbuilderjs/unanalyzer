import fs from 'node:fs'
import { expect, it } from 'vitest'
import packageJsonAnalyzer from '../src/package-json-file'

it('should read nearest package.json file', async () => {
  const [str, packageJson] = await packageJsonAnalyzer.getNearestPackageJson(__dirname)

  expect(str).toContain('package.json')
  expect(JSON.parse(fs.readFileSync(str, 'utf-8'))).toStrictEqual(packageJson)
})
