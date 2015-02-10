# koa-modularize
---

koa middleware for transforming node_modules js file into browser module format and imported css path to absolute node_modules path

[![NPM version][npm-image]][npm-url]
[![gemnasium deps][gemnasium-image]][gemnasium-url]
[![node version][node-image]][node-url]
[![npm download][download-image]][download-url]

[npm-image]: http://img.shields.io/npm/v/koa-modularize.svg?style=flat-square
[npm-url]: http://npmjs.org/package/koa-modularize
[travis-image]: https://img.shields.io/travis/yiminghe/koa-modularize.svg?style=flat-square
[travis-url]: https://travis-ci.org/yiminghe/koa-modularize
[coveralls-image]: https://img.shields.io/coveralls/yiminghe/koa-modularize.svg?style=flat-square
[coveralls-url]: https://coveralls.io/r/yiminghe/koa-modularize?branch=master
[gemnasium-image]: http://img.shields.io/gemnasium/yiminghe/koa-modularize.svg?style=flat-square
[gemnasium-url]: https://gemnasium.com/yiminghe/koa-modularize
[node-image]: https://img.shields.io/badge/node.js-%3E=_0.11-green.svg?style=flat-square
[node-url]: http://nodejs.org/download/
[download-image]: https://img.shields.io/npm/dm/koa-modularize.svg?style=flat-square
[download-url]: https://npmjs.org/package/koa-modularize

## Usage

```javascript
var koa = require('koa');
var modularize = require('koa-modularize');
app.use(modularize());
app.listen(8000);
```

## Example

```
npm start
```

open  http://localhost:9999/test/test.html

## API

```javascript
GeneratorFunction modularize(dir:String, option: Object)
```

### dir

file directory code belongs in. defaults to process.cwd()

### Option details
<table class="table table-bordered table-striped">
    <thead>
    <tr>
        <th style="width: 100px;">name</th>
        <th style="width: 50px;">type</th>
        <th>description</th>
    </tr>
    </thead>
    <tbody>
      <tr>
         <td>option.nowrap</td>
         <td>Function</td>
         <td>whether wrap code with define and transform package into absolute url for browser loader library</td>
      </tr>
      <tr>
          <td>option.next</td>
          <td>Function</td>
          <td>request handler will call this function to judge whether yield next</td>
      </tr>
    </tbody>
</table>