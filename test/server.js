var koa = require('koa');
var serve = require('koa-static');
var app = koa();
var cwd = process.cwd();
var path = require('path');
var serveIndex = require('koa-serve-index');
var debug = require('debug')('koa-modularize');
app.use(serveIndex(cwd, {
  hidden: true,
  view: 'details'
}));
var modularize = require('../');
app.use(modularize(cwd, {
  externals: {jquery: "window.jQuery"},
  next: function () {
    return 1;
  },
  modules:{
    x:path.join(cwd,'node_modules/modulex-util/index')
  }
}));

app.use(require('koa-source-map')({}));

app.use(serve(cwd, {
  hidden: true
}));
app.listen(9999);
debug('server start at ' + 9999);
