import path from 'path'
import fs from 'fs'
import yargs from 'yargs'
import semver from 'semver'
import rimraf from 'rimraf'
import notifier from 'node-notifier'
import htmlWebpackPluginBeforeHtmlGeneration from './events/htmlWebpackPluginBeforeHtmlGeneration'
import htmlWebpackPluginAfterHtmlProcessing from './events/htmlWebpackPluginAfterHtmlProcessing'
import htmlWebpackPluginAlterAssetTags from './events/htmlWebpackPluginAlterAssetTags'
import { injectCssBanner } from './injects/injectCss'
import { injectHtmlBanner } from './injects/injectHtml'
import { injectJsBanner } from './injects/injectJs'
import { injectVersionByTemp } from './injects/injectContent'

/**
 * @class WebpackAutoVersionPlugin
 */
class WebpackAutoVersionPlugin {
  /**
   *Creates an instance of WebpackAutoVersionPlugin.
   * @param {OptionType} [options={}]
   * @memberof WebpackAutoVersionPlugin
   */
  constructor(options = {}) {
    // 文件名替换标记 [version] -> v1.2.2
    this.filenameMark = options.filenameMark
    // 版权名称
    this.copyright = options.copyright || '[webpack-plugin-auto-version]'
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
    this.isAsyncJs = options.isAsyncJs
    // 哪些模板支持html
    this.htmlTempSuffix = ['.html', '.vm', '.ejs', '.handlbars'].concat(
      options.htmlTempSuffix || []
    )
  }
  /**
   * 初始化
   *
   * @memberof WebpackAutoVersionPlugin
   */
  init = () => {
    this.pkgPath = `${this.webpackConfig.context}/package.json`
    this.pkg = this.readJsonFile(this.pkgPath)
    this.fixPackageFile()
    this.autoIncreaseVersion()
    this.banner = `${this.copyright} ${this.newVersion}   ${new Date().toLocaleString()}`
  }
  /**
   * 文件类是否存在version字段，不存在则创建
   *
   * @memberof WebpackAutoVersionPlugin
   */
  fixPackageFile = () => {
    // 判断version 是否存在
    if (!this.pkg.version) {
      this.pkg.version = '0.0.1'
    }
  }
  /**
   * 读取package.json文件
   * @param {string} filePath
   * @memberof WebpackAutoVersionPlugin
   */
  readJsonFile = (filePath) => {
    const json = fs.readFileSync(filePath)
    return JSON.parse(json)
  }
  /**
   * 清楚旧版本文件夹
   * @memberof WebpackAutoVersionPlugin
   */
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
  /**
   * 版本自动增加
   *
   * @memberof WebpackAutoVersionPlugin
   */
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
  /**
   * 在package.json 写入修改后的版本号
   * @memberof WebpackAutoVersionPlugin
   */
  persistVersion = () => {
    const pkgStr = JSON.stringify(this.pkg, null, this.space)
    fs.writeFileSync(this.pkgPath, pkgStr)
  }
  /**
   * 替换名字中[version]标记
   * @param {string} filename
   * @memberof WebpackAutoVersionPlugin
   */
  replaceVersionTag = (filename) => {
    if (!this.filenameMark) {
      return filename
    }
    return filename.replace(this.filenameMark, `v${this.pkg.version}`)
  }

  resetOptions = (options) => {
    if (this.isAsyncJs) {
      options.output = Object.assign(options.output, { publicPath: `/${this.newVersion}/` })
    }
  }

  /**
   * webpack 暴露加载插件的方法
   * @param {any} complier
   * @memberof WebpackAutoVersionPlugin
   */
  apply = (complier) => {
    this.webpackConfig = complier.options
    // 修改publicPath
    this.init()
    this.resetOptions(complier.options)
    const { version } = this.pkg
    const that = this
    const outputPath = that.webpackConfig.output
    complier.plugin('emit', (compilation, callback) => {
      const newAssets = {}
      Object.keys(compilation.assets).forEach((filename) => {
        // 得到每一个资源
        const ext = path.extname(filename)
        const asset = compilation.assets[filename]
        injectVersionByTemp(asset, that.template, that.newVersion)
        const newFilename = that.replaceVersionTag(filename)
        const existKeyword = that.ignoreSuffix.find((keyword) => filename.indexOf(keyword) !== -1)
        switch (ext) {
          case '.js':
            if (existKeyword) {
              newAssets[newFilename] = asset
            } else {
              newAssets[`${version}/${newFilename}`] = asset
            }
            injectJsBanner(asset, that.banner)
            break
          case '.css':
            if (existKeyword) {
              newAssets[newFilename] = asset
            } else {
              newAssets[`${version}/${newFilename}`] = asset
            }
            injectCssBanner(asset, that.banner)
            break
          default:
            // 忽略的路径或路径中包含输入路径(兼容webpack-copy-plugin)
            if (
              that.ignoreSuffix.concat(that.htmlTempSuffix).indexOf(ext) !== -1 ||
              filename.indexOf(outputPath) !== -1 ||
              existKeyword
            ) {
              // 不需要移动到版本号文件夹内
              newAssets[newFilename] = asset
              // 在html语法模板后缀中则注入执行
              that.htmlTempSuffix.indexOf(ext) !== -1 && injectHtmlBanner(asset, that.banner)
              // 替换文件中资源
            } else {
              newAssets[`${version}/${newFilename}`] = asset
            }
            break
        }
      })
      // console.log('keys', Object.keys(compilation.assets))
      compilation.assets = newAssets
      // 这里替换名称标记，增加了版本
      if (that.filenameMark) {
        compilation.chunks.forEach((chunk) => {
          chunk.files = chunk.files
            .filter((filename) => path.extname(filename) !== '.html')
            .map((filename) => `${version}/${that.replaceVersionTag(filename)}`)
            .concat(chunk.files.filter((filename) => path.extname(filename) === '.html'))
        })
      }
      callback()
    })

    complier.plugin('failed', (err) => {
      console.error('fail')
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
      // 兼容webpack ^4.0.0
      complier.hooks.compilation.tap('WebpackAutoVersionPlugin', (compliation) => {
        compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration &&
          compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync(
            'WebpackAutoVersionPlugin',
            htmlWebpackPluginBeforeHtmlGeneration(this)
          )
        compliation.hooks.htmlWebpackPluginAlterAssetTags &&
          compliation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync(
            'WebpackAutoVersionPlugin',
            htmlWebpackPluginAlterAssetTags(this)
          )
        compliation.hooks.htmlWebpackPluginAfterHtmlProcessing &&
          compliation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync(
            'WebpackAutoVersionPlugin',
            htmlWebpackPluginAfterHtmlProcessing(this)
          )
      })
    } else {
      // 如果存在html-webpack-plugin 则监听
      complier.plugin('compilation', (compilation) => {
        compilation.plugin(
          'html-webpack-plugin-before-html-generation',
          htmlWebpackPluginBeforeHtmlGeneration(this)
        )
        compilation.plugin(
          'html-webpack-plugin-alter-asset-tags',
          htmlWebpackPluginAlterAssetTags(this)
        )
        compilation.plugin(
          'html-webpack-plugin-after-html-processing',
          htmlWebpackPluginAfterHtmlProcessing(this)
        )
      })
    }
  }
}

export default WebpackAutoVersionPlugin
