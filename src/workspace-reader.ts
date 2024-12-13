import fs from 'node:fs'
import { load } from 'js-yaml'
import { get } from 'lodash-es'
import { detectSync } from 'package-manager-detector/detect'
import nearestFileReader from './nearest-file-reader'
import packageJsonFile from './package-json-file'

export type Workspace = string[]

export namespace Workspace {
  export async function readFromPackageJson(searchingPath: string = '.'): Promise<Workspace | undefined> {
    const [_, content] = await packageJsonFile.getNearestPackageJson(searchingPath)
    const packageJsonWorkspaces = get(content, 'workspaces')
    if (Array.isArray(packageJsonWorkspaces))
      return packageJsonWorkspaces
    if (typeof packageJsonWorkspaces === 'object' && Array.isArray(packageJsonWorkspaces.packages))
      return packageJsonWorkspaces.packages
    if (typeof packageJsonWorkspaces === 'string')
      return [packageJsonWorkspaces]
  }

  export async function readFromPnpmWorkspaceFile(searchingPath: string = '.'): Promise<Workspace | undefined> {
    const filePath = await nearestFileReader.getNearestFileFromParent('pnpm-workspace.yaml', searchingPath)
    if (!filePath)
      return
    const content = fs.readFileSync(filePath, 'utf-8')
    const loadedContent = load(content)
    const pnpmWorkspaces = get(loadedContent, 'packages')
    if (Array.isArray(pnpmWorkspaces))
      return pnpmWorkspaces
  }
}

export async function getNearestWorkspaceConfig(searchingPath: string = '.'): Promise<Workspace | undefined> {
  const detectedPackageManager = detectSync()
  if (detectedPackageManager && (detectedPackageManager.agent === 'pnpm' || detectedPackageManager.agent === 'pnpm@6'))
    return await Workspace.readFromPnpmWorkspaceFile(searchingPath)
  return await Workspace.readFromPackageJson(searchingPath)
}
