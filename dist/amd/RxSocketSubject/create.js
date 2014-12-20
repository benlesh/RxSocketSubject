define(
    "RxSocketSubject/create",
    ["./config", "./constants", "./client-initiated-error", "exports"],
    function(
        RxSocketSubject$config$$,
        RxSocketSubject$constants$$,
        RxSocketSubject$client$initiated$error$$,
        __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var config;
        config = RxSocketSubject$config$$["default"];
        var CLOSE_GENERIC;
        CLOSE_GENERIC = RxSocketSubject$constants$$["CLOSE_GENERIC"];
        var ClientInitiatedError;
        ClientInitiatedError = RxSocketSubject$client$initiated$error$$["default"];

        var Subject = Rx.Subject;
        var Observable = Rx.Observable;
        var Observer = Rx.Observer;


        function create(endpoints, openObserver, errorObserver, closeObserver) {
            var socket;
            var outgoingQueue = [];
            var endpointIndex = 0;

            endpoints = Array.isArray(endpoints) ? endpoints : [endpoints];

            var observable = Rx.Observable.create(function(obs) {
                var endpoint = endpoints[endpointIndex++ % endpoints.length];

                socket = new config.WebSocket(endpoint);

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
                    var code = CLOSE_GENERIC;
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
                this.code = code || CLOSE_GENERIC;
            }

            return Subject.create(observer, observable);
        }
        __es6_export__("create", create);
    }
);

//# sourceMappingURL=create.js.map