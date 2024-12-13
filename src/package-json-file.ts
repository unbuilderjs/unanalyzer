import fs from 'node:fs'
import { cwd } from 'node:process'
import { PackageJson } from 'type-fest'
import nearestFileReader from './nearest-file-reader'

/**
 * Get the nearest package.json file from the given path.
 *
 * @param {string} searchingPath The path to start searching from.
 * @return {Promise<[string, PackageJson]>} The path to the nearest package.json file and its content.
 * @memberof PackageJsonAnalyzer
 * @throws {Error} If the argument `searchingPath` does not exist or is not a file or directory path.
 * @throws {SyntaxError} If the package.json file is not a valid JSON file.
 */
export async function getNearestPackageJson(searchingPath: string = '.'): Promise<[string, PackageJson]> {
  const packageJsonPath = await nearestFileReader.getNearestFileFromParent(searchingPath, 'package.json')
  return [
    packageJsonPath,
    JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8')) as PackageJson,
  ]
}

const _packageJsonFilesCache: Record<string, PackageJson | 'parse-error'> = {}

/**
 * Discover all package.json files from the given path's parent directories.
 *
 * @param {string} searchingPath The path to start searching from. default is `process.cwd()`.
 * @return {Promise<Record<string, PackageJson | 'parse-error'>>} A record of package.json file paths and their content. If the file is not a valid JSON file, the value will be `'parse-error'`.
 * @memberof PackageJsonAnalyzer
 */
export async function getPackageJsonFilesFromParent(searchingPath: string = cwd()): Promise<Record<string, PackageJson | 'parse-error'>> {
  const filePaths = await nearestFileReader.searchFilesFromParent(searchingPath, 'package.json')
  const packageJsonFiles: Record<string, PackageJson | 'parse-error'> = {}

  for (let i = 0; i < filePaths.length; i++) {
    if (_packageJsonFilesCache[filePaths[i]]) {
      packageJsonFiles[filePaths[i]] = _packageJsonFilesCache[filePaths[i]]
    }
    else {
      try {
        packageJsonFiles[filePaths[i]] = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8')) as PackageJson
      }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (_) {
        packageJsonFiles[filePaths[i]] = 'parse-error'
      }
    }
  }

  return packageJsonFiles
}

export default {
  getNearestPackageJson,
  getPackageJsonFilesFromParent,
}
