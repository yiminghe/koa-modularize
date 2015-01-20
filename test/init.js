var utils = require('modulex-util');
var debug = require('debug');
debug.enable('app');
var log = debug('app');

//var x = require('x/i');
//var x = require('x');

require('util/support/isBuffer');
require('util');

/*

 try
 require('zz')

 */
log(utils.escapeHtml('<a>'));