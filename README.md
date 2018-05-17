# 自动版本管理

以 webpack 插件方式执行 

![](http://ojgquc007.bkt.clouddn.com/dragon-qiniu/1526538819370.jpg)

## feature

* 自动插入 js,css 首行版本标记
* 自动版本目录管理
* 自动清理旧版本目录
* 支持标签配置，动态替换版本
* 支持[version]名称，能够动态替换资源名称中版本标签
* 打包报错，toast 提示
* 支持 -- patch, -- minor, -- major 命令方式打包

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
      copyright: options.copyright || 'CHINA',
      // 保存的时候格式化package.json的indent
      space: options.space || 2,
      // 是否自动清理老版本
      cleanup: options.cleanup || false,
      // 是否检测资源内的标签
      inspectContent: options.inspectContent || !!options.template,
      // 自定义资源内版本替换模板 [DUOKE-GM]version[/DUOKE-GM]
      template: options.template || `[${this.copyright}]version[/${this.copyright}]`,
      newVersion: ''
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
  template: "[VERSION]version[/VERSION]"
}
```

template 会被自动替换成和 package.json 对应的版本号

## next

* 修复和 HtmlWebpackPlugin 兼容问题， 能够在 html 文件生成 banner 注释
