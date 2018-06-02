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
        _data$assets$js = _data$assets.js,
        jsNames = _data$assets$js === undefined ? [] : _data$assets$js,
        _data$assets$css = _data$assets.css,
        cssNames = _data$assets$css === undefined ? [] : _data$assets$css;

    data.assets.js = jsNames.map(function (js) {
      var filename = "/" + instance.newVersion + js;
      var hasReplace = filename.indexOf(instance.newVersion) !== -1;
      if (hasReplace) {
        return js;
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion);
      }
      return "/" + instance.newVersion + js;
    });
    data.assets.css = cssNames.map(function (css) {
      var filename = "/" + instance.newVersion + css;
      var hasReplace = filename.indexOf(instance.newVersion) !== -1;
      if (hasReplace) {
        return css;
      }
      if (filenameMark) {
        return filename.replace(filenameMark, instance.newVersion);
      }
      return filename;
    });
    cb();
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

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var WebpackAutoVersionPlugin = function WebpackAutoVersionPlugin() {
  var _this = this;

  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  classCallCheck(this, WebpackAutoVersionPlugin);

  this.init = function () {
    _this.pkgPath = _this.webpackConfig.context + '/package.json';
    _this.pkg = _this.readJsonFile(_this.pkgPath);
    _this.autoIncreaseVersion();
    _this.banner = _this.copyright + ' version ' + _this.newVersion + '   ' + new Date().toLocaleString();
  };

  this.readJsonFile = function (filePath) {
    var json = fs.readFileSync(filePath);
    return JSON.parse(json);
  };

  this.injectContent = function (asset) {
    if (!_this.inspectContent) {
      return;
    }
    var source = asset.source();
    if (typeof source !== 'string') {
      return;
    }
    asset.source = function () {
      return source.replace(_this.template, _this.newVersion);
    };
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

  this.injectJs = function (asset) {
    var versionTag = '/**  ' + _this.banner + '*/';
    var source = versionTag + os.EOL + asset.source();
    asset.source = function () {
      return source;
    };
  };

  this.injectCss = function (asset) {
    var versionTag = '/**  ' + _this.banner + '   */';
    var source = versionTag + os.EOL + asset.source();
    asset.source = function () {
      return source;
    };
  };

  this.injectHtml = function (asset) {
    var versionTag = '<!--  ' + _this.banner + '   -->';
    var source = versionTag + os.EOL + asset.source();
    asset.source = function () {
      return source;
    };
  };

  this.replaceVersionTag = function (filename) {
    if (!_this.filenameMark) {
      return filename;
    }
    return filename.replace(_this.filenameMark, 'v' + _this.pkg.version);
  };

  this.apply = function (complier) {
    // 使用在HtmlWebpackPlugin插件前，无html资源
    var that = _this;
    _this.webpackConfig = complier.options;
    _this.init();
    var version = _this.pkg.version;

    complier.plugin('emit', function (compilation, callback) {
      var newAssets = {};
      Object.keys(compilation.assets).forEach(function (filename) {
        // 得到每一个资源
        var ext = path.extname(filename);
        var asset = compilation.assets[filename];
        that.injectContent(asset);
        var newFilename = that.replaceVersionTag(filename);
        switch (ext) {
          case '.js':
            newAssets[version + '/' + newFilename] = asset;
            that.injectJs(asset);
            break;
          case '.css':
            newAssets[version + '/' + newFilename] = asset;
            that.injectCss(asset);
            break;
          default:
            if (that.ignoreSuffix.indexOf(ext) !== -1) {
              newAssets[newFilename] = asset;
              that.injectHtml(asset);
              // 替换文件中资源
            } else {
              newAssets[version + '/' + newFilename] = asset;
            }
            break;
        }
      });
      compilation.assets = newAssets;
      compilation.chunks.forEach(function (chunk) {
        chunk.files = chunk.files.filter(function (filename) {
          return path.extname(filename) !== '.html';
        }).map(function (filename) {
          return version + '/' + that.replaceVersionTag(filename);
        }).concat(chunk.files.filter(function (filename) {
          return path.extname(filename) === '.html';
        }));
      });
      callback();
    });

    complier.plugin('failed', function (err) {
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
      console.log('hooks');
      complier.hooks.compilation.tap('WebpackAutoVersionPlugin', function (compliation) {
        compliation.hooks.htmlWebpackPluginBeforeHtmlGeneration.tapAsync('WebpackAutoVersionPlugin', htmlWebpackPluginBeforeHtmlGeneration(_this));
        compliation.hooks.htmlWebpackPluginAfterHtmlProcessing.tapAsync('WebpackAutoVersionPlugin', htmlWebpackPluginAfterHtmlProcessing(_this));
      });
    } else {
      complier.plugin('compilation', function (compliation) {
        compliation.plugin('html-webpack-plugin-before-html-generation', htmlWebpackPluginBeforeHtmlGeneration(_this));
        compliation.plugin('html-webpack-plugin-after-html-processing', htmlWebpackPluginAfterHtmlProcessing(_this));
      });
    }
  };

  // 文件名替换标记 [version] -> v1.2.2
  this.filenameMark = options.filenameMark;
  // 版权名称
  this.copyright = options.copyright || 'VERSION';
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
}
// 清理以前版本
;

module.exports = WebpackAutoVersionPlugin;
