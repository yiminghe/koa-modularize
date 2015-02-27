var koa = require('koa');
var serve = require('koa-static');
var app = koa();
var cwd = process.cwd();
var serveIndex = require('koa-serve-index');
var debug = require('debug')('koa-modularize');
var mount = require('koa-mount');
var prefix = '/mount';

app.use(mount(prefix, serveIndex(cwd, {
  hidden: true,
  view: 'details'
})));
var modularize = require('../');
app.use(mount(prefix, modularize(cwd, {
  prefix: prefix,
  packageHook: function (file, packageName, suffix) {
    if (packageName === 'x' && !suffix) {
      return '/node_modules/modulex-util/index';
    } else {
      if (packageName === 'x') {
        return '/node_modules/modulex-util' + suffix;
      }
    }
  }
})));
app.use(mount(prefix, serve(cwd, {
  hidden: true
})));
app.listen(9999);
debug('server start at ' + 9999);
