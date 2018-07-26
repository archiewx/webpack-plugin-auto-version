/// <reference types="webpack" />

import * as webpack from 'webpack'

declare interface OptionType {
  filenameMark: string
  copyright: string
  space?: number
  cleanup?: boolean
  inspectContent?: boolean
  template?: string
  isAsyncJs: boolean
}

declare class WebpackAutoVersionPlugin {
  filenameMark: string
  copyright: string
  pkgPath: string
  pkg: { version: string }
  space: number
  cleanup: boolean
  inspectContent: boolean
  template: string
  banner: string
  newVersion: string
  webpackConfig: webpack.Configuration
  isAsyncJs: boolean

  private constructor(options: OptionType)

  private init(): void

  private readJsonFile(filePath: string): any

  private injectContent(asset: webpack.compilation.Asset): void

  private cleanupOldVersion(): void

  private autoIncreaseVersion(): void

  private persistVersion(): void

  public apply(complier: webpack.Compiler): void
}

