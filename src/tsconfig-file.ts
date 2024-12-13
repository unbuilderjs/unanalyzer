import fs from 'node:fs'
import { TsConfigJson } from 'type-fest'
import nearestFileReader from './nearest-file-reader'

export async function getNearestTsConfig(searchingPath: string = '.'): Promise<string | undefined> {
  return nearestFileReader.getNearestFileFromParent(searchingPath, 'tsconfig.json')
}

const _tsConfigFilesCache: Record<string, TsConfigJson | 'parse-error'> = {}

export async function getTsConfigFilesFromParent(searchingPath: string = '.'): Promise<Record<string, TsConfigJson | 'parse-error'>> {
  const filePaths = await nearestFileReader.searchFilesFromParent(searchingPath, 'tsconfig.json')
  const tsConfigFiles: Record<string, TsConfigJson | 'parse-error'> = {}

  for (let i = 0; i < filePaths.length; i++) {
    if (_tsConfigFilesCache[filePaths[i]]) {
      tsConfigFiles[filePaths[i]] = _tsConfigFilesCache[filePaths[i]]
    }
    else {
      try {
        tsConfigFiles[filePaths[i]] = JSON.parse(fs.readFileSync(filePaths[i], 'utf-8')) as TsConfigJson
      }
      // eslint-disable-next-line unused-imports/no-unused-vars
      catch (_) {
        tsConfigFiles[filePaths[i]] = 'parse-error'
      }
    }
  }

  return tsConfigFiles
}

export default {
  getNearestTsConfig,
  getTsConfigFilesFromParent,
}
