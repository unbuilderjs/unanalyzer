import type { PackageJson } from 'type-fest'
import path from 'node:path'
import { match } from 'ts-pattern'
import { EntryType, IAnalyzedEntry, RollupLikeResult, RollupLikeResultOptions } from './types'
import { deepUnique } from './utils'

export class AnalyzedEntry extends Set<IAnalyzedEntry> {
  private defaultProjectType: PackageJson['type']

  setDefaultProjectType(projectType: PackageJson['type']) {
    this.defaultProjectType = projectType
  }

  getAllEntryPaths(): Set<string> {
    const entryPaths: string[] = []
    for (const entry of this)
      entryPaths.push(...entry.detectedEntryPaths)
    return new Set(entryPaths)
  }

  getAllEntryPathsWithOutput(): Set<[string, string, EntryType]> {
    const entryPathsWithOutput: [string, string, EntryType][] = []
    for (const entry of this)
      entryPathsWithOutput.push(...entry.detectedEntryPaths.map(path => [path, entry.output, entry.type] as [string, string, EntryType]))
    return new Set(entryPathsWithOutput)
  }

  getAllSingleEntryPathsWithOutput(): Map<string, { output: string, type: EntryType }[]> {
    const entryPathsWithOutput = new Map<string, { output: string, type: EntryType }[]>()
    const entryPaths = this.getAllEntryPathsWithOutput()

    for (const [path, output, entryType] of entryPaths) {
      const outputPaths = entryPathsWithOutput.get(path) || []
      outputPaths.push({ output, type: entryType })
      entryPathsWithOutput.set(path, [...new Set(outputPaths)])
    }

    return entryPathsWithOutput
  }

  async getRollupLikeResult({ onAdd, outputType = 'dir' }: RollupLikeResultOptions = {}): Promise<RollupLikeResult[]> {
    const analyzedEntriesResult = this.getAllSingleEntryPathsWithOutput()
    const results: RollupLikeResult[] = []

    for (const [entryPath, outputs] of analyzedEntriesResult) {
      for (const { output, type } of outputs) {
        if (type === 'exports-entry')
          continue
        const outputExt = path.extname(output)
        if (outputExt === '.ts' && !path.basename(output).endsWith('.d'))
          continue
        const format = match(outputExt)
          .with('.cjs', () => 'cjs' as const)
          .with('.mjs', () => 'esm' as const)
          .with('.js', () => this.defaultProjectType === 'module' ? 'esm' : 'cjs')
          .with('.ts', () => 'esm' as const)
          .otherwise(() => undefined)

        let result: RollupLikeResult = {
          input: entryPath,
          output: {
            dir: outputType === 'dir' ? path.dirname(output) : undefined,
            file: outputType === 'file' ? output : undefined,
            format,
          },
        }
        if (onAdd) {
          const onAddResult = onAdd(entryPath, output)
          if (onAddResult)
            result = onAddResult
        }
        results.push(result)
      }
    }

    return deepUnique(results)
      .map(result => JSON.parse(JSON.stringify(result)))
  }
}
