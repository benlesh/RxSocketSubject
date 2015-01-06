define(
    "RxSocketSubject/create",
    ["./constants", "./client-initiated-error", "./from-web-socket-fill", "exports"],
    function(
        RxSocketSubject$constants$$,
        RxSocketSubject$client$initiated$error$$,
        RxSocketSubject$from$web$socket$fill$$,
        __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var CLOSE_GENERIC;
        CLOSE_GENERIC = RxSocketSubject$constants$$["CLOSE_GENERIC"];
        var ClientInitiatedError;
        ClientInitiatedError = RxSocketSubject$client$initiated$error$$["default"];
        var fromWebSocket;
        fromWebSocket = RxSocketSubject$from$web$socket$fill$$["fromWebSocket"];

        var Subject = Rx.Subject;
        var Observable = Rx.Observable;
        var Observer = Rx.Observer;


        function create(endpoints, openObserver, errorObserver, closingObserver, closedObserver) {
            var observer = new Subject();
            var toSocket = new Subject();
            var msgBuffer = [];
            var isOpen = false;

            var socketOpen = function(e) {
                isOpen = true;

                if(openObserver) {
                    openObserver.onNext(e);
                }

                while(msgBuffer.length > 0) {
                    var msg = msgBuffer.shift();
                    toSocket.onNext(msg);
                }
            };

            var socketClosed = function() {
                isOpen = false;
            };

          // subscribe to outward facing observer
          // and buffer messages if necessary
          var subjectDisposable = observer.subscribe(function(msg) {
                if(isOpen) {
                    toSocket.onNext(msg);
                } else {
                    msgBuffer.push(msg);
                }
            }, function(err) {
                toSocket.onError(err);
            }, function() {
                toSocket.onCompleted();
            });

            var i = 0;
            var observable = Observable.create(function(o) {
                var endpoint = Array.isArray(endpoints) ? endpoints[i++ % endpoints.length] : endpoints;

                var socket = fromWebSocket(endpoint, null, Observer.create(function(e) {
                    socketOpen(e);
                }), closingObserver);

                var disposable = new Rx.CompositeDisposable(
              socket.subscribe(function(e) {
                        o.onNext(e);
                    }, function(err) {
                        if(errorObserver) {
                            errorObserver.onNext(err);
                        }
                        socketClosed();
                        o.onError(err);
                    }, function() {
                        if(closedObserver) {
                            closedObserver.onNext();
                        }
                        socketClosed();
                        o.onCompleted();
                    }),

                    toSocket.subscribe(socket)
              );

              return function(){
                socketClosed();
                disposable.dispose();
              };
            }).retry().publish().refCount();

            var socketSubject = Subject.create(observer, observable);

            var dispose = socketSubject.dispose;

            socketSubject.dispose = function() {
                toSocket.dispose();
                subjectDisposable.dispose();
                return dispose();
            };

            return socketSubject;
        }
        __es6_export__("create", create);
    }
);

//# sourceMappingURL=create.js.map