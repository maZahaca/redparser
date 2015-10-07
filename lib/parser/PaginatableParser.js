(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define(['./RedParser', '../lodash'], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory(require('./RedParser'), require('../lodash'));
    } else {
        root.PaginatableParser = factory(root.RedParser, root._);
    }
}(this, function (RedParser, _) {
    if (typeof debug !== 'function') {
        var debug = function () {
        };
    }

    /**
     * @class
     * @extends RedParser
     */
    var PaginatableParser = function () {
    };

    var baseProto = RedParser.prototype;
    PaginatableParser.prototype = _.create(baseProto, {
        constructor: PaginatableParser,

        _TYPES: _.defaultsDeep({
            PAGINATION: {
                SCROLL: 'scroll',
                PAGINATE: 'paginate'
            }
        }, baseProto._TYPES),

        /**
         * Paginate page
         *
         * @param {object} pagination
         */
        paginate: function (pagination) {
            pagination = _.defaultsDeep(pagination, {
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
        },

        /**
         * Check if pagination is complete
         *
         * @param {object} previousPage
         * @param {object} rule
         * @param {object} pagination
         *
         * @returns {false|Object} Returns parsed current page after the pagination or false otherwise
         */
        hasPaginated: function (previousPage, rule, pagination) {
            var currentScope = this.getScope(rule);
            if (!(currentScope instanceof NodeList)) {
                return false;
            }

            var pageResult = false;
            switch (pagination.type) {
                case this._TYPES.PAGINATION.SCROLL:
                    if (currentScope.length > previousPage.length) {
                        pageResult = {
                            page: pagination.page,
                            parsed: this.parse(rule, null, previousPage.length)
                        };
                    }
                    break;
                case this._TYPES.PAGINATION.PAGINATE:
                    var parsed = this.parse(rule);
                    if (!_.isEqual(previousPage, parsed)) {
                        pageResult = {
                            page: pagination.page,
                            parsed: parsed
                        };
                    }
                    break;
            }

            return pageResult;
        },

        /**
         * Get current page after pagination
         *
         * @param {object} previousPage
         * @param {object} rule
         * @param {object} pagination
         * @param {function} doneFn
         * @private
         */
        getPage: function (previousPage, rule, pagination, doneFn) {
            pagination = _.defaultsDeep(pagination, {
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
        },

        /**
         * Parse page in async way
         *
         * @param {object} rule
         * @param {function} doneFn
         * @param {?object} pagination
         */
        parseAsync: function (rule, doneFn, pagination) {
            var self = this;
            var parsed = this.parse(rule);
            if (pagination === undefined) {
                doneFn(parsed);
            }

            pagination.page = 1;
            this.getPage(parsed, rule, pagination, function getPageDoneFn (result) {
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
        }
    });

    return PaginatableParser;
}));
