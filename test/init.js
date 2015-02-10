var utils = require('modulex-util');
var debug = require('debug');
debug.enable('app');
var log = debug('app');

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