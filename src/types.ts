import { ParsedPath } from 'node:path'

export type EntryType =
  | 'main'
  | 'module'
  | 'types'
  | 'exports'
  | 'exports-require'
  | 'exports-import'
  | 'exports-default'
  | 'exports-types'
  | 'exports-node'
  | 'exports-unknown'
  | 'exports-entry'

export type Extension = `.${string}`

export interface IPreAnalyzeEntry extends Readonly<ParsedPath> {
  type: EntryType
  output: string
}

export interface IAnalyzedEntry extends IPreAnalyzeEntry {
  detectedEntryPaths: string[]
}

export interface RollupLikeOutput {
  file?: string
  format?: 'cjs' | 'esm'
  dir?: string
}

export interface RollupLikeResult {
  input: string
  output: RollupLikeOutput
}

export interface RollupLikeResultOptions {
  outputType?: 'file' | 'dir'
  onAdd?: (entryPath: string, output: string) => RollupLikeResult | undefined
}
