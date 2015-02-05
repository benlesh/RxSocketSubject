define("RxSocketSubject/internal", ["exports"], function(__exports__) {
    "use strict";

    function __es6_export__(name, value) {
        __exports__[name] = value;
    }

    function mixin(target, source) {
        var sources = arguments.length === 2 ? [source] : [].slice.call(arguments, 1);

        sources.forEach(function(source) {
            for(var key in source) {
                if(source.hasOwnProperty(key)) {
                    target[key] = source[key];
                }
            }
        });
    }
    __es6_export__("mixin", mixin);
});

//# sourceMappingURL=internal.js.map