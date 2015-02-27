require('debug');
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

/*

 try
 require('zz')

 */
log(utils.escapeHtml('<a>'));

var $ = require('jquery');

$('#result').html(utils.escapeHtml('<b>'));