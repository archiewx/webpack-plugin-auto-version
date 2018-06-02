import { EOL as endOfLine } from 'os'

export default (instance) => {
  const { inspectContent } = instance
  return (data, cb) => {
    // 监听html-webpack-plugin-after-html-processing事件
    if (inspectContent) {
      const versionTag = `<!-- ${instance.banner} -->`
      data.html = versionTag + endOfLine + data.html
    }
    cb(null, data)
  }
}
