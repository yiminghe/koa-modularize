/**
 * koa middleware for transforming commonjs file into browser module format and imported css path to absolute path
 * @author yiminghe@gmail.com
 */

var path = require('path');
var fs = require('fs');
var util = require('modulex-util');
var cwd = process.cwd();
var cwdLength = cwd.length;
// browser:{'xx.js':'yy.js'}
var browserMap = {};
var processedBrowserPackage = {};

function startsWithPackageName(str) {
  return !util.startsWith(str, '.') && !util.startsWith(str, '/') && !util.startsWith(str, 'http:') && !util.startsWith(str, 'https:');
}

function getPackageName(moduleName) {
  var index = moduleName.indexOf('/');
  if (index !== -1) {
    return {
      packageName: moduleName.slice(0, index),
      suffix: moduleName.slice(index)
    };
  } else {
    return moduleName;
  }
}

function findPackagePath(file, name, suffix) {
  var dir = path.resolve(path.dirname(file));
  do {
    var packageDir = path.join(dir, 'node_modules/' + name);
    if (fs.existsSync(packageDir)) {
      var packagePath = packageDir.slice(cwdLength);
      var packageInfo = require(path.join(packageDir, 'package.json'));
      if (!processedBrowserPackage[packagePath]) {
        if (typeof packageInfo.browser === 'object') {
          var browser = packageInfo.browser;
          for (var b in browser) {
            var fb = path.join(packagePath, b);
            var fv = path.join(packagePath, browser[b]);
            browserMap[fb] = fv;
          }
        }
        processedBrowserPackage[packagePath] = 1;
      }
      // require('xx')
      if (!suffix) {
        var main;
        if (typeof packageInfo.browser === 'string') {
          main = packageInfo.browser
        }
        main = main || packageInfo.main || 'index';
        if (util.startsWith(main, './')) {
          main = main.slice(2);
        }
        suffix = '/' + main;
      }
      // require('xx/zz')
      var ret = packagePath + suffix;
      if (!path.extname(ret)) {
        ret = ret + '.js';
      }
      return browserMap[ret] || ret;
    }
  } while (dir !== cwd && (dir = path.resolve(dir, '../')));
  console.warn('[koa-modularize]: Can not find package in file ' + file + ': ' + name + ', please npm install ' + name + '!');
  return name;
}

var commentRegExp = /(\/\*([\s\S]*?)\*\/|([^:]|^)\/\/(.*)$)/mg;
var requireRegExp = /[^.]\s*require\s*\((['"])([^)]+)\1\)/g;
var commentCssRegExp = /\/\*([\s\S]*?)\*\//mg;
var importRegExp = /@import\s*(['"])([^"']+)\1/g;

function completeRequire(file, content) {
  // Remove comments from the callback string,
  // look for require calls, and pull them into the dependencies,
  // but only if there are function args.
  var originalContent = content;
  var uuid = require('node-uuid').v4();
  var tag = ' __koa_modularize_' + uuid + '__';
  var tagReg = new RegExp(tag + '\\d+ ', 'g');
  var idReg = new RegExp(tag + '(\\d+) ');
  var id = 0;
  var comments = [];

  // hide comments
  content = content.replace(commentRegExp, function (match) {
    comments.push(match);
    return tag + (id++) + ' ';
  });

  // modify package path
  content = content.replace(requireRegExp, function (match, quote, dep) {
    var leading = match.match(/^[^.]\s*require\s*\(/)[0];
    if (startsWithPackageName(dep)) {
      var packageName = getPackageName(dep);
      var suffix = '';
      if (packageName !== dep) {
        suffix = packageName.suffix;
        packageName = packageName.packageName;
      }
      return leading + quote + findPackagePath(file, packageName, suffix) + quote + ')';
    } else if (util.startsWith(dep, '.')) {
      var fullPath = path.join(path.dirname(file), dep).slice(cwdLength);
      if (!path.extname(fullPath)) {
        fullPath += '.js';
      }
      if (browserMap[fullPath]) {
        return leading + quote + (browserMap[fullPath]) + quote + ')';
      }
      return match;
    } else {
      return match;
    }
  });

  // restore comments
  content = content.replace(tagReg, function (m) {
    var id = parseInt(m.match(idReg)[1]);
    return comments[id];
  });

  return content;
}

function completeCssImport(file, content) {
  // Remove comments from the callback string,
  // look for require calls, and pull them into the dependencies,
  // but only if there are function args.
  var originalContent = content;
  var uuid = require('node-uuid').v4();
  var tag = ' __koa_modularize_' + uuid + '__';
  var tagReg = new RegExp(tag + '\\d+ ', 'g');
  var idReg = new RegExp(tag + '(\\d+) ');
  var id = 0;
  var comments = [];

  // hide comments
  content = content.replace(commentCssRegExp, function (match) {
    comments.push(match);
    return tag + (id++) + ' ';
  });

  // modify package path
  content = content.replace(importRegExp, function (match, quote, dep) {
    if (startsWithPackageName(dep)) {
      var packageName = getPackageName(dep);
      var suffix = '';
      if (packageName !== dep) {
        suffix = packageName.suffix;
        packageName = packageName.packageName;
      }
      return '@import ' + quote + findPackagePath(file, packageName, suffix) + quote;
    } else {
      return match;
    }
  });

  // restore comments
  content = content.replace(tagReg, function (m) {
    var id = parseInt(m.match(idReg)[1]);
    return comments[id];
  });

  return content;
}

module.exports = function (dir, option) {
  dir = dir || process.cwd();
  option = option || {};
  return function* (next) {
    var fileType = (this.url.match(/\.(js|css)$/) || [])[1];
    var file, content;
    if (fileType == 'js') {
      file = path.join(dir, this.url);
      content = this.body;
      if (!content) {
        var json = 0;
        if (!fs.existsSync(file)) {
          if (util.endsWith(file, '.json.js')) {
            file = file.slice(0, -3);
            json = 1;
          }
        }
        if (!fs.existsSync(file)) {
          return yield *next;
        }
        content = fs.readFileSync(file, 'utf-8');
        if (json) {
          content = 'module.exports = ' + content + ';';
        }
      }
      if (!option.nowrap || !option.nowrap.call(this)) {
        content = completeRequire(file, content);
        content = 'define(function (require, exports, module) {' + content + '\n});';
      }
      this.set('Content-Type', 'application/javascript;charset=utf-8');
      this.set('Content-Length', Buffer.byteLength(content));
      this.body = content;
      if (option.next && option.next.call(this)) {
        yield * next;
      }
    } else if (fileType === 'css') {
      file = path.join(dir, this.url);
      content = this.body;
      if (!content) {
        if (!fs.existsSync(file)) {
          return yield *next;
        }
        content = fs.readFileSync(file, 'utf-8');
      }
      content = completeCssImport(file, content);
      this.set('Content-Type', 'text/css;charset=utf-8');
      this.set('Content-Length', Buffer.byteLength(content));
      this.body = content;
      if (option.next && option.next.call(this)) {
        yield * next;
      }
    } else {
      yield *next;
    }
  };
};
