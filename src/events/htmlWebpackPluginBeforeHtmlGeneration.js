// 生成html 之前进行修改标签
export default (instance) => {
  const { filenameMark } = instance
  return (data, cb) => {
    // 监听html-webpack-plugin-before-html-generation
    const { js: jsNames = [], css: cssNames = [] } = data.assets
    data.assets.js = jsNames.map((js) => {
      const filename = `/${instance.newVersion}${js}`
      const hasReplace = filename.indexOf(instance.newVersion) !== -1
      if (hasReplace) {
        return js
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion)
      }
      return `/${instance.newVersion}${js}`
    })
    data.assets.css = cssNames.map((css) => {
      const filename = `/${instance.newVersion}${css}`
      const hasReplace = filename.indexOf(instance.newVersion) !== -1
      if (hasReplace) {
        return css
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion)
      }
      return filename
    })
    cb()
  }
}
