var koa = require('koa');
var serve = require('koa-static');
var app = koa();
var cwd = process.cwd();
var serveIndex = require('koa-serve-index');
app.use(serveIndex(cwd, {
  hidden: true,
  view: 'details'
}));
var modularize = require('../');
app.use(modularize(cwd, {
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
app.use(serve(cwd, {
  hidden: true
}));
app.listen(9999);
console.log('server start at ' + 9999);
