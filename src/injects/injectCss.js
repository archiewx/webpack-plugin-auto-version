import { EOL as endOfLine } from 'os'
/**
 * css注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
export function injectCssBanner(asset, banner) {
  const versionTag = `/**  ${banner}   */`
  const source = versionTag + endOfLine + asset.source()
  asset.source = () => source
}
