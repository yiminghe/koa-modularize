var koa = require('koa');
var serve = require('koa-static');
var app = koa();
var cwd = process.cwd();
var serveIndex = require('koa-serve-index');
var debug = require('debug')('koa-modularize');
var mount = require('koa-mount');
var prefix = '/mount';
var path = require('path');

app.use(mount(prefix, serveIndex(cwd, {
  hidden: true,
  view: 'details'
})));
var modularize = require('../');
app.use(mount(prefix, modularize(cwd, {
  prefix: prefix,
  externals: {jquery: "jQuery"},
  modules: {
    x: path.join(cwd, 'node_modules/modulex-util/index')
  }
})));
app.use(mount(prefix, serve(cwd, {
  hidden: true
})));
app.listen(9999);
debug('server start at ' + 9999);
