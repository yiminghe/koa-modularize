var koa = require('koa');
var serve = require('koa-static');
var app = koa();
var cwd = process.cwd();
var serveIndex = require('koa-serve-index');
var debug = require('debug')('koa-modularize');
app.use(serveIndex(cwd, {
  hidden: true,
  view: 'details'
}));
var modularize = require('../');
app.use(modularize(cwd, {
  externals: {jquery: "jQuery"},
  next: function () {
    return 1;
  },
  packageHook: function (file, packageName, suffix) {
    if (packageName === 'x' && !suffix) {
      return '/node_modules/modulex-util/index';
    } else {
      if (packageName === 'x') {
        return '/node_modules/modulex-util' + suffix;
      }
    }
  }
}));

var Buffer = require('buffer').Buffer;
function inlineSourceMap(sourceMaps, sourceCode, sourceFilename) {
  // This can be used with a sourcemap that has already has toJSON called on it.
  // Check first.
  var json = sourceMaps;
  if (typeof sourceMaps.toJSON === 'function') {
    json = sourceMaps.toJSON();
  }
  json.sources = [sourceFilename];
  json.sourcesContent = [sourceCode];
  var base64 = Buffer(JSON.stringify(json)).toString('base64');
  return '//# sourceMappingURL=data:application/json;base64,' + base64;
}

var SourceMap = require('source-map');

app.use(function *(next) {
  var yiminghe = this.yiminghe || {};
  var sourceMaps = yiminghe.sourceMaps;
  if (sourceMaps && sourceMaps.length) {
    this.body = this.body.replace(/\/\/[@#]\ssourceMappingURL[^\r\n]*/g, '//');
    // Mutliple levels of SourceMaps (like coffee -> js -> min)
    var aggregatedMap = sourceMaps[0];
    for (var i = 1; i < sourceMaps.length; i++) {
      aggregatedMap.applySourceMap(sourceMaps[i]);
    }
    this.body += '\n' + inlineSourceMap(aggregatedMap, yiminghe.source, 'yiminghe://' + this.url);
  } else {
    yield *next;
  }
});
app.use(serve(cwd, {
  hidden: true
}));
app.listen(9999);
debug('server start at ' + 9999);
