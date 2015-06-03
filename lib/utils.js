var cwd = process.cwd();
var path = require('path');
var fs = require('fs');
var cwdLength = cwd.length;
var packageBrowserMap = {};
var util = require('modulex-util');
var commentUtil = require('./comment-util');
var debug = require('debug')('koa-modularize');
var cacheFileBrowserMap = {};
var cacheFilePackageInfos = {};

function startsWithPackageName(str) {
  return !util.startsWith(str, '.') && !util.startsWith(str, '/') && !util.startsWith(str, 'http:') && !util.startsWith(str, 'https:');
}

function splitPackageName(moduleName) {
  var index = moduleName.indexOf('/');
  if (index !== -1) {
    // support domain package
    // require('@ali/matrix')
    if (moduleName.charAt(0) === '@') {
      index = moduleName.indexOf('/', index + 1);
    }
  }
  if (index !== -1) {
    return {
      packageName: moduleName.slice(0, index),
      suffix: moduleName.slice(index)
    };
  } else {
    return {
      packageName: moduleName,
      suffix: ''
    };
  }
}

// require('./lib') lib is directory => require('./lib/index.js');
// /x/object.assign
function considerDirectory(url) {
  var filePath = url;
  if (!path.extname(filePath)) {
    filePath = filePath + '.js';
    if (!fs.existsSync(path.join(cwd, filePath))) {
      // jsx...
      filePath += 'x';
    }
  }
  if (!fs.existsSync(path.join(cwd, filePath))) {
    if (fs.existsSync(path.join(cwd, url)) && fs.statSync(path.join(cwd, url)).isDirectory()) {
      filePath = path.join(url, 'index.js');
    }
  }
  return filePath.replace(/\.jsx$/, '.js');
}

// get current file's package's browserMap
function getBrowserMap(file) {
  if (cacheFileBrowserMap[file]) {
    return cacheFileBrowserMap[file];
  }
  var browserMap;
  var packageInfoPath = getPackageInfoAndPath(file);
  var packageInfo = packageInfoPath.info;
  var packagePath = packageInfoPath.path;
  if (!(browserMap = packageBrowserMap[packagePath])) {
    browserMap = {};
    if (typeof packageInfo.browser === 'object') {
      var browser = packageInfo.browser;
      for (var b in browser) {
        var fb = path.join(packagePath, b);
        // {'index':'./lib/client'}  index.js exists
        // {'emitter':'emitter-debug'} emitter is a package
        if (!fs.existsSync(fb) && startsWithPackageName(b)) {
          fb = b;
        }
        var fv = browser[b];
        var browserValue = fv;
        // when {x: false}
        if (typeof browserValue === 'string') {
          fv = path.join(packagePath, browserValue);
          if (!fs.existsSync(fv) && startsWithPackageName(browserValue)) {
            fv = browserValue;
          }
        }
        browserMap[fb] = fv;
      }
    }
    packageBrowserMap[packagePath] = browserMap;
  }
  cacheFileBrowserMap[file] = browserMap;
  return browserMap;
}

// get current file's package's browserMap
function getPackageInfoAndPath(file) {
  if (cacheFilePackageInfos[file]) {
    return cacheFilePackageInfos[file];
  }
  var dir = path.resolve(path.dirname(file));
  var packageInfo = {};
  do {
    var packageFile = path.join(dir, 'package.json');
    // find current package's package.json
    if (fs.existsSync(packageFile)) {
      packageInfo = require(packageFile);
      break;
    }
  } while (dir !== cwd && (dir = path.resolve(dir, '../')));
  cacheFilePackageInfos[file] = {info: packageInfo, path: dir.slice(cwdLength)};
  return cacheFilePackageInfos[file];
}

function findPackagePath(file, packageName, suffix) {
  var dir = path.resolve(path.dirname(file));
  do {
    var packageFile = path.join(dir, 'node_modules', packageName, 'package.json');
    if (fs.existsSync(packageFile)) {
      var packageInfo = require(packageFile);
      var packagePath = path.dirname(packageFile).slice(cwdLength);
      // required package's browser map
      var browserMap = getBrowserMap(packageFile);
      // require('xx')
      if (!suffix) {
        var main;
        if (typeof packageInfo.browser === 'string') {
          main = packageInfo.browser;
        }
        main = main || packageInfo.main || 'index';
        if (util.startsWith(main, './')) {
          main = main.slice(2);
        }
        suffix = '/' + main;
      }
      // require('xx/zz')
      var ret = considerDirectory(packagePath + suffix);
      // transform for require package's module
      if (ret in browserMap) {
        ret = browserMap[ret];
      }
      return ret;
    }
  } while (dir !== cwd && (dir = path.resolve(dir, '../')));
  debug('Can not find package in file ' + file + ': ' + packageName + ', please npm install ' + packageName + '!');
  return packageName;
}

function getFullPathFromTopModuleName(file, name, option) {
  // current package's browser map
  var browserMap = getBrowserMap(file);
  var packageInfo = getPackageInfoAndPath(file).info;
  // if has map
  if (name in browserMap) {
    name = browserMap[name];
    if (typeof name !== 'string') {
      return name;
    }
  }
  var nameSplits = splitPackageName(name);
  var suffix = nameSplits.suffix;
  var packageName = nameSplits.packageName;
  if (packageName in browserMap) {
    packageName = browserMap[packageName];
    if (typeof packageName !== 'string') {
      return packageName;
    }
  }
  var packagePath;
  if (option.packageHook) {
    packagePath = option.packageHook(file, packageName, suffix);
  }
  if (!packagePath) {
    // shortcut: file does not depend
    if (!hasDep(packageInfo, packageName)) {
      debug('Can not find `' + packageName + '` in ' + file + ' package.json (dev)dependencies: ');
      return name;
    }
    // find path from node_modules
    packagePath = findPackagePath(file, packageName, suffix);
  }
  return packagePath;
}

var requireRegExp = /(?:[^.]|^)\s*require\s*\((['"])([^)]+)\1\)/g;

function completeRequire(file, content, option) {
  var contentComment = commentUtil.stashJsComments(content);
  var browserMap = getBrowserMap(file);
  var prefix = option.prefix;
  var externals = option.externals || {};
  // modify package path
  content = contentComment.content.replace(requireRegExp, function (match, quote, dep) {
    var finalPrefix = prefix;
    var leading = match.match(/^.?\s*require\s*\(/)[0];
    // top level module
    // require('xx/yy')
    if (startsWithPackageName(dep)) {
      if (externals[dep]) {
        var operatorIndex = leading.indexOf('require');
        var operator = '';
        if (operatorIndex !== -1) {
          operator = leading.slice(0, operatorIndex);
        }
        return operator + externals[dep];
      }
      var packagePath = getFullPathFromTopModuleName(file, dep, option);
      if (typeof packagePath === 'string') {
        if (packagePath.charAt(0) !== '/') {
          finalPrefix = '';
        }
        return leading + quote + finalPrefix + packagePath + quote + ')';
      } else {
        return packagePath;
      }
    } else if (util.startsWith(dep, '.')) {
      // relative local module
      // require('./lib/xx')
      var fullPath = considerDirectory(path.join(path.dirname(file), dep).slice(cwdLength));
      // if current package has browser map
      if (fullPath in browserMap) {
        fullPath = browserMap[fullPath];
      }
      // in case {'xx':false} ignore specified package
      if (typeof fullPath === 'string') {
        if (fullPath.charAt(0) !== '/') {
          finalPrefix = '';
        }
        fullPath = leading + quote + finalPrefix + fullPath + quote + ')';
      }
      return fullPath;
    } else {
      return match;
    }
  });

  return commentUtil.restoreComments(content, contentComment.comments);
}

function hasDep(packageInfo, packageName) {
  return (packageInfo.dependencies || {})[packageName] ||
    (packageInfo.devDependencies || {})[packageName] ||
    (packageInfo.peerDependencies || {})[packageName];
}

module.exports = {
  hasDep: hasDep,
  completeRequire: completeRequire
};