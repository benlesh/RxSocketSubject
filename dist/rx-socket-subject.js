(function() {
    "use strict";
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
    var $$RxSocketSubject$create$$fromWebSocket = Rx.DOM.fromWebSocket;

    function $$RxSocketSubject$create$$create(connections, openObserver, errorObserver, closingObserver) {
        var observer = new $$RxSocketSubject$create$$Subject();
        var toSocket = new $$RxSocketSubject$create$$Subject();
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
                innerObservable = $$RxSocketSubject$create$$Observable.create(function(o) {
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

                                return $$RxSocketSubject$create$$fromWebSocket(url, protocol, $$RxSocketSubject$create$$Observer.create(function(e) {
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

        var observable = $$RxSocketSubject$create$$Observable.create(function(o) {
            var disposable = getInnerObservable().subscribe(o);
            return disposable;
        });

        return $$RxSocketSubject$create$$Subject.create(observer, observable);
    }

    var rx$socket$subject$umd$$RxSocketSubject = {
        create: $$RxSocketSubject$create$$create,
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