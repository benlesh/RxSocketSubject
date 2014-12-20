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

        /**
            An error class for triggering errors with a custom reason
            and code.

            ### Example

                        var ClientInitiatedError = RxSocketSubject.ClientInitiatedError;

                        socket.onError(new ClientInitiatedError('bad things', 4001));

            @class ClientInitiatedError
            @constructor
            @param message {String} the message (aka reason)
            @param code {Number} [optional] the custom error code. Defaults to `1008`
        */
        function ClientInitiatedError(message, code) {
            this.message = message;
            if(code) {
                this.code = code;
            }
        }

        ClientInitiatedError.prototype = {
            constructor: ClientInitiatedError,

            /**
                The message (aka reason)
                @property message
                @type {String}
                @default ''
            */
            message: '',

            /**
                The status code
                @property code
                @type {Number}
                @default 1008
            */
            code: CLOSE_GENERIC
        };

        __es6_export__("default", ClientInitiatedError);
    }
);

//# sourceMappingURL=client-initiated-error.js.map