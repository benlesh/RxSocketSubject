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
        toSocket.onError.bind(toSocket), 
        toSocket.onCompleted.bind(toSocket));

        var i = 0;
        var innerObservable;
        var hasInnerObservable = false;
        var getInnerObservable = function(){
            if(!hasInnerObservable) {
                innerObservable = $$RxSocketSubject$rx$socket$subject$$Observable.create(function(o) {
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

                                return $$RxSocketSubject$rx$socket$subject$$fromWebSocket(url, protocol, $$RxSocketSubject$rx$socket$subject$$Observer.create(function(e) {
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

        var observable = $$RxSocketSubject$rx$socket$subject$$Observable.create(function(o) {
            var disposable = getInnerObservable().subscribe(o);
            return disposable;
        });

        $$RxSocketSubject$rx$socket$subject$$AnonymousSubject.call(this, observer, observable);
    }

    $$RxSocketSubject$rx$socket$subject$$RxSocketSubject.prototype = $$utils$$extend(Object.create($$RxSocketSubject$rx$socket$subject$$AnonymousSubject.prototype), {
        constructor: $$RxSocketSubject$rx$socket$subject$$RxSocketSubject,

        /**
            Creates a function that will create a child observable from the RxSocketSubject

            Usage is as follows:

                        // set up an RxSocketSubject
                      var endpoints = Observable.just('ws://mysocketserver');
                        var socket = RxSocketSubject.create(endpoints);

                        // create a n observable factory
                        var fromTickerRequest = socket.multiplex(function(request) {
                            return function(data) {
                                return data.requestId === request.requestId;
                            }
                        });

                        // create a observables of multiplexed ticker data
                        var subNflx = { requestId: 1, subscribeTo: 'NFLX' };
                        var unsubNflx = { requestId: 1, unsubscribeFrom: 'NFLX' };
                        var netflixTickerData = fromTickerRequest(subNflx, unsubNflx);

                        var subGoog = { requestId: 2, subscribeTo: 'GOOG' };
                        var unsubGoog = { requestId: 2, unsubscribeFrom: 'GOOG' };
                        var googleTickerData = fromTickerRequest(subGoog, unsubGoog);

                        // subscribe to the ticker data
                        netflixTickerData.subscribe(function(responseData) {
                            console.log(responseData);
                        });

                        googleTickerData.subscribe(function(responseData) {
                            console.log(responseData);
                        });

            @method multiplex
            @param {Function} responseFilter a predicate to filter response messages that belong to the given multiplexed stream.
            @param {Object} [options] an optional hash of additional configuration options for the multiplexer. This
                includes configuration for serializing outbound messages and deserializing inbound messages.

                Defaults are as follows:

                            {
                                serializer: function(data) {
                                    return JSON.stringify(data);
                                },
                                deserializer: function(e) {
                                    return JSON.parse(e.data);
                                }
                            }

            @return {Function} a function to create an multiplexed socket observable from the current socket. This
                function accepts arguments for `subscriptionData` and `unsubscriptionData`.
        */
        multiplex: function (responseFilter, options) {
            var socket = this;

            var config = {
                serializer: function(data) {
                    return JSON.stringify(data);
                },
                deserializer: function(e) {
                    return JSON.parse(e.data);
                }
            };

            if(options) {
                $$utils$$extend(config, options);
            }

            return function multiplex(subscriptionData, unsubscriptionData) {
                return $$RxSocketSubject$rx$socket$subject$$Observable.create(function(obs) {
                    var message = config.serializer(subscriptionData);
                    socket.onNext(message);
                    var disposable = socket.map(config.deserializer).
                        filter(responseFilter(subscriptionData)).
                        subscribe(obs);

                    var multiplexUnsub = function() {
                        socket.onNext(config.serializer(unsubscriptionData));
                    };

                    return function() {
                        multiplexUnsub();
                        disposable.dispose();
                    }
                });
            }
        }
    });

    $$RxSocketSubject$rx$socket$subject$$RxSocketSubject.create = $$RxSocketSubject$rx$socket$subject$$create;

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
    function $$RxSocketSubject$rx$socket$subject$$create(connections, openObserver, errorObserver, closingObserver) {
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
    }

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