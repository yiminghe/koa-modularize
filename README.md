# koa-modularize

koa middleware for transforming node_modules js file into browser module format and imported css path to absolute node_modules path


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

open  http://localhost:8000/test/helloworld.js  http://localhost:8000/test/test.css

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