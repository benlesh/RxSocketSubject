define("RxSocketSubject/config", ["exports"], function(__exports__) {
    "use strict";

    function __es6_export__(name, value) {
        __exports__[name] = value;
    }

    __es6_export__("default", {
        /**
            The WebSocket constructor to use to create the underlying socket
            @property WebSocket
            @type {WebSocket}
            @default window.WebSocket
        */
        WebSocket: window.WebSocket
    });
});

//# sourceMappingURL=config.js.map