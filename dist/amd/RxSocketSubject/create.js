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


        function create(connections, openObserver, errorObserver, closingObserver) {
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
          observer.subscribe(function(msg) {
                if(isOpen) {
                    toSocket.onNext(msg);
                } else {
                    msgBuffer.push(msg);
                }
            }, 
            toSocket.onError.bind(toSocket), 
            toSocket.onCompleted.bind(toSocket));

            var i = 0;
            var innerObservable;
            var hasInnerObservable = false;
            var getInnerObservable = function(){
                if(!hasInnerObservable) {
                    innerObservable = Observable.create(function(o) {
                        var dy = new Rx.SerialDisposable();

                        var disposable = new Rx.CompositeDisposable(dy,
                                connections.map(function(conn) {
                                    var url;
                                    var protocol = null;
                                    if(typeof conn === 'string') {
                                        url = conn;
                                    }
                                    else if(conn && conn.url) {
                                        url = conn.url;
                                        protocol = conn.protocol;
                                    }

                                    return fromWebSocket(url, protocol, Observer.create(function(e) {
                                        socketOpen(e);
                                    }), closingObserver);
                                }).subscribe(function(socket) {
                                    if(dy && !dy.isDisposed) {
                                        dy.setDisposable(new Rx.CompositeDisposable(
                                      socket.subscribe(function(e) {
                                                o.onNext(e);
                                            }, function(err) {
                                                if(errorObserver) {
                                                    errorObserver.onNext(err);
                                                }
                                                socketClosed();
                                                o.onError(err);
                                            }, function() {
                                                socketClosed();
                                                o.onCompleted();
                                            }),

                                            toSocket.subscribe(socket)
                                      ));
                                    }
                                },
                                o.onError.bind(o))
                        );

                      return function(){
                        socketClosed();
                        if(disposable && !disposable.isDisposed) {
                            disposable.dispose();
                          }
                      };
                    }).finally(function(){
                        hasInnerObservable = false;
                    }).publish().refCount();

                    hasInnerObservable = true;
                }

                return innerObservable;
            };

            var observable = Observable.create(function(o) {
                return getInnerObservable().subscribe(o);
            });

            return Subject.create(observer, observable);
        }
        __es6_export__("create", create);
    }
);

//# sourceMappingURL=create.js.map