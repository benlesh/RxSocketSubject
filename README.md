# Maintenence Mode

This project is for RxJS 4 and under. Given that WebSocketSubject is part of RxJS 5 and up, it's advisable to use that instead. There will be no more features or major work going on with this repository.


RxSocketSubject
===============

[![Build Status](https://travis-ci.org/blesh/RxSocketSubject.svg?branch=master)](https://travis-ci.org/blesh/RxSocketSubject)

A more advanced web socket wrapper for RxJS

## Install

With bower:

```sh
bower install -S rx-socket-subject
```

With npm:

```sh
npm install -S rx-socket-subject
```

## Goals

The goals of this project is to produce an observable WebSocket implementation that meets a set of common
needs for projects I'm currently working on. RxJS-DOM has a fine WebSocket implementation, which I modelled the initial
work on this implementation off of. However, I need something that also does the following:

- Socket that will automatically reconnect itself.
- Socket that will automatically try additional endpoints.
- Has seperate hooks for open, close, and error.
- Will send proper close messages with WebSocket close codes to the server when `onError` is called.
- Will send a close command to the server when `onCompleted` is called.
- Will always force a single instance of a socket regardless of the number of subscriptions.
- Will buffer messages fed to it via `onNext` if the underlying socket isn't open, send them all when it does open.

## Basic Usage

```js
// create a socket subject
// at this point an underlying WebSocket has not yet been created
var socket = RxSocketSubject.create('ws://echo.websocket.org');

// use the socket subject as an Observer and send
// messages with onNext()
// even though the underlying socket still hasn't been created,
// the messages will be buffered until a socket is made and connected
socket.onNext('one');
socket.onNext('two');

// subscribing to the socket subject as an Observable
// will start the socket and connect.
socket.forEach(function(e) {
	console.log(e); // raw message events are emitted
});

setTimeout(function(){
  // while the socket is connected, onNext will send the message
  // immediately through it.
	socket.onNext('three');
}, 1000);
```


## Closing the socket

```js
var socket = RxSocketSubject.create('ws://echo.websocket.org');

var disposable = socket.forEach(function(e) {
  console.log(e.data);

	if(e.data === 'two') {
		// use onCompleted to gracefully close the socket
		socket.onCompleted();
	}
});

socket.onNext('one');
socket.onNext('two');
```

## Forcing an error close on the socket

There are some cases where you'll want to acknowledge what you've received from the
server was an error. With a normal web socket, this is generally done with `socket.close(code, reason)`.
RxSocketSubject allows for this by leveraging `onError` when the subject is used as an Observable.

More information about [WebSocket status codes can be found on MDN](https://developer.mozilla.org/en-US/docs/Web/API/CloseEvent#Status_codes).

```js
var socket = RxSocketSubject.create('ws://echo.websocket.org');

var disposable = socket.forEach(function(e) {
  console.log(e.data);

	if(e.data === 'bad data') {
		// use onError to emit an error and send a close
		// command to the server with a status code and reason:
		// The following will send a status code of 1008 (a generic error)
		// as well as a reason "bad data received"
		socket.onError('bad data received');
	}

	if(e.data === 'unparsable data') {
		// you can also specify a custom error code with the 
		// ClientInitiatedError class
		socket.onError(new RxSocketSubject.ClientInitiatedError('unable to parse data', 4001));
	}

	if(e.data === 'wat') {
		// or you can just onError
		socket.onError();
	}
});
```

### Using fallback endpoints

```js
// it's as simple as providing an array of endpoints to the `create()` method
// in order to have the socket fallback to another endpoint if connection fails
// or if an error closes the connection. The Subject will keep retrying each
// endpoint until one connects successfully

var socket = RxSocketSubject.create(['ws://benlesh.com/notreal', 'ws://benlesh.com/totallyfake', 'ws://echo.websocket.org']);
```
