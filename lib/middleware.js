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
  option.prefix = option.prefix || '';
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
        var leading = 'define(function (require, exports, module) {\n';
        var contents = content.split(/\n/);
        var sourceNode = (new SourceMap.SourceNode(null, null, this.url,leading));
        var maps = [];
        for (var i = 0; i < contents.length; i++) {
          maps.push(new SourceMap.SourceNode(i + 1, 0, this.url, [contents[i], '\n']));
        }
        sourceNode.add(maps);
        sourceNode = sourceNode.add(new SourceMap.SourceNode(null, null, this.url, '\n});'));
        yiminghe.sourceMaps = yiminghe.sourceMaps || [];
        var stringMap = sourceNode.toStringWithSourceMap({});
        yiminghe.sourceMaps.push(stringMap.map);
        content = stringMap.code;
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
