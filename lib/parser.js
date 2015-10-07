/*!
 * parser
 * Copyright(c) 2015 Andrew Reddikh <andrew@reddikh.com>
 * MIT Licensed
 */

var exports = module.exports = {};

/*!
 * Parser version
 */

exports.version = '0.1.0';

var RedParser = require('./parser/RedParser.js');
exports.config = RedParser;

var PaginateableParser = require('./parser/PaginateableParser.js');
exports.config = PaginateableParser;

