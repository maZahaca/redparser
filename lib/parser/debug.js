var debug = function () {
    if (
        !(window.DEBUG instanceof Array) ||
        (
            window.DEBUG.indexOf('PaginateableParser') === -1 &&
            window.DEBUG.indexOf('RedParser') === -1
        )
    ) {
        return;
    }
    var args = [].slice.apply(arguments);
    if (args.length > 0) {
        var index = 0;
        args[0] = args[0].replace(/%([a-z%])/g, function (match, format) {
            // if we encounter an escaped % then don't increase the array index
            if (match === '%%') return match;
            index++;
            if (format === 's') {
                match = args[index];
                args.splice(index, 1);
                index--;
            }
            return match;
        });
        console.log('[RedParser] ' + args[0]);
    }
};