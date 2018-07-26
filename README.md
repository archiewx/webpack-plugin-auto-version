# 自动版本管理

[![](https://img.shields.io/npm/v/webpack-plugin-auto-version.svg?style=flat-square)](https://www.npmjs.com/package/webpack-plugin-auto-version)
[![](https://img.shields.io/github/commit-activity/y/zsirfs/webpack-plugin-auto-version.svg?style=flat-square)](https://www.npmjs.com/package/webpack-plugin-auto-version)
[![](https://img.shields.io/github/last-commit/zsirfs/webpack-plugin-auto-version/master.svg?style=flat-square)](https://github.com/zsirfs/webpack-plugin-auto-version)
[![](https://img.shields.io/npm/l/webpack-plugin-auto-version.svg?style=flat-square)](https://github.com/zsirfs/webpack-plugin-auto-version)
[![](https://img.shields.io/github/commit-activity/y/zsirfs/webpack-plugin-auto-version.svg?style=flat-square)](https://github.com/zsirfs/webpack-plugin-auto-version)

以 webpack 插件方式执行

![](http://ojgquc007.bkt.clouddn.com/dragon-qiniu/1526538819370.jpg)

## feature

- 自动插入 js,css,html 首行版本标记(完成和 HtmlWebpackPlugin 兼容)
- 自动版本目录管理
- 自动清理旧版本目录
- 支持标签配置，动态替换版本
- 支持[version]名称，能够动态替换资源名称中版本标签，例如[version].[name].xx 会自动替换
  v3.2.2.main.xx
- 打包报错，命令行 toast 提示
- 支持 -- patch, -- minor, -- major 命令方式打包
- 兼容 roadhogv2.0 以上(如果使用动态导入则需要isAsyncJs为true)
- 兼容 webpack4.0

## 使用方法

```js
const WebpackAutoVersionPlugin = require('webpack-auto-version-plugin')
module.exports = {
  //...
  plugins: [
    new WebpackAutoVersionPlugin({
      // 文件名替换标记 [version] -> v1.2.2
      filenameMark: options.filenameMark,
      // 版权名称
      copyright: options.copyright || '[webpack-plugin-auto-version]',
      // 保存的时候格式化package.json的indent
      space: options.space || 2,
      // 是否自动清理老版本
      cleanup: options.cleanup || false,
      // 是否检测资源内的标签
      inspectContent: options.inspectContent || !!options.template,
      // 自定义资源内版本替换模板 [VERSION]version[/VERSION]
      template: options.template || `[${this.copyright}]version[/${this.copyright}]`,
      // 自定义忽略后缀，默认是['.html']忽略html文件打入版本文件夹
      ignoreSuffix: [],
      isAsyncJs: false
    })
  ]
}
```

## semver

版本: 1.0.0

bash 使用方法:

```bash
$ npm run build -- major # 2.0.0
$ npm run build -- minor # 1.1.0
$ npm run build -- patch # 1.0.1
```

## 标签使用方法

options:

```json
{
  "template": "[VERSION]version[/VERSION]"
}
```

## roadhog 用法

roadhog 初始化会在`public`目录下有一个 index.html，该文件默认资源信息都是 link 和 script 都是
index，在 build 的时候，直接复制过去了，so 做法:

### 新建 index.ejs(不能是 index.html,详细见:[#709](https://github.com/sorrycc/roadhog/issues/709))

### 建立 webpack.config.js

```js
const WebpackPluginAutoPlugin = require('webpack-plugin-auto-version')

module.exports = (config) => {
  if (process.env.NODE_ENV === 'production') {
    config.plugins.push(new WebpackPluginAutoPlugin())
  }
  return config
}
```

### 然后版本就可以正确看到啦。

![](http://ojgquc007.bkt.clouddn.com/dragon-qiniu/1528278030906.jpg)

template 会被自动替换成和 package.json 对应的版本号

## next

- 支持 .editconfig 配置文件
- 支持配置 package.json 配置文件，支持多项目
- 支持开发环境
- 支持 webpack 钩子函数
