import { EOL as endOfLine } from 'os'

/**
 * js文件内注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
export function injectJsBanner(asset, banner) {
  const versionTag = `/**  ${banner} */`
  const source = versionTag + endOfLine + asset.source()
  asset.source = () => source
}
