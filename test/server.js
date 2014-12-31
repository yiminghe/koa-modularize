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

}));
app.use(serve(cwd, {
    hidden: true
}));
app.listen(8000);
console.log('server start at ' + 8000);
