(function() {
    "use strict";

    var $$RxSocketSubject$config$$default = {
        /**
            The WebSocket constructor to use to create the underlying socket
            @property WebSocket
            @type {WebSocket}
            @default window.WebSocket
        */
        WebSocket: window.WebSocket
    };

    var $$RxSocketSubject$constants$$CLOSE_GENERIC = 1008;

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
    function $$RxSocketSubject$client$initiated$error$$ClientInitiatedError(message, code) {
        this.message = message;
        if(code) {
            this.code = code;
        }
    }

    $$RxSocketSubject$client$initiated$error$$ClientInitiatedError.prototype = {
        constructor: $$RxSocketSubject$client$initiated$error$$ClientInitiatedError,

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
        code: $$RxSocketSubject$constants$$CLOSE_GENERIC
    };

    var $$RxSocketSubject$client$initiated$error$$default = $$RxSocketSubject$client$initiated$error$$ClientInitiatedError;

    var $$RxSocketSubject$create$$Subject = Rx.Subject;
    var $$RxSocketSubject$create$$Observable = Rx.Observable;
    var $$RxSocketSubject$create$$Observer = Rx.Observer;


    function $$RxSocketSubject$create$$create(endpoints, openObserver, errorObserver, closeObserver) {
        var socket;
        var outgoingQueue = [];
        var endpointIndex = 0;

        endpoints = Array.isArray(endpoints) ? endpoints : [endpoints];

        var observable = Rx.Observable.create(function(obs) {
            var endpoint = endpoints[endpointIndex++ % endpoints.length];

            socket = new $$RxSocketSubject$config$$default.WebSocket(endpoint);

            socket.onmessage = function(e) {
                obs.onNext(e);
            };

            socket.onclose = function(e){
                if(closeObserver) {
                    closeObserver.onNext(e);
                }
                obs.onCompleted();
            };

            socket.onerror = function(e){
                if(errorObserver) {
                    errorObserver.onNext(e);
                }
                obs.onError(e);
            };

            socket.onopen = function(e) {
                if(openObserver) {
                    openObserver.onNext(e);
                }
                while(outgoingQueue.length) {
                    var msg = outgoingQueue.shift();
                    socket.send(msg);
                }
            };

            return function() {
                socket.close();
            };
        }).retry().publish().refCount();

        var observer = Rx.Observer.create(function(msg) {
            if(socket.readyState === socket.OPEN) {
                socket.send(msg);
            } else {
                outgoingQueue.push(msg);
            }
        }, function(err) {
            if(socket) {
                var reason = 'unknown';
                var code = $$RxSocketSubject$constants$$CLOSE_GENERIC;
                if(typeof err === 'object') {
                    reason = err.message;
                    if(+err.code === +err.code) {
                        code = +err.code;
                    }
                } else if(typeof err === 'string') {
                    reason = err;
                } 

                socket.onerror(new ClientInitiatedError(reason, code));
                socket.close(code, reason);
            }
        }, function() {
            socket.close();
        });

        function ClientInitiatedError(msg, code) {
            this.message = msg;
            this.code = code || $$RxSocketSubject$constants$$CLOSE_GENERIC;
        }

        return $$RxSocketSubject$create$$Subject.create(observer, observable);
    }

    var rx$socket$subject$umd$$RxSocketSubject = {
        create: $$RxSocketSubject$create$$create,
        config: $$RxSocketSubject$config$$default,
        CLOSE_GENERIC: $$RxSocketSubject$constants$$CLOSE_GENERIC,
        ClientInitiatedError: $$RxSocketSubject$client$initiated$error$$default
    };

    /* global define:true module:true window: true */

    /**
        @namespace RxSocketSubject
    */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return rx$socket$subject$umd$$RxSocketSubject; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = rx$socket$subject$umd$$RxSocketSubject;
    } else if (typeof this !== 'undefined') {
      this['RxSocketSubject'] = rx$socket$subject$umd$$RxSocketSubject;
    }
}).call(this);

//# sourceMappingURL=rx-socket-subject.js.map