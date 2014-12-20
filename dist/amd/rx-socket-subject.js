define(
    "rx-socket-subject",
    ["./RxSocketSubject/create", "./RxSocketSubject/config", "./RxSocketSubject/constants", "./RxSocketSubject/client-initiated-error", "exports"],
    function(
        RxSocketSubject$create$$,
        RxSocketSubject$config$$,
        RxSocketSubject$constants$$,
        RxSocketSubject$client$initiated$error$$,
        __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var create;
        create = RxSocketSubject$create$$["create"];
        var config;
        config = RxSocketSubject$config$$["default"];
        var CLOSE_GENERIC;
        CLOSE_GENERIC = RxSocketSubject$constants$$["CLOSE_GENERIC"];
        var ClientInitiatedError;
        ClientInitiatedError = RxSocketSubject$client$initiated$error$$["default"];
        __es6_export__("create", create);
        __es6_export__("config", config);
        __es6_export__("ClientInitiatedError", ClientInitiatedError);
        __es6_export__("CLOSE_GENERIC", CLOSE_GENERIC);
    }
);

//# sourceMappingURL=rx-socket-subject.js.map