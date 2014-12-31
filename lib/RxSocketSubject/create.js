import config from './config';
import { CLOSE_GENERIC } from './constants';
import ClientInitiatedError from './client-initiated-error';

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
	@param closeObserver {Rx.Observer} [optional] an observer of close events for the underlying socket.
		Will never error or complete.
*/
export function create(endpoints, openObserver, errorObserver, closeObserver) {
	var socket;
	var outgoingQueue = [];
	var endpointIndex = 0;

	endpoints = Array.isArray(endpoints) ? endpoints : [endpoints];

	var observable = Rx.Observable.create(function(obs) {
		var endpoint = endpoints[endpointIndex++ % endpoints.length];

		socket = new config.WebSocket(endpoint);

		socket.onmessage = function(e) {
			obs.onNext(e);
		};

		socket.onclose = function(e){
			if(closeObserver) {
				closeObserver.onNext(e);
			}
			obs.onCompleted();
		};

		socket.onerror = function(e){
			if(errorObserver) {
				errorObserver.onNext(e);
			}
			obs.onError(e);
		};

		socket.onopen = function(e) {
			if(openObserver) {
				openObserver.onNext(e);
			}
			while(outgoingQueue.length) {
				var msg = outgoingQueue.shift();
				socket.send(msg);
			}
		};

		return function() {
			socket.close();
		};
	}).retry().publish().refCount();

	var observer = Rx.Observer.create(function(msg) {
		if(socket.readyState === socket.OPEN) {
			socket.send(msg);
		} else {
			outgoingQueue.push(msg);
		}
	}, function(err) {
		if(socket) {
			var reason = 'unknown';
			var code = CLOSE_GENERIC;
			if(typeof err === 'object') {
				reason = err.message;
				if(+err.code === +err.code) {
					code = +err.code;
				}
			} else if(typeof err === 'string') {
				reason = err;
			} 

			socket.onerror(new ClientInitiatedError(reason, code));
			socket.close(code, reason);
		}
	}, function() {
		socket.close();
	});

	function ClientInitiatedError(msg, code) {
		this.message = msg;
		this.code = code || CLOSE_GENERIC;
	}

	return Subject.create(observer, observable);
}