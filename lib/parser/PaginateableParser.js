try {
    var RedParser = require('./RedParser');
} catch (e) {
}

/**
 * @class
 * @extends RedParser
 */
var PaginateableParser = function () {
};

if (typeof debug !== 'function') {
    var debug = function () {
    };
}

PaginateableParser.prototype = Object.create(RedParser.prototype);
PaginateableParser.prototype.constructor = PaginateableParser;

PaginateableParser.prototype._TYPES.PAGINATION = {
    SCROLL: 'scroll',
    PAGINATE: 'paginate'
};

/**
 * Paginate page
 *
 * @param {object} pagination
 */
PaginateableParser.prototype.paginate = function (pagination) {
    pagination = this._defaults(pagination, {
        page: 0
    });

    switch (pagination.type) {
        case this._TYPES.PAGINATION.SCROLL:
            window.document.body.scrollTop = window.document.body.scrollTop + pagination.interval;
            break;
        case this._TYPES.PAGINATION.PAGINATE:
            var pagesScope = this.getScope({
                scope: pagination.scope,
                collection: [[]]
            });
            if (pagesScope[pagination.page] === undefined) {
                return;
            }
            pagesScope[pagination.page].click();
            break;
    }
};

/**
 * Check if pagination is complete
 *
 * @param {object} previousPage
 * @param {object} rule
 * @param {object} pagination
 *
 * @returns {false|Object} Returns parsed current page after the pagination or false otherwise
 */
PaginateableParser.prototype.hasPaginated = function (previousPage, rule, pagination) {
    var currentScope = this.getScope(rule);
    if (!(currentScope instanceof NodeList)) {
        return false;
    }

    var pageResult = false;
    switch (pagination.type) {
        case this._TYPES.PAGINATION.SCROLL:
            if (currentScope.length > previousPage.length) {
                var parsed = this.parse(rule, null, previousPage.length);
                pageResult = {
                    page: pagination.page,
                    parsed: parsed
                };
            }
            break;
        case this._TYPES.PAGINATION.PAGINATE:
            var parsed = this.parse(rule);
            if (this._hasChanged(previousPage, parsed)) {
                pageResult = {
                    page: pagination.page,
                    parsed: parsed
                };
            }
            break;
    }

    return pageResult;
};

/**
 * Get current page after pagination
 *
 * @param {object} previousPage
 * @param {object} rule
 * @param {object} pagination
 * @param {function} doneFn
 * @private
 */
PaginateableParser.prototype.getPage = function (previousPage, rule, pagination, doneFn) {
    pagination = this._defaults(pagination, {
        wait: {
            interval: 500,
            timeout: 3000
        },
        page: 0
    });

    this.paginate(pagination);

    var counted = 0;
    var pageResult = false;
    var self = this;

    var timeoutId = setInterval(
        function () {
            pageResult = self.hasPaginated(previousPage, rule, pagination);
            counted += pagination.wait.interval;

            if (counted >= pagination.wait.timeout || pageResult !== false) {
                clearInterval(timeoutId);
                doneFn(pageResult || {page: pagination.page, parsed: []});
            }
        },
        pagination.wait.interval
    );
};

/**
 * Parse page in async way
 *
 * @param {object} rule
 * @param {function} doneFn
 * @param {?object} pagination
 */
PaginateableParser.prototype.parseAsync = function (rule, doneFn, pagination) {
    var self = this;
    var parsed = this.parse(rule);
    if (pagination === undefined) {
        doneFn(parsed);
    }

    pagination.page = 1;
    this.getPage(parsed, rule, pagination, function getPageDoneFn(result) {
        if (result.parsed.length !== 0) {
            parsed = parsed.concat(result.parsed);
            pagination.page = result.page + 1;
            self.getPage(
                pagination.type === self._TYPES.PAGINATION.SCROLL ? parsed : result.parsed,
                rule,
                pagination,
                getPageDoneFn
            );
            return;
        }
        doneFn(parsed);
    });
};

/**
 * Check two objects for changes
 * @param {Object|Array} oldObject
 * @param {Object|Array} newObject
 * @returns {boolean}
 * @private
 */
PaginateableParser.prototype._hasChanged = function (oldObject, newObject) {
    for (var p in oldObject) {
        try {
            // Property in destination object set; update its value.
            if (oldObject[p].constructor == Object || oldObject[p].constructor == Array) {
                if (this._hasChanged(oldObject[p], newObject[p])) {
                    return true;
                }
            } else {
                if (oldObject[p] !== newObject[p]) {
                    return true;
                }
            }
        } catch (e) {
        }
    }

    return false;
};


/**
 * @param {object} obj
 * @param {object} defaults
 * @returns {object}
 * @private
 */
PaginateableParser.prototype._defaults = function (obj, defaults) {
    var res = defaults;
    for (var p in obj) {
        try {
            // Property in destination object set; update its value.
            if (obj[p].constructor == Object) {
                res[p] = this._defaults(obj[p], res[p]);
            } else {
                res[p] = obj[p];
            }
        } catch (e) {
            // Property in destination object not set; create it and set its value.
            res[p] = obj[p];
        }
    }

    return res;
};

if (typeof module === 'object' && module.exports) {
    module.exports = PaginateableParser;
}