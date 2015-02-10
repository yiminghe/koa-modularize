/**
 * koa middleware for transforming commonjs file into browser module format and imported css path to absolute path
 * @author yiminghe@gmail.com
 */

var path = require('path');
var fs = require('fs');
var util = require('modulex-util');
var modularizeUtils = require('./lib/utils');
var cwd = process.cwd();

module.exports = function (dir, option) {
  dir = dir || cwd;
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
        content = modularizeUtils.completeRequire(file, content, option);
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
      content = modularizeUtils.completeCssImport(file, content, option);
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
