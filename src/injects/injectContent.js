/**
 * 替换代码中[Version]
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
export function injectVersionByTemp(asset, template, version) {
  const source = asset.source()
  if (typeof source !== 'string') {
    return
  }
  asset.source = () => source.replace(template, version)
}
