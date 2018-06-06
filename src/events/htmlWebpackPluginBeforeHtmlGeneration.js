// 生成html 之前进行修改标签
export default (instance) => {
  const { filenameMark } = instance
  return (data, cb) => {
    // 监听html-webpack-plugin-before-html-generation
    const { publicPath, js: jsNames = [], css: cssNames = [] } = data.assets
    const versionPath = publicPath ? `/${instance.newVersion}` : `${instance.newVersion}/`
    data.assets.js = jsNames.map((js) => {
      const filename = `${versionPath}${js}`
      // 判断js 是否已经替换成新版本
      const hasReplace = js.indexOf(instance.newVersion) !== -1
      if (hasReplace) {
        return js
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion)
      }
      return filename
    })
    data.assets.css = cssNames.map((css) => {
      const filename = `${versionPath}${css}`
      // 判断css 是否已经替换成新版本
      const hasReplace = css.indexOf(instance.newVersion) !== -1
      if (hasReplace) {
        return css
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion)
      }
      return filename
    })
    cb(null, data)
  }
}
