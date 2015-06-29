require('debug');
require('rc-calendar/assets/bootstrap.css');
var x = {
  require: function () {
  }
};
x.require('zzzz');
var utils = require('modulex-util');
var debug = require('debug');
debug.enable('app');
var log = debug('app');
require('./d');

//var x = require('x/i');
//var x = require('x');

require('util/support/isBuffer');
require('util');

require('when');

require('superagent');

require('react');
/*

 try
 require('zz')

 */
log(utils.escapeHtml('<a>'));

var $ = require('jquery');


$('#result').html(utils.escapeHtml('<b>'));

$('#result').click(function(){
  console.log(1);
});

require('x');

require('./node');

require('koa-modularize/test/node');

// domain require

//var matrix = require('@ali/matrix');
//console.log(matrix);