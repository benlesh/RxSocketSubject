# RxSocketSubject Documentation




## RxSocketSubject Class

The RxSocketSubject extends Rx.AnonymousSubject. As a subject, it is both an Observable and an Observer. 

As an Observer:

- It observes messages to be sent over the socket. These messages should already be in the proper format (usually strings). If the socket is not yet open, it will buffer these messages until the socket is open, and then send them.
- Observed errors will call close on the socket in an errored state.
- Observed completions will close the socket gracefully.

As an Observable:

- It emits a stream of message events that have arrived over the underlying socket.
- The underlying socket will not be created until subscribed to.
- Regardless of the number of subscribers, it will create one and only one underlying socket.
- The socket will close cleanly when there are no more subscribers.
- It can be resubscribed to even after completion (unlike ordinary publish().refCount() observables).

### Instance methods

#### constructor

`new RxSocketSubject(config)`

- config {Object} the configuration for this socket subject 
	- connections {Rx.Observable} an observable stream of connections. Either a stream of endpoint strings (i.e. `[..."ws://echo.websocket.org"..."ws://sample.com"...]`) or a stream of objects with a `url` and `protocol` property for more advanced connection configuration.
	- openObserver {Rx.Observer}  an observer that will be notified on each socket open event.
	- errorObserver {Rx.Observer} an observer that will be notified on each socket error event.
	- closingObserver {Rx.Observer} an observer that will be notified before the socket is closed.
	- closeObserver {Rx.Observer} an observer that will be notified when the socket is closed.

Returns a new socket subject but does not create the underlying socket connection. That does not happen until subscription.

**example**

```js
var socketSubject = new RxSocketSubject({
	connections: Observable.just('ws://echo.websocket.org'),
});
```

#### onNext

`socketSubject.onNext(message)`

- message {String} the message to send over the socket.

Sends, or queues a message to be sent, over the underlying socket.

#### onError

`socketSubject.onError(error)`

- error {String|Object} a string with a reason to close the socket. Optionally an object can be used with both a reason and a code (e.g. `{ code: 4001, reason: 'bad juju' }`);

Closes the socket with an error code and reason.

#### onCompleted

`socketSubject.onCompleted()`

Closes the socket cleanly

#### multiplex

`socketSubject.multiplex(config)`

### Static methods

#### create

#### multiplex
