var utils = require('modulex-util');
var debug = require('debug');
debug.enable('app');
var log = debug('app');
/*

 try
 require('zz')

 */
log(utils.escapeHtml('<a>'));
