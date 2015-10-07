(function (root, factory) {
    if (typeof define === 'function' && define.amd) {
        define([], factory);
    } else if (typeof module === 'object' && module.exports) {
        module.exports = factory();
    } else {
        root.RedParser = factory();
    }
}(this, function () {
    if (typeof debug !== 'function') {
        var debug = function () {
        };
    }

    /**
     * @class
     */
    var RedParser = function () {
    };

    RedParser.prototype = {
        constructor: RedParser,

        _TYPES: {
            RULE: {
                SIMPLE: 'simple',
                COLLECTION: 'collection',
                GRID: 'grid'
            },
            ACTION: {
                CLICK: 'click'
            },
            EVENT: {
                BEFORE_SCRAPING: 'before',
                AFTER_SCRAPING: 'after'
            }
        },

        /**
         * Parse node with parse rule
         *
         * @param {object} rule
         * @param {HTMLElement?} currentScope
         * @param {int?} startPosition
         */
        parse: function (rule, currentScope, startPosition) {
            debug('.parse() is called with params %s', JSON.stringify(rule));
            startPosition = startPosition || null;
            currentScope = this.getScope(rule, currentScope);

            switch (this.getRuleType(rule)) {
                case this._TYPES.RULE.GRID:
                {
                    var parsed = [];
                    var rowIndex = startPosition !== null ? startPosition : 0;
                    for (; rowIndex < currentScope.length; rowIndex++) {
                        var row = currentScope[rowIndex];
                        this.on('parse.pre', rule, row);
                        var parsedRow = this.parse({collection: rule.collection[0]}, row);
                        if (parsedRow !== undefined) {
                            parsed.push(parsedRow);
                        }
                    }
                    break;
                }
                case this._TYPES.RULE.COLLECTION:
                {
                    if (currentScope instanceof NodeList && currentScope.length > 0) {
                        currentScope = currentScope[0];
                    }
                    if (currentScope instanceof HTMLElement) {
                        this.on('parse.pre', rule, currentScope);
                        parsed = {};
                        for (var ruleIndex = 0; ruleIndex < rule.collection.length; ruleIndex++) {
                            var inlineRule = rule.collection[ruleIndex];
                            var parsedValue = undefined;
                            if (inlineRule.scope !== undefined) {
                                parsedValue = this.parse(inlineRule, currentScope);
                            }

                            if (inlineRule.extract === true) {
                                if (parsedValue instanceof Object) {
                                    for (var index in parsedValue) {
                                        parsed[index] = parsedValue[index];
                                    }
                                }
                                else {
                                    parsed[inlineRule.name] = 'ERROR';
                                }
                            }
                            else {
                                parsed[inlineRule.name] = parsedValue;
                            }
                        }
                    }
                    break;
                }
                case this._TYPES.RULE.SIMPLE:
                {
                    if (currentScope instanceof NodeList && currentScope.length === 1) {
                        currentScope = currentScope[0];
                    }
                    if (currentScope instanceof HTMLElement) {
                        this.on('parse.pre', rule, currentScope);
                        // innerHTML, innerText
                        parsed = currentScope.innerText;
                    }
                    if (currentScope instanceof NodeList) {
                        var combinedValue = [];
                        for (var rowIndex = 0; rowIndex < currentScope.length; rowIndex++) {
                            var row = currentScope[rowIndex];
                            combinedValue.push(row.innerText);
                        }
                        rule.separator = rule.separator || ' ';
                        // innerHTML, innerText
                        parsed = combinedValue.join(rule.separator);
                    }
                    break;
                }
            }

            this.on('parse.post', rule, currentScope);

            debug('parsed %s', JSON.stringify(parsed));
            return parsed;
        },

        /**
         * Get scope by rule
         *
         * @param {Object} rule
         * @param {?HTMLElement} node
         * @returns {?NodeList}
         */
        getScope: function (rule, node) {
            debug('.getScope() is called with params %s', JSON.stringify(rule));
            var fetchSingleNode = this.getRuleType(rule) === this._TYPES.RULE.SIMPLE && rule.multiple !== true;
            node = node || document;

            if (!(node instanceof HTMLElement) && !(node instanceof HTMLDocument)) {
                return null;
            }

            var scope = rule.scope || undefined;
            return scope === undefined ? node : (fetchSingleNode ? node.querySelector(scope) : node.querySelectorAll(scope));
        },

        /**
         * Get rule type
         * @param {Object} rule
         * @returns {string}
         */
        getRuleType: function (rule) {
            debug('.getRuleType() is called for rule %s', JSON.stringify(rule));
            var isCollection = rule.collection !== undefined;

            // collection type
            if (isCollection) {
                // real collection
                if (rule.collection[0] instanceof Array) {
                    return this._TYPES.RULE.GRID;
                }

                if (rule.collection[0] instanceof Object) {
                    return this._TYPES.RULE.COLLECTION;
                }
            }

            return this._TYPES.RULE.SIMPLE;
        },

        /**
         * Do action on scope element
         * @param {string|Function} action
         * @param {HTMLElement} scope
         * @returns {string}
         */
        doAction: function (action, scope) {
            debug('.doAction() is called');
            if (typeof action === 'function') {
                action.bind(scope);
            }
            if (typeof action === 'string') {
                switch (action) {
                    case this._TYPES.ACTION.CLICK:
                    {
                        scope.click();
                        break;
                    }
                }
            }
        },

        /**
         * @param {string} event
         * @param {object} rule
         * @param {HTMLElement} currentScope
         */
        on: function (event, rule, currentScope) {
            if (rule.events instanceof Array) {
                var self = this;
                rule.events.forEach(function (e) {
                    if (
                        e.event === event &&
                        e.action !== undefined &&
                        e.scope !== undefined
                    ) {
                        self.doAction(
                            e.action,
                            currentScope.querySelector(e.scope)
                        );
                    }
                });
            }
        }
    };

    return RedParser;
}));
