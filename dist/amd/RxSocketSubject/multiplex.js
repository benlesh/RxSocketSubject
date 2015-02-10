define(
    "RxSocketSubject/multiplex",
    ["./utils", "exports"],
    function(RxSocketSubject$utils$$, __exports__) {
        "use strict";

        function __es6_export__(name, value) {
            __exports__[name] = value;
        }

        var extend;
        extend = RxSocketSubject$utils$$["extend"];

        var Observable = Rx.Observable;
        var Subject = Rx.Subject;

        function multiplex(socket, responseFilter, options) {
            var config = {
                serializer: function(data) {
                    return JSON.stringify(data);
                },
                deserializer: function(e) {
                    return JSON.parse(e.data);
                },
                subscriberProxy: null,
                messageProxy: null,
            };

            if(options) {
                extend(config, options);
            }

            var subscriptions;
            var unsubscriptions;
            var count = 0;
            var socketSubDisp;

            var subscribeSocket = function() {
                if(++count === 1) {
                    subscriptions = new Subject();
                    unsubscriptions = new Subject();

                    var outgoing;

                    if(config.subscriberProxy) {
                        outgoing = config.subscriberProxy(Observable.merge(subscriptions.map(function(x) {
                            return { type: 'sub', value: x };
                        }), unsubscriptions.map(function(x) {
                            return { type: 'unsub', value: x };
                        })));
                    } else {
                        outgoing = Observable.merge(subscriptions, unsubscriptions);
                    }

                    socketSubDisp = outgoing.map(config.serializer).subscribe(socket);
                }
            };

            var unsubscribeSocket = function(){
                if(--count === 0) {
                    socketSubDisp.dispose();
                }
            };

            return function multiplex(subscriptionData, unsubscriptionData) {
                return Observable.create(function(obs) {
                    subscribeSocket();
                    subscriptions.onNext(subscriptionData);

                    var incoming = config.messageProxy ? config.messageProxy(socket) : socket;
                    var disposable = incoming.map(config.deserializer).
                        filter(responseFilter(subscriptionData)).
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
        __es6_export__("default", multiplex);
    }
);

//# sourceMappingURL=multiplex.js.map