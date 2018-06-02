import path from 'path'
import fs from 'fs'
import { EOL as endOfLine } from 'os'
import * as yargs from 'yargs'
import semver from 'semver'
import rimraf from 'rimraf'
import notifier from 'node-notifier'
import webpack from 'webpack'
import globals from './typings/globals'

class WebpackAutoVersionPlugin {
  private filenameMark: string
  private copyright: string
  private pkgPath: string
  private pkg: { version: string }
  private space: number
  private cleanup: boolean
  private inspectContent: boolean
  private template: string
  private banner: string
  private newVersion: string
  private webpackConfig: webpack.Configuration

  constructor(options: globals.OptionType) {
    // 文件名替换标记 [version] -> v1.2.2
    this.filenameMark = options.filenameMark
    // 版权名称
    this.copyright = options.copyright || 'DUOKE-GM'
    // package.json路径
    this.pkgPath = ''
    // package.json内容
    this.pkg = { version: '' }
    this.banner = ''
    // 保存的时候格式化package.json的indent
    this.space = options.space || 2
    // 是否自动清理老版本
    this.cleanup = options.cleanup || false
    // 是否检测资源内的标签
    this.inspectContent = options.inspectContent || !!options.template
    // 自定义资源内版本替换模板 [DUOKE-GM]version[/DUOKE-GM]
    this.template = options.template || `[${this.copyright}]version[/${this.copyright}]`
    this.webpackConfig = { context: '' }
    this.newVersion = ''
  }

  public apply = (complier: webpack.Compiler) => {
    // 使用在HtmlWebpackPlugin插件前，无html资源
    const that = this
    this.webpackConfig = complier.options
    this.init()
    this.autoIncreaseVersion()
    const { version } = this.pkg
    complier.plugin('emit', (compilation: webpack.compilation.Compilation, callback) => {
      let newAssets = {}
      Object.keys(compilation.assets).forEach((filename) => {
        // 得到每一个资源
        const ext = path.extname(filename)
        const asset = compilation.assets[filename]
        that.injectContent(asset)
        const newFilename = that.replaceVersionTag(filename)
        switch (ext) {
          case '.js':
            newAssets = { ...newAssets, [`${version}/${newFilename}`]: asset }
            that.injectJs(asset)
            break
          case '.css':
            newAssets = { ...newAssets, [`${version}/${newFilename}`]: asset }
            that.injectCss(asset)
            break
          case '.html':
            newAssets = { ...newAssets, [newFilename]: asset }
            that.injectHtml(asset)
            break
          default:
            newAssets = { ...newAssets, [`${version}/${newFilename}`]: asset }
            break
        }
      })
      compilation.assets = newAssets
      compilation.chunks.forEach((chunk: webpack.compilation.Chunk) => {
        chunk.files = chunk.files
          .filter((filename: string) => path.extname(filename) !== '.html')
          .map((filename: string) => `${version}/${that.replaceVersionTag(filename)}`)
          .concat(chunk.files.filter((filename: string) => path.extname(filename) === '.html'))
      })
      callback()
    })

    complier.plugin('failed', (err) => {
      notifier.notify({
        title: 'WebpackAutoVersionPlugin',
        message: err.message
      })
    })

    complier.plugin('done', () => {
      // 是否清理旧版本目录
      that.cleanupOldVersion()
      // 编译完成后版本号记录到pkg中
      that.persistVersion()
    })
  }

  private init = () => {
    this.pkgPath = `${this.webpackConfig.context}/package.json`
    this.pkg = this.readJsonFile(this.pkgPath)
    this.newVersion = this.pkg.version
    const { version } = this.pkg
    this.banner = `${this.copyright} version ${version}   ${new Date().toLocaleString()}`
  }
  private readJsonFile = (filePath: string) => {
    const json = fs.readFileSync(filePath).toString()
    return JSON.parse(json)
  }
  private injectContent = (asset: { source: () => string }) => {
    if (!this.inspectContent) {
      return
    }
    const source = asset.source()
    asset.source = () => source.replace(this.template, this.newVersion)
  }
  // 清理以前版本
  private cleanupOldVersion = () => {
    if (!this.cleanup) {
      return
    }
    const outputPath = this.webpackConfig.output && this.webpackConfig.output.path
    if (outputPath) {
      const outputChildDirs = fs.readdirSync(outputPath)
      outputChildDirs
        .filter((subPath: string) => {
          const stats = fs.statSync(`${outputPath}/${subPath}`)
          return stats.isDirectory
        })
        .forEach((subPath: string) => {
          // 合法的semver并且小于当前版本号
          if (semver.valid(subPath) && semver.lt(subPath, this.pkg.version)) {
            rimraf(`${outputPath}/${subPath}`, (err: Error) => {
              notifier.notify({
                title: '清除旧版本出错',
                message: err.message
              })
            })
          }
        })
    }
  }
  private autoIncreaseVersion = () => {
    const { _ } = yargs.argv
    const { version } = this.pkg
    const isMinor = _.indexOf('minor') !== -1
    const isMajor = _.indexOf('major') !== -1
    if (isMinor) {
      this.newVersion = semver.inc(version, 'minor') || version
      this.pkg.version = this.newVersion
      return
    }
    if (isMajor) {
      this.newVersion = semver.inc(version, 'major') || version
      this.pkg.version = this.newVersion
      return
    }
    this.newVersion = semver.inc(version, 'patch') || version
    this.pkg.version = this.newVersion
  }
  private persistVersion = () => {
    const pkgStr = JSON.stringify(this.pkg, null, this.space)
    fs.writeFileSync(this.pkgPath, pkgStr)
  }
  private injectJs = (asset: { source: () => string }) => {
    const versionTag = `/**  ${this.banner}*/`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  private injectCss = (asset: { source: () => string }) => {
    const versionTag = `/**  ${this.banner}   */`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  private injectHtml = (asset: { source: () => string }) => {
    const versionTag = `<!--  ${this.banner}   -->`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  private replaceVersionTag = (filename: string) => {
    if (!this.filenameMark) {
      return filename
    }
    return filename.replace(this.filenameMark, `v${this.pkg.version}`)
  }
}

export default WebpackAutoVersionPlugin
