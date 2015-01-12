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
    function $$from$web$socket$fill$$fromWebSocket(url, protocol, openObserver, closingObserver) {
        if (!window.WebSocket) { throw new TypeError('WebSocket not implemented in your runtime.'); }

        var WebSocket = window.WebSocket;

        var socket;

        var socketClose = function(code, reason) {
          if(socket) {
            if(closingObserver) {
              closingObserver.onNext();
              closingObserver.onCompleted();
            }
            if(!code) {
              socket.close();
            } else {
              socket.close(code, reason);
            }
          }
        };

        var observable = new Rx.AnonymousObservable(function (obs) {
          socket = protocol ? new WebSocket(url, protocol) : new WebSocket(url);

          var openHandler = function(e) {
            openObserver.onNext(e);
            openObserver.onCompleted();
            socket.removeEventListener('open', openHandler, false);
          };
          var messageHandler = function(e) { obs.onNext(e); };
          var errHandler = function(err) { obs.onError(err); };
          var closeHandler = function(e) { 
            if(!e.wasClean || e.code !== 1000) {
              obs.onError(e);
            }
            obs.onCompleted(); 
          };

          openObserver && socket.addEventListener('open', openHandler, false);
          socket.addEventListener('message', messageHandler, false);
          socket.addEventListener('error', errHandler, false);
          socket.addEventListener('close', closeHandler, false);

          return function () {
            socketClose();

            socket.removeEventListener('message', messageHandler, false);
            socket.removeEventListener('error', errHandler, false);
            socket.removeEventListener('close', closeHandler, false);
          };
        });

        var observer = Rx.Observer.create(function (data) {
          socket.readyState === WebSocket.OPEN && socket.send(data);
        },
        function(e) {
          var reason = 'unknown reason';
          var code = 1008; //generic error code
          if(typeof e === 'string') {
            reason = e;
          }
          else if(typeof e === 'object') {
            reason = e.reason || e.message;
            code = e.code || code;
          }
          socketClose(code, reason);
        },
        socketClose);

        return Rx.Subject.create(observer, observable);
      }

    var $$RxSocketSubject$create$$Subject = Rx.Subject;
    var $$RxSocketSubject$create$$Observable = Rx.Observable;
    var $$RxSocketSubject$create$$Observer = Rx.Observer;


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
        }, function(err) {
            toSocket.onError(err);
        }, function() {
            toSocket.onCompleted();
        });

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

                            return $$from$web$socket$fill$$fromWebSocket(url, protocol, $$RxSocketSubject$create$$Observer.create(function(e) {
                                socketOpen(e);
                            }), closingObserver);
                        }).subscribe(function(socket) {
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
                        })
                    );

                  return function(){
                    socketClosed();
                    disposable.dispose();
                  };
                })['do'](function(){}, 
                function(){
                    hasInnerObservable = false;
                },
                function(){
                    hasInnerObservable = false;
                }).publish().refCount();

                hasInnerObservable = true;
            }

            return innerObservable;
        };

        var observable = $$RxSocketSubject$create$$Observable.create(function(o) {
            return getInnerObservable().subscribe(o);
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