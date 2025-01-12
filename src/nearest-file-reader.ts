import fs from 'node:fs'
import path from 'node:path'
import { cwd } from 'node:process'

const _getFilesFromParentCache: string[] = []

export async function searchFilesFromParent(searchingPath: string = cwd(), fileName: string): Promise<string[]> {
  if (!fs.existsSync(searchingPath))
    throw new Error(`File not found: ${searchingPath}`)
  if (searchingPath === '/')
    return _getFilesFromParentCache

  const pathStat = fs.statSync(searchingPath)
  if (pathStat.isFile() && path.basename(searchingPath) === fileName)
    _getFilesFromParentCache.push(searchingPath)

  const searchingFolderAbsolutePath: string = pathStat.isDirectory()
    ? path.resolve(searchingPath)
    : path.dirname(path.resolve(searchingPath))

  const packageJsonPath = path.resolve(searchingFolderAbsolutePath, fileName)
  if (fs.existsSync(packageJsonPath) && fs.statSync(packageJsonPath).isFile())
    _getFilesFromParentCache.push(packageJsonPath)

  await searchFilesFromParent(path.dirname(searchingFolderAbsolutePath), fileName)
  return _getFilesFromParentCache
}

export async function getNearestFileFromParent(searchingPath: string = cwd(), fileName: string): Promise<string> {
  const result = await searchFilesFromParent(searchingPath, fileName)
  const firstFile = result.find(file => path.basename(file) === fileName)
  if (!firstFile)
    throw new Error(`File not found: ${fileName}`)
  return firstFile
}

export default {
  searchFilesFromParent,
  getNearestFileFromParent,
}
