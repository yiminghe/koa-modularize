var path = require('path');
var fs = require('fs');

module.exports = function (dir, option) {
    dir = dir || process.cwd();
    option = option || {};
    return function* (next) {
        var fileType = (this.url.match(/\.(js)$/) || []).shift();
        if (fileType) {
            var file,content = this.body;
            if(!content){
                file = path.join(dir, this.url);
                content = fs.readFileSync(file,'utf-8');
            }
            content = 'define(function (require, exports, module) {' + content + '\n});';
            this.set('Content-Type', 'application/javascript;charset=utf-8');
            this.set('Content-Length', Buffer.byteLength(content));
            this.body = content;
            if(option.next && option.next.call(this)) {
                yield * next;
            }
        } else {
            yield *next;
        }
    };
};