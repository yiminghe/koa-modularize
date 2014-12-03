var path = require('path');
var fs = require('fs');
var util = require('modulex-util');
var cwd = process.cwd();

function findPackageVersion(dir, name) {
    while (dir !== cwd) {
        var packageDir = path.resolve(dir, 'node_modules/' + name);
        if (fs.existsSync(packageDir)) {
            return require(path.resolve(packageDir, 'package.json')).version;
        }
        dir = path.resolve(dir, '../');
    }
    console.warn('can not find package: ' + name);
}

var requireRegExp = /[^.'"]\s*require\s*\((['"])([^)]+)\1\)/g;
function addVersionToRequire(dir, content) {
    var requires = [];
    // Remove comments from the callback string,
    // look for require calls, and pull them into the dependencies,
    // but only if there are function args.
    return content.replace(requireRegExp, function (match, quote, dep) {
        var leading = match.charAt(0) + 'require(';
        if (dep.charAt(0) !== '.') {
            return leading + quote + dep + '/' + findPackageVersion(dir, dep) + quote + ')';
        } else {
            return match;
        }
    });
}

module.exports = function (dir, option) {
    dir = dir || process.cwd();
    option = option || {};
    return function* (next) {
        var fileType = (this.url.match(/\.(js)$/) || []).shift();
        if (fileType) {
            var file, content = this.body;
            if (!content) {
                var json = 0;
                file = path.resolve(dir, this.url);
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
                content = addVersionToRequire(path.dirname(file), content);
                content = 'define(function (require, exports, module) {' + content + '\n});';
            }
            this.set('Content-Type', 'application/javascript;charset=utf-8');
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