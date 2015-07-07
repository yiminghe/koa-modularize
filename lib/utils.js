var util = require('modulex-util');
var matchRequire = require('match-require');
var resolve = require('browser-resolve');
var path = require('path');
var cwd = process.cwd();
var pkg = require(path.join(cwd, 'package.json'));

function startsWithPackageName(str) {
  return !matchRequire.isRelativeModule(str) && !util.startsWith(str, '/') && !util.startsWith(str, 'http:') && !util.startsWith(str, 'https:');
}

function getRequireCall(name, quote) {
  return 'require(' + quote + name + quote + ')';
}

function completeRequire(file, content, option) {
  var externals = option.externals || {};
  var modules = option.modules || {};
  var prefix = option.prefix || '';
  return matchRequire.replaceAll(content, function (match, quote, dep) {
    if (matchRequire.isRelativeModule(dep)) {
      if (path.resolve(path.join(path.dirname(file), dep)) === path.resolve(cwd)) {
        dep = '/';
      }
    }

    if (dep === '/') {
      dep = pkg.name;
    }

    if (startsWithPackageName(dep)) {
      if (externals[dep]) {
        return externals[dep];
      }
      var depInfo = matchRequire.splitPackageName(dep);
      if (depInfo.packageName === pkg.name) {
        dep = path.relative(path.dirname(file), path.join(cwd, depInfo.suffix || 'index.js'));
        if (!matchRequire.isRelativeModule(dep)) {
          dep = './' + dep;
        }
      }
    }

    if (dep.charAt(0) === '/') {
      dep = path.relative(path.dirname(file), path.join(cwd, dep.slice(0)));
      if (!matchRequire.isRelativeModule(dep)) {
        dep = './' + dep;
      }
    }

    var fullPath;
    try {
      fullPath = resolve.sync(dep, {
        filename: file,
        modules: modules
      });
    } catch (e) {
      var extname = path.extname(dep);
      if (extname === '.css') {
        dep = dep.replace(/\.css$/, '.less');
        fullPath = resolve.sync(dep, {
          filename: file,
          modules: modules
        }).replace(/\.less/i, '.css');
      } else if (extname !== '.js') {
        dep += '.jsx';
        fullPath = resolve.sync(dep, {
          filename: file,
          modules: modules
        }).replace(/\.jsx$/i, '');
      } else {
        throw e;
      }
    }
    //console.log(dep + ' from ' + file + ' : ' + fullPath);
    return getRequireCall(path.join(prefix + '/', path.relative(cwd, fullPath)), quote);
  });
}

module.exports = {
  completeRequire: completeRequire
};
