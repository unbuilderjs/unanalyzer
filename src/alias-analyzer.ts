import type { UserConfig as ViteConfig } from 'vite'
import path from 'node:path'
import { cwd } from 'node:process'
import { TsConfigJson } from 'type-fest'

export interface AliasTarget {
  aliasPath: string
  baseURL?: string
  tsConfigPath: string
}

export class AliasAnalyzer {
  private aliases: Map<string, AliasTarget> = new Map()

  private constructor() {}

  addAlias(alias: string, target: AliasTarget) {
    this.aliases.set(alias, target)
  }

  private removeStarIfExist(currentPath: string): string {
    if (currentPath.endsWith('*')) {
      const basePath = path.dirname(currentPath)
      if (basePath.endsWith('*'))
        return this.removeStarIfExist(currentPath)
      return basePath
    }
    return currentPath
  }

  private resolveAlias(target: AliasTarget): string {
    const { aliasPath, baseURL, tsConfigPath } = target
    const parsedAliasPath = this.removeStarIfExist(aliasPath)
    if (aliasPath.startsWith('./'))
      return path.resolve(path.dirname(tsConfigPath), parsedAliasPath)

    return baseURL
      ? path.resolve(baseURL, parsedAliasPath)
      : path.resolve(parsedAliasPath)
  }

  async analyze(): Promise<Record<string, string>> {
    const result: Record<string, string> = {}
    for (const [alias, target] of this.aliases) {
      let aliasPath = this.removeStarIfExist(alias)
      if (!aliasPath.endsWith('/'))
        aliasPath += '/'
      result[aliasPath] = this.resolveAlias(target)
    }
    return result
  }

  public static fromTsConfig(tsconfig: TsConfigJson, tsConfigPath: string = path.resolve(cwd(), 'tsconfig.json')): AliasAnalyzer {
    const aliasAnalyzer = new AliasAnalyzer()

    for (const [alias, path] of Object.entries((tsconfig.compilerOptions || {}).paths || {})) {
      aliasAnalyzer.addAlias(alias, {
        tsConfigPath,
        baseURL: (tsconfig.compilerOptions || {}).baseUrl,
        aliasPath: path[0],
      })
    }

    return aliasAnalyzer
  }

  public static fromViteConfig(viteConfig: ViteConfig): AliasAnalyzer {
    const aliasAnalyzer = new AliasAnalyzer()

    for (const [alias, path] of Object.entries(viteConfig.resolve?.alias || {})) {
      aliasAnalyzer.addAlias(alias, {
        tsConfigPath: '',
        baseURL: '',
        aliasPath: path,
      })
    }

    return aliasAnalyzer
  }
}
