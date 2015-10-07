var expect = chai.expect;

describe('RedParser', function () {
    var parser = new RedParser();
    describe('#getScope', function () {
        it('with rule, no context - single node', function () {
            var found = parser.getScope({scope: '.get-scope-test'});
            expect(found).to.be.an.instanceof(HTMLElement);
            expect(found.classList.contains('get-scope-test')).to.be.true;
        });

        it('with rule, no context - node list', function () {
            var found = parser.getScope({scope: '.get-scope-test-2', multiple: true});
            expect(found).to.be.an.instanceof(NodeList);
            Array.prototype.forEach.call(found, function (item) {
                expect(item.classList.contains('get-scope-test-2')).to.be.true;
            });
        });

        it('nothing is passed - html document', function () {
            var found = parser.getScope({});
            expect(found).to.be.instanceOf(HTMLDocument);
        });

        it('get single multiple subNodes', function () {
            var node = document.querySelector('.get-scope-test-3');
            expect(node).to.be.instanceOf(HTMLElement);

            var found = parser.getScope({scope: '.get-scope-test-3-passed', multiple: true}, node);
            expect(found).to.be.instanceOf(NodeList);
            expect(found.length).equal(2);
            Array.prototype.forEach.call(found, function (item) {
                expect(item).to.be.instanceOf(HTMLElement);
                expect(item.classList.contains('get-scope-test-3-passed')).to.be.true;
            });
        });

        it('get single subNode', function () {
            var node = document.querySelector('.get-scope-test-3');
            expect(node).to.be.instanceOf(HTMLElement);

            var found = parser.getScope({scope: '.get-scope-test-3-passed'}, node);
            expect(found).to.be.instanceOf(HTMLElement);
            expect(found.classList.contains('get-scope-test-3-passed')).to.be.true;
        });

        it('get subNode list', function () {
            var node = document.querySelector('.get-scope-test-3');
            expect(node).to.be.instanceOf(HTMLElement);

            var found = parser.getScope({scope: '.get-scope-test-3-passed'}, node);
            Array.prototype.slice.call(found).forEach(function (item) {
                expect(item).to.be.instanceOf(HTMLElement);
                expect(item.classList.contains('get-scope-test-3-passed')).to.be.true;
            });
        });
    });

    describe('#parse', function () {
        it('parse simple element', function () {
            var result = parser.parse({scope: 'div.get-scope-test'});
            expect(result).equal('simple');
        });

        it('parse simple element with multiple flag', function () {
            var result = parser.parse({scope: 'div.get-scope-test-2', multiple: true});
            expect(result).equal('column column');
        });

        it('parse simple element with multiple flag and separator ","', function () {
            var result = parser.parse({scope: 'div.get-scope-test-2', multiple: true, separator: ','});
            expect(result).equal('column,column');
        });

        it('parse collection element, with context', function () {
            var result = parser.parse({
                scope: 'div.get-scope-test-4-passed',
                collection: [[
                    {name: 'row1', scope: 'div:first-child'},
                    {name: 'row2', scope: 'div:last-child'},
                ]]
            });
            expect(result).to.be.instanceOf(Array);
            expect(result).to.have.length(2);
            result.forEach(function (item) {
                expect(item).to.be.instanceOf(Object);
                expect(item.row1).equal('row1');
                expect(item.row2).equal('row2');
            });
        });

        it('parse row element, with context', function () {
            var result = parser.parse({
                scope: 'div.get-scope-test-3',
                collection: [
                    {name: 'column1', scope: 'div:first-child'},
                    {name: 'column2', scope: 'div:last-child'},
                ]
            });
            expect(result).to.be.instanceOf(Object);
            expect(result.column1).equal('column1');
            expect(result.column2).equal('column2');
        });

        it('parse collection with sub collection, with context', function () {
            var result = parser.parse({
                scope: 'div.get-scope-test-5-passed',
                collection: [[
                    {name: 'column1', scope: 'div.get-scope-test-5-passed-column1'},
                    {
                        name: 'sub-column',
                        scope: 'div:last-child',
                        extract: true,
                        collection: [
                            {name: 'column2', scope: 'div.get-scope-test-5-passed-column2'},
                            {name: 'column3', scope: 'div.get-scope-test-5-passed-column3'},
                            {name: 'column4', scope: 'div.get-scope-test-5-passed-column4'}
                        ]
                    }
                ]]
            });
            expect(result).to.be.instanceOf(Array);
            expect(result).to.have.length(2);
            result.forEach(function (item) {
                expect(item).to.be.instanceOf(Object);
                expect(item.column1).equal('column1');
            });
        });

        it('parse collection with sub collection, with context', function () {
            var result = parser.parse({
                scope: 'div.get-scope-test-5-passed',
                collection: [[
                    {name: 'column1', scope: 'div.get-scope-test-5-passed-column1'},
                    {
                        name: 'sub-column',
                        scope: 'div:last-child',
                        extract: true,
                        collection: [
                            {name: 'column2', scope: 'div.get-scope-test-5-passed-column2'},
                            {name: 'column3', scope: 'div.get-scope-test-5-passed-column3'},
                            {name: 'column4', scope: 'div.get-scope-test-5-passed-column4'}
                        ]
                    }
                ]],
                events: [
                    {event: 'parse.pre', action: 'click', scope: 'div.get-scope-test-5-passed-column1'}
                ]
            });
            expect(result).to.be.instanceOf(Array);
            expect(result).to.have.length(2);
            result.forEach(function (item) {
                expect(item).to.be.instanceOf(Object);
                expect(item.column1).equal('column11');
            });
        });
    });
});

describe('PaginatableParser', function () {
    this.timeout(30000);
    var parser = new PaginatableParser();

    it('parse scrollable collection', function (done) {
        var result = parser.parseAsync(
            {
                scope: '.scrollable > .content > div.get-scope-test-6-passed',
                collection: [[
                    {name: 'column1', scope: 'div.get-scope-test-6-passed-column1'},
                    {
                        name: 'sub-column',
                        scope: 'div:last-child',
                        extract: true,
                        collection: [
                            {name: 'column2', scope: 'div.get-scope-test-6-passed-column2'},
                            {name: 'column3', scope: 'div.get-scope-test-6-passed-column3'},
                            {name: 'column4', scope: 'div.get-scope-test-6-passed-column4'}
                        ]
                    }
                ]]
            },
            function (result) {
                expect(result).to.be.instanceOf(Array);
                result.forEach(function (item) {
                    expect(item).to.be.instanceOf(Object);
                    expect(item.column1).equal('column1');
                    expect(item.column2).equal('column2');
                    expect(item.column3).equal('column3');
                    expect(item.column4).equal('column4');
                });
                done();
            },
            {
                type: 'scroll',
                interval: 100
            }
        );
    });

    it('parse paginateable collection', function (done) {
        var result = parser.parseAsync(
            {
                scope: '.pageable > .content > div.get-scope-test-6-passed',
                collection: [[
                    {name: 'column1', scope: 'div.get-scope-test-6-passed-column1'},
                    {
                        name: 'sub-column',
                        scope: 'div:last-child',
                        extract: true,
                        collection: [
                            {name: 'column2', scope: 'div.get-scope-test-6-passed-column2'},
                            {name: 'column3', scope: 'div.get-scope-test-6-passed-column3'},
                            {name: 'column4', scope: 'div.get-scope-test-6-passed-column4'}
                        ]
                    }
                ]]
            },
            function (result) {
                expect(result).to.be.instanceOf(Array);
                expect(result).to.have.length(10);
                var pageCounter = 1;
                result.forEach(function (item) {
                    expect(item).to.be.instanceOf(Object);
                    expect(item.column1).equal('column1' + (pageCounter++));
                    expect(item.column2).equal('column2');
                    expect(item.column3).equal('column3');
                    expect(item.column4).equal('column4');
                });
                done();
            },
            {
                type: 'paginate',
                scope: 'div.pageable > div.pagination > div'
            }
        );
    });
});
