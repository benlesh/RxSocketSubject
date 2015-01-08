import { CLOSE_GENERIC } from './constants';
import ClientInitiatedError from './client-initiated-error';
import { fromWebSocket } from './from-web-socket-fill';

var Subject = Rx.Subject;
var Observable = Rx.Observable;
var Observer = Rx.Observer;


// more info about WebSocket close codes: 
// https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes

/**
	Creates a new Socket Subject. The socket subject is an observable of socket message events, as well
	as an observer of messages to send over the socket with `onNext()`, an a means to close the socket
	with `onCompleted()` or `onError()`.

	@method create
	@param endpoints {String|Array} a single endpoint string 
		or an array of endpoint strings to fallback on
	@param openObserver {Rx.Observer} [optional] an observer that will trigger
		when the underlying socket opens. Will never error or complete.
	@param errorObserver {Rx.Observer} [optional] an observer that emits errors occurring on the 
		socket. Will never error or complete.
	@param closingObserver {Rx.Observer} [optional] an obsesrver that emits when the socket is about to close.
	@param closedObserver {Rx.Observer} [optional] an observer of close events for the underlying socket.
	@param retry {Number} [optional] the number of times to retry the socket connection and cycle endpoints
		Will never error or complete.
*/
export function create(endpoints, openObserver, errorObserver, closingObserver, closedObserver, retry) {
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
			innerObservable = Observable.create(function(o) {
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
			}).retry(retry)
			.doOnCompleted(function(){
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
