"use strict";function _interopDefault(e){return e&&"object"==typeof e&&"default"in e?e.default:e}var os=require("os"),path=_interopDefault(require("path")),fs=_interopDefault(require("fs")),yargs=_interopDefault(require("yargs")),semver=_interopDefault(require("semver")),rimraf=_interopDefault(require("rimraf")),notifier=_interopDefault(require("node-notifier")),htmlWebpackPluginBeforeHtmlGeneration=function(e){var n=e.filenameMark;return function(t,i){var r=t.assets,s=r.publicPath,o=r.js,a=void 0===o?[]:o,c=r.css,l=void 0===c?[]:c,u=s?"/"+e.newVersion:e.newVersion+"/";t.assets.js=a.map(function(t){var i=""+u+t;return-1!==t.indexOf(e.newVersion)?t:n?i.replace(n,e.newVersion):i}),t.assets.css=l.map(function(t){var i=""+u+t;return-1!==t.indexOf(e.newVersion)?t:n?i.replace(n,e.newVersion):i}),i(null,t)}},htmlWebpackPluginAfterHtmlProcessing=function(e){var n=e.inspectContent;return function(t,i){if(n){var r="\x3c!-- "+e.banner+" --\x3e";t.html=r+os.EOL+t.html}i(null,t)}},htmlWebpackPluginAlterAssetTags=function(){return function(e,n){return n(null,e)}},classCallCheck=function(e,n){if(!(e instanceof n))throw new TypeError("Cannot call a class as a function")},WebpackAutoVersionPlugin=function e(){var n=this,t=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};classCallCheck(this,e),this.init=function(){n.pkgPath=n.webpackConfig.context+"/package.json",n.pkg=n.readJsonFile(n.pkgPath),n.fixPackageFile(),n.autoIncreaseVersion(),n.banner=n.copyright+" version "+n.newVersion+"   "+(new Date).toLocaleString()},this.fixPackageFile=function(){n.pkg.version||(n.pkg.version="0.0.1")},this.readJsonFile=function(e){var n=fs.readFileSync(e);return JSON.parse(n)},this.injectContent=function(e){if(n.inspectContent){var t=e.source();"string"==typeof t&&(e.source=function(){return t.replace(n.template,n.newVersion)})}},this.cleanupOldVersion=function(){if(n.cleanup){var e=n.webpackConfig.output.path;fs.readdirSync(e).filter(function(n){return fs.statSync(e+"/"+n).isDirectory}).forEach(function(t){semver.valid(t)&&semver.lt(t,n.pkg.version)&&rimraf(e+"/"+t,function(e){notifier.notify({title:"清除旧版本出错",message:e.message})})})}},this.autoIncreaseVersion=function(){var e=yargs.argv._,t=n.pkg.version,i=-1!==e.indexOf("minor"),r=-1!==e.indexOf("major");return i?(n.newVersion=semver.inc(t,"minor"),void(n.pkg.version=n.newVersion)):r?(n.newVersion=semver.inc(t,"major"),void(n.pkg.version=n.newVersion)):(n.newVersion=semver.inc(t,"patch"),void(n.pkg.version=n.newVersion))},this.persistVersion=function(){var e=JSON.stringify(n.pkg,null,n.space);fs.writeFileSync(n.pkgPath,e)},this.injectJs=function(e){var t="/**  "+n.banner+"*/"+os.EOL+e.source();e.source=function(){return t}},this.injectCss=function(e){var t="/**  "+n.banner+"   */"+os.EOL+e.source();e.source=function(){return t}},this.injectHtml=function(e){var t="\x3c!--  "+n.banner+"   --\x3e";if(!e.source().toString().startsWith("\x3c!--")){var i=t+os.EOL+e.source();e.source=function(){return i}}},this.replaceVersionTag=function(e){return n.filenameMark?e.replace(n.filenameMark,"v"+n.pkg.version):e},this.apply=function(e){var t=n;n.webpackConfig=e.options,n.init();var i=n.pkg.version;e.plugin("emit",function(e,n){var r={};Object.keys(e.assets).forEach(function(n){var s=path.extname(n),o=e.assets[n];t.injectContent(o);var a=t.replaceVersionTag(n);switch(s){case".js":r[i+"/"+a]=o,t.injectJs(o);break;case".css":r[i+"/"+a]=o,t.injectCss(o);break;default:-1!==t.ignoreSuffix.indexOf(s)?(r[a]=o,t.injectHtml(o)):r[i+"/"+a]=o}}),e.assets=r,e.chunks.forEach(function(e){e.files=e.files.filter(function(e){return".html"!==path.extname(e)}).map(function(e){return i+"/"+t.replaceVersionTag(e)}).concat(e.files.filter(function(e){return".html"===path.extname(e)}))}),n()}),e.plugin("failed",function(e){console.log("fail"),notifier.notify({title:"WebpackAutoVersionPlugin",message:e.message})}),e.plugin("done",function(){t.cleanupOldVersion(),t.persistVersion()}),e.hooks?e.hooks.compilation.tap("WebpackAutoVersionPlugin",function(e){e.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync("WebpackAutoVersionPlugin",htmlWebpackPluginBeforeHtmlGeneration(n)),e.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync("WebpackAutoVersionPlugin",htmlWebpackPluginAfterHtmlProcessing(n)),e.hooks.htmlWebpackPluginAlterAssetTags.tapAsync("WebpackAutoVersionPlugin",htmlWebpackPluginAlterAssetTags(n))}):e.plugin("compilation",function(e){e.plugin("html-webpack-plugin-before-html-generation",htmlWebpackPluginBeforeHtmlGeneration(n)),e.plugin("html-webpack-plugin-alter-asset-tags",htmlWebpackPluginAlterAssetTags(n)),e.plugin("html-webpack-plugin-after-html-processing",htmlWebpackPluginAfterHtmlProcessing(n))})},this.filenameMark=t.filenameMark,this.copyright=t.copyright||"VERSION",this.pkgPath="",this.pkg="",this.space=t.space||2,this.cleanup=t.cleanup||!1,this.inspectContent=t.inspectContent||!0,this.template=t.template||"["+this.copyright+"]version[/"+this.copyright+"]",this.ignoreSuffix=t.ignoreSuffix||[".html"]};module.exports=WebpackAutoVersionPlugin;
