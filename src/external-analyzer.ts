import { PackageJson } from 'type-fest'

export class ExternalAnalyzer {
  private readonly _externalModules: Set<string> = new Set()
  private readonly _noExternalModules: Set<string> = new Set()

  addExternalModule(moduleName: string) {
    this._noExternalModules.delete(moduleName)
    this._externalModules.add(moduleName)
  }

  addNoExternalModule(moduleName: string) {
    this._externalModules.delete(moduleName)
    this._noExternalModules.add(moduleName)
  }

  private constructor() {}

  getExternalModules(): string[] {
    return [...this._externalModules]
  }

  getNoExternalModules(): string[] {
    return [...this._noExternalModules]
  }

  /**
   * Compare the dependencies in the package.json file to ensure that there are no duplicates.
   *
   * @public
   * @static
   * @param {PackageJson} packageJson The package.json file to check.
   * @memberof ExternalAnalyzer
   * @throws {Error} If there are duplicate dependencies.
   */
  public static checkPackageJsonDependencies(packageJson: PackageJson) {
    const dependencies = packageJson.dependencies || {}
    const devDependencies = packageJson.devDependencies || {}
    const peerDependencies = packageJson.peerDependencies || {}
    const optionalDependencies = packageJson.optionalDependencies || {}
    const bundleDependencies = packageJson.bundleDependencies || []
    const bundledDependencies = packageJson.bundledDependencies || []

    // 合并所有依赖名称到一个数组
    const allDependencies = [
      ...Object.keys(dependencies),
      ...Object.keys(devDependencies),
      ...Object.keys(peerDependencies),
      ...Object.keys(optionalDependencies),
      ...bundleDependencies,
      ...bundledDependencies,
    ]

    // 使用一个Set来检测重复
    const seen = new Set<string>()
    const duplicates = new Set<string>()

    for (const dep of allDependencies)
      seen.has(dep) ? duplicates.add(dep) : seen.add(dep)

    // 如果有重复，抛出异常
    if (duplicates.size > 0)
      throw new Error(`Duplicate dependencies found: ${Array.from(duplicates).join(', ')}`)
  }

  public static fromPackageJson(packageJson: PackageJson = {}): ExternalAnalyzer {
    const analyzer = new ExternalAnalyzer()
    this.checkPackageJsonDependencies(packageJson)

    for (const moduleName in packageJson.dependencies || {})
      analyzer.addExternalModule(moduleName)

    for (const moduleName of [
      ...Object.keys(packageJson.devDependencies || {}),
      ...Object.keys(packageJson.peerDependencies || {}),
      ...Object.keys(packageJson.optionalDependencies || {}),
      ...Object.keys(packageJson.bundleDependencies || {}),
      ...Object.keys(packageJson.bundledDependencies || {}),
    ])
      analyzer.addNoExternalModule(moduleName)

    return analyzer
  }
}
