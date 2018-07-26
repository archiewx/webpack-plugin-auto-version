import { EOL as endOfLine } from 'os'
/**
 * html内注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
export function injectHtmlBanner(asset, banner) {
  const versionTag = `<!--  ${banner}   -->`
  if (
    asset
      .source()
      .toString()
      .startsWith('<!--')
  ) {
    return
  }
  const source = versionTag + endOfLine + asset.source()
  asset.source = () => source
}
