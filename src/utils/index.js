import fs from 'fs'

export default {
  readJsonFile(filePath) {
    const json = fs.readFileSync(filePath)
    return JSON.parse(json)
  },
  injectContent(asset, template, version) {
    if (!this.inspectContent) {
      return
    }
    const source = asset.source()
    asset.source = () => source.replace(template, version)
  },
  injectJs = (asset) => {
    const versionTag = `/**  ${this.banner}*/`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  },
  injectCss = (asset) => {
    const versionTag = `/**  ${this.banner}   */`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  },
  injectHtml = (asset) => {
    const versionTag = `<!--  ${this.banner}   -->`
    const source = versionTag + endOfLine + asset.source()
    asset.source = () => source
  }
}
