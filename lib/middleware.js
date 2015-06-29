/**
 * koa middleware for transforming commonjs file into browser module format and imported css path to absolute path
 * @author yiminghe@gmail.com
 */

var path = require('path');
var fs = require('fs');
var util = require('modulex-util');
var modularizeUtils = require('./utils');
var cwd = process.cwd();
var SourceMap = require('source-map');

module.exports = function (dir, option) {
  dir = dir || cwd;
  option = option || {};
  return function* (next) {
    var fileType = (this.url.match(/\.(js)$/) || [])[1];
    var file, content;
    if (fileType === 'js') {
      var yiminghe = this.yiminghe = this.yiminghe || {};
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
        yiminghe.source = content;
        if (json) {
          content = 'module.exports = ' + content + ';';
        }
      }
      if (!option.nowrap || !option.nowrap.call(this)) {
        content = modularizeUtils.completeRequire(file, content, option);
        var leading = 'define(function (require, exports, module) {'; // no \n does not change file no
        var contents = content.split(/\n/);
        var map = new SourceMap.SourceMapGenerator({
          file: 'source-mapped.js.map'
        });
        for (var i = 0; i < contents.length; i++) {
          map.addMapping({
            generated: {
              line: i + 1,
              column: 0
            },
            original: {
              line: i + 1,
              column: 0
            },
            source: this.url
          });
        }
        yiminghe.sourceMaps = yiminghe.sourceMaps || [];
        // plain json
        yiminghe.sourceMaps.push(map.toJSON());
        content = leading + content + '\n});';
      }
      this.set('Content-Type', 'application/javascript;charset=utf-8');
      this.set('Content-Length', Buffer.byteLength(content));
      this.body = content;
      if (option.next && option.next.call(this)) {
        yield *next;
      }
    } else {
      yield *next;
    }
  };
};
