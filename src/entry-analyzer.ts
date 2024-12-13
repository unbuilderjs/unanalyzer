import fs from 'node:fs'
import path from 'node:path'
import { match } from 'ts-pattern'
import { PackageJson } from 'type-fest'
import { AnalyzedEntry } from './entry-analyzed'
import { EntryType, Extension, IPreAnalyzeEntry } from './types'

export interface FromPackageJsonOptions {
  packageJson?: PackageJson
  beforeAnalyze?: (analyzer: EntryAnalyzer, packageJson: PackageJson) => any
}

export class EntryAnalyzer {
  private preAnalyzeEntries = new Set<IPreAnalyzeEntry>()
  private detectedEntries = new AnalyzedEntry()
  private baseAnalyzeAbsolutePaths: string[] = [path.resolve('src')]
  private entryExtensions: Extension[] = ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs', '.json', '.css']

  private constructor() {}

  protected addPreAnalyzeEntry(output: string, type: EntryType) {
    this.preAnalyzeEntries.add({
      type,
      output,
      ...path.parse(output),
    })
  }

  addBaseAnalyzePath(analyzePath: string) {
    const resolvedPath = path.resolve(analyzePath)
    this.baseAnalyzeAbsolutePaths.push(resolvedPath)
  }

  getBaseAnalyzePaths(): readonly string[] {
    return this.baseAnalyzeAbsolutePaths
  }

  setDefaultProjectType(projectType: PackageJson['type']) {
    this.detectedEntries.setDefaultProjectType(projectType)
  }

  setEntryExtensions(extensions: Extension[]) {
    this.entryExtensions = extensions
  }

  getEntryExtensions(): readonly Extension[] {
    return this.entryExtensions
  }

  private async detectEntryPath(baseAnalyzePath: string, entry: IPreAnalyzeEntry): Promise<string[]> {
    const detectedFilePaths: string[] = []
    const resolvedEntryPath = path.resolve(baseAnalyzePath, path.basename(entry.output))

    for (const extension of this.entryExtensions) {
      const parsedPath = path.parse(resolvedEntryPath)
      // 特殊处理 .d.ts 文件
      if (parsedPath.ext === '.ts' && parsedPath.name.endsWith('.d')) {
        parsedPath.name = parsedPath.name.slice(0, -2)
        parsedPath.ext = '.d.ts'
      }

      // 检查对应的文件是否存在
      parsedPath.base = parsedPath.name + extension
      const detectedPath = path.format(parsedPath)
      if (fs.existsSync(detectedPath))
        detectedFilePaths.push(detectedPath)
    }

    return detectedFilePaths
  }

  private async detectEntry(entry: IPreAnalyzeEntry): Promise<string[]> {
    const detectedFilePaths: string[] = []
    for (const baseAnalyzePath of this.baseAnalyzeAbsolutePaths) {
      detectedFilePaths.push(...await this.detectEntryPath(baseAnalyzePath, entry))
    }
    return detectedFilePaths
  }

  protected async analyze(): Promise<AnalyzedEntry> {
    for (const entry of this.preAnalyzeEntries) {
      const detectedEntryPaths = await this.detectEntry(entry)
      this.detectedEntries.add({ ...entry, detectedEntryPaths })
    }
    return this.detectedEntries
  }

  private static matchExportsKey(key: string): EntryType {
    return match(key)
      .with('require', () => 'exports-require' as EntryType)
      .with('import', () => 'exports-import' as EntryType)
      .with('default', () => 'exports-default' as EntryType)
      .with('node', () => 'exports-node' as EntryType)
      .with('entry', () => 'exports-entry' as EntryType)
      .with('types', () => 'exports-types' as EntryType)
      .otherwise(() => 'exports-unknown' as EntryType)
  }

  private static addPreAnalyzeEntryFromExports(exports: PackageJson['exports'], entryAnalyzer: EntryAnalyzer, key?: string): void {
    if (typeof exports === 'string') {
      entryAnalyzer.addPreAnalyzeEntry(exports, key ? this.matchExportsKey(key) : 'exports')
    }
    else if (Array.isArray(exports)) {
      for (const exportItem of exports)
        this.addPreAnalyzeEntryFromExports(exportItem, entryAnalyzer)
    }
    else if (typeof exports === 'object') {
      for (const key in exports)
        this.addPreAnalyzeEntryFromExports(exports[key], entryAnalyzer, key)
    }
  }

  static async fromPackageJson({ packageJson = {}, beforeAnalyze }: FromPackageJsonOptions = {}): Promise<AnalyzedEntry> {
    const entryStorage = new EntryAnalyzer()
    if (beforeAnalyze)
      await beforeAnalyze(entryStorage, packageJson)

    const mainField = packageJson.main
    const moduleField = packageJson.module
    const typesField = packageJson.types || packageJson.typings
    const exportsField = packageJson.exports
    const typeField = packageJson.type

    if (!typeField || typeField === 'commonjs')
      entryStorage.setDefaultProjectType('commonjs')
    else entryStorage.setDefaultProjectType('module')

    if (mainField)
      entryStorage.addPreAnalyzeEntry(mainField, 'main')
    if (moduleField)
      entryStorage.addPreAnalyzeEntry(moduleField, 'module')
    if (typesField)
      entryStorage.addPreAnalyzeEntry(typesField, 'types')
    if (exportsField)
      this.addPreAnalyzeEntryFromExports(exportsField, entryStorage)

    return entryStorage.analyze()
  }
}
