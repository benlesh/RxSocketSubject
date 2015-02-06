define(
    "RxSocketSubject/create",
    ["./constants", "./client-initiated-error", "./utils", "exports"],
    function(
        RxSocketSubject$constants$$,
        RxSocketSubject$client$initiated$error$$,
        RxSocketSubject$utils$$,
        __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var CLOSE_GENERIC;
        CLOSE_GENERIC = RxSocketSubject$constants$$["CLOSE_GENERIC"];
        var ClientInitiatedError;
        ClientInitiatedError = RxSocketSubject$client$initiated$error$$["default"];
        var extend;
        extend = RxSocketSubject$utils$$["extend"];

        var Subject = Rx.Subject;
        var Observable = Rx.Observable;
        var Observer = Rx.Observer;
        var fromWebSocket = Rx.DOM.fromWebSocket;
        var AnonymousSubject = Rx.AnonymousSubject;

        function RxSocketSubject(config) {
            var connections = this.connections = config.connections;
            var openObserver = this.openObserver = config.openObserver;
            var errorObserver = this.errorObserver = config.errorObserver;
            var closingObserver = this.closingObserver = config.closingObserver;

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
                var disposable = getInnerObservable().subscribe(o);
                return disposable;
            });

            AnonymousSubject.call(this, observer, observable);
        }

        RxSocketSubject.prototype = extend(Object.create(AnonymousSubject.prototype), {
            constructor: RxSocketSubject
        });

        RxSocketSubject.create = create;

        // more info about WebSocket close codes: 
        // https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes

        /**
            Creates a new Socket Subject. The socket subject is an observable of socket message events, as well
            as an observer of messages to send over the socket with `onNext()`, an a means to close the socket
            with `onCompleted()` or `onError()`.

            @method create
            @param connections {Rx.Observable} an observable of connection information, either endpoint URL strings,
                or objects with `{ url: someUrl, protocol: someProtocol }`.
            @param openObserver {Rx.Observer} [optional] an observer that will trigger
                when the underlying socket opens. Will never error or complete.
            @param errorObserver {Rx.Observer} [optional] an observer that emits errors occurring on the 
                socket. Will never error or complete.
            @param closingObserver {Rx.Observer} [optional] an obsesrver that emits when the socket is about to close.
        */
        function create(connections, openObserver, errorObserver, closingObserver) {
            var config;
            if(connections instanceof Observable) {
                console.warn('DEPRECATION: RxSocketSubject.create() should be called with a configuration object');
                config = {
                    connections: connections,
                    openObserver: openObserver,
                    errorObserver: errorObserver,
                    closingObserver: closingObserver
                };
            } else {
                config = connections;
            }
            return new RxSocketSubject(config);
        }

        __es6_export__("create", create);
    }
);

//# sourceMappingURL=create.js.map