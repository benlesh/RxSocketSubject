define(
    "RxSocketSubject/client-initiated-error",
    ["./constants", "exports"],
    function(RxSocketSubject$constants$$, __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var CLOSE_GENERIC;
        CLOSE_GENERIC = RxSocketSubject$constants$$["CLOSE_GENERIC"];

        function ClientInitiatedError(message, code) {
            this.message = message;
            this.code = code || CLOSE_GENERIC;
        }

        __es6_export__("default", ClientInitiatedError);
    }
);

//# sourceMappingURL=client-initiated-error.js.map