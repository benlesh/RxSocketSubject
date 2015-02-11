import { extend } from './utils';

var Observable = Rx.Observable;
var Subject = Rx.Subject;

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
	@param {RxSocketSubject} socket the RxSocketSubject to multiplex over
	@param {Object} a hash of configuration options for the multiplexer. This
		includes configuration for serializing outbound messages and deserializing inbound messages.

		Defaults are as follows:

					{
						responseFilter: null,
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
export default function multiplex(socket, options) {
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

	return function multiplex(subscriptionData, unsubscriptionData, responseFilter) {
		responseFilter = responseFilter || config.responseFilter;
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
};