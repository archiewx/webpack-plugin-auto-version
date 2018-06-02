import path from 'path'
import fs from 'fs'
import { EOL as endOfLine } from 'os'
import yargs from 'yargs'
import semver from 'semver'
import rimraf from 'rimraf'
import notifier from 'node-notifier'
import htmlWebpackPluginBeforeHtmlGeneration from './events/htmlWebpackPluginBeforeHtmlGeneration'
import htmlWebpackPluginAfterHtmlProcessing from './events/htmlWebpackPluginAfterHtmlProcessing'

class WebpackAutoVersionPlugin {
  constructor(options = {}) {
    // 文件名替换标记 [version] -> v1.2.2
    this.filenameMark = options.filenameMark
    // 版权名称
    this.copyright = options.copyright || 'VERSION'
    // package.json路径
    this.pkgPath = ''
    // package.json内容
    this.pkg = ''
    // 保存的时候格式化package.json的indent
    this.space = options.space || 2
    // 是否自动清理老版本
    this.cleanup = options.cleanup || false
    // 是否检测资源内的标签
    this.inspectContent = options.inspectContent || true
    // 自定义资源内版本替换模板 [VERSION]version[/VERSION]
    this.template = options.template || `[${this.copyright}]version[/${this.copyright}]`
    this.ignoreSuffix = options.ignoreSuffix || ['.html']
  }
  init = () => {
    this.pkgPath = `${this.webpackConfig.context}/package.json`
    this.pkg = this.readJsonFile(this.pkgPath)
    this.autoIncreaseVersion()
    this.banner = `${this.copyright} version ${this.newVersion}   ${new Date().toLocaleString()}`
  }
  readJsonFile = (filePath) => {
    const json = fs.readFileSync(filePath)
    return JSON.parse(json)
  }
  injectContent = (asset) => {
    if (!this.inspectContent) {
      return
    }
    const source = asset.source()
    if (typeof source !== 'string') {
      return
    }
    asset.source = () => source.replace(this.template, this.newVersion)
  }
  // 清理以前版本
  cleanupOldVersion = () => {
    if (!this.cleanup) {
      return
    }
    const outputPath = this.webpackConfig.output.path
    const outputChildDirs = fs.readdirSync(outputPath)
    outputChildDirs
      .filter((subPath) => {
        const stats = fs.statSync(`${outputPath}/${subPath}`)
        return stats.isDirectory
      })
      .forEach((subPath) => {
        // 合法的semver并且小于当前版本号
        if (semver.valid(subPath) && semver.lt(subPath, this.pkg.version)) {
          rimraf(`${outputPath}/${subPath}`, (err) => {
            notifier.notify({
              title: '清除旧版本出错',
              message: err.message
            })
          })
        }
      })
  }
  autoIncreaseVersion = () => {
    const { _ } = yargs.argv
    const { version } = this.pkg
    const isMinor = _.indexOf('minor') !== -1
    const isMajor = _.indexOf('major') !== -1
    if (isMinor) {
      this.newVersion = semver.inc(version, 'minor')
      this.pkg.version = this.newVersion
      return
    }
    if (isMajor) {
      this.newVersion = semver.inc(version, 'major')
      this.pkg.version = this.newVersion
      return
    }
    this.newVersion = semver.inc(version, 'patch')
    this.pkg.version = this.newVersion
  }
  persistVersion = () => {
    const pkgStr = JSON.stringify(this.pkg, null, this.space)
    fs.writeFileSync(this.pkgPath, pkgStr)
  }
  injectJs = (asset) => {
    const versionTag = `/**  ${this.banner}*/`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  injectCss = (asset) => {
    const versionTag = `/**  ${this.banner}   */`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  injectHtml = (asset) => {
    const versionTag = `<!--  ${this.banner}   -->`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
  replaceVersionTag = (filename) => {
    if (!this.filenameMark) {
      return filename
    }
    return filename.replace(this.filenameMark, `v${this.pkg.version}`)
  }

  apply = (complier) => {
    // 使用在HtmlWebpackPlugin插件前，无html资源
    const that = this
    this.webpackConfig = complier.options
    this.init()
    const { version } = this.pkg
    complier.plugin('emit', (compilation, callback) => {
      const newAssets = {}
      Object.keys(compilation.assets).forEach((filename) => {
        // 得到每一个资源
        const ext = path.extname(filename)
        const asset = compilation.assets[filename]
        that.injectContent(asset)
        const newFilename = that.replaceVersionTag(filename)
        switch (ext) {
          case '.js':
            newAssets[`${version}/${newFilename}`] = asset
            that.injectJs(asset)
            break
          case '.css':
            newAssets[`${version}/${newFilename}`] = asset
            that.injectCss(asset)
            break
          default:
            if (that.ignoreSuffix.indexOf(ext) !== -1) {
              newAssets[newFilename] = asset
              that.injectHtml(asset)
              // 替换文件中资源
            } else {
              newAssets[`${version}/${newFilename}`] = asset
            }
            break
        }
      })
      compilation.assets = newAssets
      compilation.chunks.forEach((chunk) => {
        chunk.files = chunk.files
          .filter((filename) => path.extname(filename) !== '.html')
          .map((filename) => `${version}/${that.replaceVersionTag(filename)}`)
          .concat(chunk.files.filter((filename) => path.extname(filename) === '.html'))
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

    if (complier.hooks) {
      console.log('hooks')
      complier.hooks.compilation.tap('WebpackAutoVersionPlugin', (compliation) => {
        compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
          'WebpackAutoVersionPlugin',
          htmlWebpackPluginBeforeHtmlGeneration(this)
        )
        compliation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
          'WebpackAutoVersionPlugin',
          htmlWebpackPluginAfterHtmlProcessing(this)
        )
      })
    } else {
      complier.plugin('compilation', (compliation) => {
        compliation.plugin(
          'html-webpack-plugin-before-html-generation',
          htmlWebpackPluginBeforeHtmlGeneration(this)
        )
        compliation.plugin(
          'html-webpack-plugin-after-html-processing',
          htmlWebpackPluginAfterHtmlProcessing(this)
        )
      })
    }
  }
}

export default WebpackAutoVersionPlugin
