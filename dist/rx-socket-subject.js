(function() {
    "use strict";
    function $$utils$$extend(a, b) {
        for(var key in b) {
            if(b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        
        return a;
    }

    function $$utils$$identity(x) {
        return x;
    }

    var $$multiplex$$Observable = Rx.Observable;
    var $$multiplex$$Subject = Rx.Subject;

    function $$multiplex$$multiplex(socket, options) {
        var config = {
            serializer: function(data) {
                return JSON.stringify(data);
            },
            deserializer: function(e) {
                return JSON.parse(e.data);
            },
            subscriberProxy: null,
            messageProxy: null
        };

        if(options) {
            $$utils$$extend(config, options);
        }

        var subscriptions;
        var unsubscriptions;
        var count = 0;
        var socketSubDisp;

        var subscribeSocket = function() {
            if(++count === 1) {
                subscriptions = new $$multiplex$$Subject();
                unsubscriptions = new $$multiplex$$Subject();

                var outgoing;

                if(config.subscriberProxy) {
                    outgoing = config.subscriberProxy($$multiplex$$Observable.merge(subscriptions.map(function(x) {
                        return { type: 'sub', value: x };
                    }), unsubscriptions.map(function(x) {
                        return { type: 'unsub', value: x };
                    })));
                } else {
                    outgoing = $$multiplex$$Observable.merge(subscriptions, unsubscriptions);
                }

                socketSubDisp = outgoing.map(config.serializer).subscribe(socket);
            }
        };

        var unsubscribeSocket = function(){
            if(--count === 0) {
                socketSubDisp.dispose();
            }
        };

        return function multiplex(subscriptionData, unsubscriptionData, responseFilter) {
            if(!responseFilter && !config.responseFilter) {
                throw 'no response filter provided';
            }
            
            responseFilter = responseFilter || config.responseFilter(subscriptionData);
            
            return $$multiplex$$Observable.create(function(obs) {
                subscribeSocket();
                subscriptions.onNext(subscriptionData);

                var incoming = config.messageProxy ? config.messageProxy(socket) : socket;
                var disposable = incoming.map(config.deserializer).
                    filter(responseFilter).
                    subscribe(obs);

                var multiplexUnsub = function() {
                    unsubscriptions.onNext(unsubscriptionData);
                };

                return function() {
                    multiplexUnsub();
                    unsubscribeSocket();
                    disposable.dispose();
                };
            });
        };
    }
    var $$multiplex$$default = $$multiplex$$multiplex;

    var $$RxSocketSubject$rx$socket$subject$$Subject = Rx.Subject;
    var $$RxSocketSubject$rx$socket$subject$$Observable = Rx.Observable;
    var $$RxSocketSubject$rx$socket$subject$$Observer = Rx.Observer;
    var $$RxSocketSubject$rx$socket$subject$$fromWebSocket = Rx.DOM.fromWebSocket;
    var $$RxSocketSubject$rx$socket$subject$$AnonymousSubject = Rx.AnonymousSubject;

    function $$RxSocketSubject$rx$socket$subject$$RxSocketSubject(config) {
        var connections = this.connections = config.connections;
        var openObserver = this.openObserver = config.openObserver;
        var errorObserver = this.errorObserver = config.errorObserver;
        var closingObserver = this.closingObserver = config.closingObserver;

        var observer = new $$RxSocketSubject$rx$socket$subject$$Subject();
        var toSocket = new $$RxSocketSubject$rx$socket$subject$$Subject();
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
                toSocket = new $$RxSocketSubject$rx$socket$subject$$Subject();
                innerObservable = connections.map(function(conn) {
                    return (typeof conn === 'string') ? { url: conn, protocol: null } : conn;
                }).flatMapLatest(function(conn) {
                    return $$RxSocketSubject$rx$socket$subject$$Observable.create(function(o) {

                        var closingProxyObserver = closingObserver ? 
                            Rx.Observer.create(function(e) {
                                closingObserver.onNext(e);
                            }) :
                            undefined;

                        var socket = $$RxSocketSubject$rx$socket$subject$$fromWebSocket(conn.url, conn.protocol, $$RxSocketSubject$rx$socket$subject$$Observer.create(function(e) {
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

        var observable = $$RxSocketSubject$rx$socket$subject$$Observable.create(function(o) {
            var disposable = getInnerObservable().subscribe(o);
            return disposable;
        });

        $$RxSocketSubject$rx$socket$subject$$AnonymousSubject.call(this, observer, observable);
    }

    $$RxSocketSubject$rx$socket$subject$$RxSocketSubject.prototype = $$utils$$extend(Object.create($$RxSocketSubject$rx$socket$subject$$AnonymousSubject.prototype), {
        constructor: $$RxSocketSubject$rx$socket$subject$$RxSocketSubject,
        multiplex: function(responseFilter, options) {
            return $$multiplex$$default(this, responseFilter, options);
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
    $$RxSocketSubject$rx$socket$subject$$RxSocketSubject.create = function(connections, openObserver, errorObserver, closingObserver) {
        var config;
        if(connections instanceof $$RxSocketSubject$rx$socket$subject$$Observable) {
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
        return new $$RxSocketSubject$rx$socket$subject$$RxSocketSubject(config);
    };

    $$RxSocketSubject$rx$socket$subject$$RxSocketSubject.multiplex = $$multiplex$$default;

    var $$RxSocketSubject$rx$socket$subject$$default = $$RxSocketSubject$rx$socket$subject$$RxSocketSubject;
    var $$rx$socket$subject$$default = $$RxSocketSubject$rx$socket$subject$$default;

    /* global define:true module:true window: true */

    /**
        @namespace RxSocketSubject
    */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return $$rx$socket$subject$$default; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = $$rx$socket$subject$$default;
    } else if (typeof this !== 'undefined') {
      this['RxSocketSubject'] = $$rx$socket$subject$$default;
    }
}).call(this);

//# sourceMappingURL=rx-socket-subject.js.map