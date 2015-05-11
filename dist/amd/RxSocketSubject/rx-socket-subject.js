define(
    "RxSocketSubject/rx-socket-subject",
    ["./utils", "./multiplex", "exports"],
    function(RxSocketSubject$utils$$, RxSocketSubject$multiplex$$, __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var extend;
        extend = RxSocketSubject$utils$$["extend"];
        var identity;
        identity = RxSocketSubject$utils$$["identity"];
        var multiplex;
        multiplex = RxSocketSubject$multiplex$$["default"];

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
            function(err) {
                if(toSocket) {
                    toSocket.onError(err);
                }
            }, 
            function(){
                if(toSocket) {
                    toSocket.onCompleted();
                }
            });

            var i = 0;
            var innerObservable;
            var hasInnerObservable = false;
            var getInnerObservable = function(){
                if(!hasInnerObservable) {
                    toSocket = new Subject();
                    innerObservable = connections.map(function(conn) {
                        return (typeof conn === 'string') ? { url: conn, protocol: null } : conn;
                    }).flatMapLatest(function(conn) {
                        return Observable.create(function(o) {

                            var closingProxyObserver = closingObserver ? 
                                Rx.Observer.create(function(e) {
                                    closingObserver.onNext(e);
                                }) :
                                undefined;

                            var socket = fromWebSocket(conn.url, conn.protocol, Observer.create(function(e) {
                                socketOpen(e);
                            }), closingProxyObserver);

                            return new Rx.CompositeDisposable(
                          socket['catch'](function(err) {
                            if(errorObserver) {
                                errorObserver.onNext(err);
                            }
                            throw err;
                          })['finally'](function(){
                            socketClosed();
                          }).subscribe(o),

                                toSocket.subscribe(socket))
                        });
                    })['finally'](function(){
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
            constructor: RxSocketSubject,
            multiplex: function(responseFilter, options) {
                return multiplex(this, responseFilter, options);
            }
        });

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
        RxSocketSubject.create = function(connections, openObserver, errorObserver, closingObserver) {
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
        };

        RxSocketSubject.multiplex = multiplex;

        __es6_export__("default", RxSocketSubject);
    }
);

//# sourceMappingURL=rx-socket-subject.js.map