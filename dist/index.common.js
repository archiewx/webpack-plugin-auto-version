'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var os = require('os');
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));
var yargs = _interopDefault(require('yargs'));
var semver = _interopDefault(require('semver'));
var rimraf = _interopDefault(require('rimraf'));
var notifier = _interopDefault(require('node-notifier'));

// 生成html 之前进行修改标签
var htmlWebpackPluginBeforeHtmlGeneration = (function (instance) {
  var filenameMark = instance.filenameMark;

  return function (data, cb) {
    // 监听html-webpack-plugin-before-html-generation
    var _data$assets = data.assets,
        publicPath = _data$assets.publicPath,
        _data$assets$js = _data$assets.js,
        jsNames = _data$assets$js === undefined ? [] : _data$assets$js,
        _data$assets$css = _data$assets.css,
        cssNames = _data$assets$css === undefined ? [] : _data$assets$css;

    var versionPath = publicPath ? "/" + instance.newVersion : instance.newVersion + "/";
    data.assets.js = jsNames.map(function (js) {
      var filename = "" + versionPath + js;
      // 判断js 是否已经替换成新版本
      var hasReplace = js.indexOf(instance.newVersion) !== -1;
      if (hasReplace) {
        return js;
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion);
      }
      return filename;
    });
    data.assets.css = cssNames.map(function (css) {
      var filename = "" + versionPath + css;
      // 判断css 是否已经替换成新版本
      var hasReplace = css.indexOf(instance.newVersion) !== -1;
      if (hasReplace) {
        return css;
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion);
      }
      return filename;
    });
    cb(null, data);
  };
});

var htmlWebpackPluginAfterHtmlProcessing = (function (instance) {
  var inspectContent = instance.inspectContent;

  return function (data, cb) {
    // 监听html-webpack-plugin-after-html-processing事件
    if (inspectContent) {
      var versionTag = '<!-- ' + instance.banner + ' -->';
      data.html = versionTag + os.EOL + data.html;
    }
    cb(null, data);
  };
});

var htmlWebpackPluginAlterAssetTags = (function () {
  return function (data, cb) {
    return cb(null, data);
  };
});

/**
 * css注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
function injectCssBanner(asset, banner) {
  var versionTag = '/**  ' + banner + '   */';
  var source = versionTag + os.EOL + asset.source();
  asset.source = function () {
    return source;
  };
}

/**
 * html内注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
function injectHtmlBanner(asset, banner) {
  var versionTag = '<!--  ' + banner + '   -->';
  if (asset.source().toString().startsWith('<!--')) {
    return;
  }
  var source = versionTag + os.EOL + asset.source();
  asset.source = function () {
    return source;
  };
}

/**
 * js文件内注入内容
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
function injectJsBanner(asset, banner) {
  var versionTag = '/**  ' + banner + ' */';
  var source = versionTag + os.EOL + asset.source();
  asset.source = function () {
    return source;
  };
}

/**
 * 替换代码中[Version]
 * @param {any} asset
 * @memberof WebpackAutoVersionPlugin
 */
function injectVersionByTemp(asset, template, version) {
  var source = asset.source();
  if (typeof source !== 'string') {
    return;
  }
  asset.source = function () {
    return source.replace(template, version);
  };
}

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

/**
 * @class WebpackAutoVersionPlugin
 */

var WebpackAutoVersionPlugin =
/**
 *Creates an instance of WebpackAutoVersionPlugin.
 * @param {OptionType} [options={}]
 * @memberof WebpackAutoVersionPlugin
 */
function WebpackAutoVersionPlugin() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  classCallCheck(this, WebpackAutoVersionPlugin);

  _initialiseProps.call(this);

  // 文件名替换标记 [version] -> v1.2.2
  this.filenameMark = options.filenameMark;
  // 版权名称
  this.copyright = options.copyright || '[webpack-plugin-auto-version]';
  // package.json路径
  this.pkgPath = '';
  // package.json内容
  this.pkg = '';
  // 保存的时候格式化package.json的indent
  this.space = options.space || 2;
  // 是否自动清理老版本
  this.cleanup = options.cleanup || false;
  // 是否检测资源内的标签
  this.inspectContent = options.inspectContent || true;
  // 自定义资源内版本替换模板 [VERSION]version[/VERSION]
  this.template = options.template || '[' + this.copyright + ']version[/' + this.copyright + ']';
  this.ignoreSuffix = options.ignoreSuffix || ['.html'];
  this.isAsyncJs = options.isAsyncJs;
  // 哪些模板支持html
  this.htmlTempSuffix = ['.html', '.vm', '.ejs', '.handlbars'].concat(options.htmlTempSuffix || []);
}
/**
 * 初始化
 *
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 文件类是否存在version字段，不存在则创建
 *
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 读取package.json文件
 * @param {string} filePath
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 清楚旧版本文件夹
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 版本自动增加
 *
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 在package.json 写入修改后的版本号
 * @memberof WebpackAutoVersionPlugin
 */

/**
 * 替换名字中[version]标记
 * @param {string} filename
 * @memberof WebpackAutoVersionPlugin
 */


/**
 * webpack 暴露加载插件的方法
 * @param {any} complier
 * @memberof WebpackAutoVersionPlugin
 */
;

var _initialiseProps = function _initialiseProps() {
  var _this = this;

  this.init = function () {
    _this.pkgPath = _this.webpackConfig.context + '/package.json';
    _this.pkg = _this.readJsonFile(_this.pkgPath);
    _this.fixPackageFile();
    _this.autoIncreaseVersion();
    _this.banner = _this.copyright + ' version ' + _this.newVersion + '   ' + new Date().toLocaleString();
  };

  this.fixPackageFile = function () {
    // 判断version 是否存在
    if (!_this.pkg.version) {
      _this.pkg.version = '0.0.1';
    }
  };

  this.readJsonFile = function (filePath) {
    var json = fs.readFileSync(filePath);
    return JSON.parse(json);
  };

  this.cleanupOldVersion = function () {
    if (!_this.cleanup) {
      return;
    }
    var outputPath = _this.webpackConfig.output.path;
    var outputChildDirs = fs.readdirSync(outputPath);
    outputChildDirs.filter(function (subPath) {
      var stats = fs.statSync(outputPath + '/' + subPath);
      return stats.isDirectory;
    }).forEach(function (subPath) {
      // 合法的semver并且小于当前版本号
      if (semver.valid(subPath) && semver.lt(subPath, _this.pkg.version)) {
        rimraf(outputPath + '/' + subPath, function (err) {
          notifier.notify({
            title: '清除旧版本出错',
            message: err.message
          });
        });
      }
    });
  };

  this.autoIncreaseVersion = function () {
    var _ = yargs.argv._;
    var version = _this.pkg.version;

    var isMinor = _.indexOf('minor') !== -1;
    var isMajor = _.indexOf('major') !== -1;
    if (isMinor) {
      _this.newVersion = semver.inc(version, 'minor');
      _this.pkg.version = _this.newVersion;
      return;
    }
    if (isMajor) {
      _this.newVersion = semver.inc(version, 'major');
      _this.pkg.version = _this.newVersion;
      return;
    }
    _this.newVersion = semver.inc(version, 'patch');
    _this.pkg.version = _this.newVersion;
  };

  this.persistVersion = function () {
    var pkgStr = JSON.stringify(_this.pkg, null, _this.space);
    fs.writeFileSync(_this.pkgPath, pkgStr);
  };

  this.replaceVersionTag = function (filename) {
    if (!_this.filenameMark) {
      return filename;
    }
    return filename.replace(_this.filenameMark, 'v' + _this.pkg.version);
  };

  this.resetOptions = function (options) {
    if (_this.isAsyncJs) {
      options.output = Object.assign(options.output, { publicPath: _this.newVersion + '/' });
    }
  };

  this.apply = function (complier) {
    _this.webpackConfig = complier.options;
    // 修改publicPath
    _this.init();
    _this.resetOptions(complier.options);
    var version = _this.pkg.version;

    var that = _this;
    var outputPath = that.webpackConfig.output;
    complier.plugin('emit', function (compilation, callback) {
      var newAssets = {};
      Object.keys(compilation.assets).forEach(function (filename) {
        // 得到每一个资源
        var ext = path.extname(filename);
        var asset = compilation.assets[filename];
        injectVersionByTemp(asset, that.template, that.newVersion);
        var newFilename = that.replaceVersionTag(filename);
        switch (ext) {
          case '.js':
            newAssets[version + '/' + newFilename] = asset;
            injectJsBanner(asset, that.banner);
            break;
          case '.css':
            newAssets[version + '/' + newFilename] = asset;
            injectCssBanner(asset, that.banner);
            break;
          default:
            // 忽略的路径或路径中包含输入路径(兼容webpack-copy-plugin)
            if (that.ignoreSuffix.indexOf(ext) !== -1 || filename.indexOf(outputPath) !== -1) {
              // 不需要移动到版本号文件夹内
              newAssets[newFilename] = asset;
              // 在html语法模板后缀中则注入执行
              that.htmlTempSuffix.indexOf(ext) !== -1 && injectHtmlBanner(asset, that.banner);
              // 替换文件中资源
            } else {
              newAssets[version + '/' + newFilename] = asset;
            }
            break;
        }
      });
      // console.log('keys', Object.keys(compilation.assets))
      compilation.assets = newAssets;
      // 这里替换名称标记，增加了版本
      compilation.chunks.forEach(function (chunk) {
        chunk.files = chunk.files.filter(function (filename) {
          return path.extname(filename) !== '.html';
        }).map(function (filename) {
          return version + '/' + that.replaceVersionTag(filename);
        }).concat(chunk.files.filter(function (filename) {
          return path.extname(filename) === '.html';
        }));
        // console.log('chunks', chunk.files)
      });
      callback();
    });

    complier.plugin('failed', function (err) {
      console.log('fail');
      notifier.notify({
        title: 'WebpackAutoVersionPlugin',
        message: err.message
      });
    });

    complier.plugin('done', function () {
      // 是否清理旧版本目录
      that.cleanupOldVersion();
      // 编译完成后版本号记录到pkg中
      that.persistVersion();
    });

    if (complier.hooks) {
      // 兼容webpack ^4.0.0
      complier.hooks.compilation.tap('WebpackAutoVersionPlugin', function (compliation) {
        compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration && compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('WebpackAutoVersionPlugin', htmlWebpackPluginBeforeHtmlGeneration(_this));
        compliation.hooks.htmlWebpackPluginAlterAssetTags && compliation.hooks.htmlWebpackPluginAlterAssetTags.tapAsync('WebpackAutoVersionPlugin', htmlWebpackPluginAlterAssetTags(_this));
        compliation.hooks.htmlWebpackPluginAfterHtmlProcessing && compliation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('WebpackAutoVersionPlugin', htmlWebpackPluginAfterHtmlProcessing(_this));
      });
    } else {
      // 如果存在html-webpack-plugin 则监听
      complier.plugin('compilation', function (compilation) {
        compilation.plugin('html-webpack-plugin-before-html-generation', htmlWebpackPluginBeforeHtmlGeneration(_this));
        compilation.plugin('html-webpack-plugin-alter-asset-tags', htmlWebpackPluginAlterAssetTags(_this));
        compilation.plugin('html-webpack-plugin-after-html-processing', htmlWebpackPluginAfterHtmlProcessing(_this));
      });
    }
  };
};

module.exports = WebpackAutoVersionPlugin;
