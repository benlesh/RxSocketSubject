define("RxSocketSubject/utils", ["exports"], function(__exports__) {
    "use strict";

    function __es6_export__(name, value) {
        __exports__[name] = value;
    }

    function extend(a, b) {
        for(var key in b) {
            if(b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        
        return a;
    }
    __es6_export__("extend", extend);
});

//# sourceMappingURL=utils.js.map