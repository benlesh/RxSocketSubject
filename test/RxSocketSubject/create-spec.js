MockSocket.OPEN = 1;

describe('RxSocketSubject.create()', function(){
	var originalWebSocket;
	var disposable;

	beforeEach(function(){
		originalWebSocket = window.WebSocket;
		window.WebSocket = MockSocket;
	});

	afterEach(function(){
		if(disposable) {
			disposable.dispose();
		}
		while(sockets.length) {
			sockets.shift();
		}
		window.WebSocket = originalWebSocket;
	});


	it('should exist', function(){
		expect(typeof RxSocketSubject.create).toBe('function');
	});

	it('should create a Subject', function() {
		var socketSubject = RxSocketSubject.create('');
		expect(typeof socketSubject.observer !== 'undefined' && typeof socketSubject.observable !== 'undefined').toBe(true);
	});

	it('should accept an openObserver argument', function(done){
		var openObserver = Rx.Observer.create(function(e) {
			done();
		});

		var socketSubject = RxSocketSubject.create('', openObserver);

		disposable = socketSubject.forEach(function(){});

		sendOpen();
	});


	it('should accept an errorObserver argument', function(done){
		var called = false;

		var errorObserver = Rx.Observer.create(function(e) {
			done();
		});

		var socketSubject = RxSocketSubject.create('', undefined, errorObserver);

		disposable = socketSubject.forEach(function(){});

		sendError('err');
	});


	it('should accept a closeObserver argument', function(done) {
		var closedObserver = Rx.Observer.create(function() {
			done();
		});

		var socketSubject = RxSocketSubject.create('', undefined, undefined, undefined, closedObserver);

		disposable = socketSubject.forEach(function(){});

		sendClose();
	});

	describe('the returned subject', function() {
		it('should create one socket, and close the socket when all subscribed observables are complete', function(){
			var socketSubject = RxSocketSubject.create('');
			var disp1 = socketSubject.forEach(function(){});
			var disp2 = socketSubject.forEach(function(){});

			expect(sockets.length).toBe(1);

			var socket = sockets[0];

			disp1.dispose();
			expect(socket.close).not.toHaveBeenCalled();

			disp2.dispose();
			expect(socket.close).toHaveBeenCalled();
		});

		it('should create a WebSocket with the passed endpoint on subcription', function(){
			var socketSubject = RxSocketSubject.create('ws://test.com');
			disposable = socketSubject.forEach(function(x) {});
			expect(sockets[0].url).toBe('ws://test.com');
		});

		it('should provide a stream of messages from the socket and complete on close', function(done){
			var socketSubject = RxSocketSubject.create('ws://test.com');
			var results = [];

			disposable = socketSubject.forEach(function(x) {
				results.push(x);
			}, function(e){
				expect(true).toBe(false); //ghetto? yes.
				done();
			}, function(){
				expect(results.map(function(e) {
					return e.data;
				})).toEqual(['one', 'two', 'three']);
				done();
			});
			
			sendMessage('one');
			sendMessage('two');
			sendMessage('three');
			sendClose();
		});

		it('should accept an array of endpoints, and iterate through them if the socket errors', function() {
			var endpoints = ['ws://bad1', 'ws://bad2', 'ws://good', 'ws://toofar'];

			var socketSubject = RxSocketSubject.create(endpoints);

			disposable = socketSubject.forEach(function() {});

			var i, len;
			for(i = 0, len = endpoints.length; i < len; i++) {
				expect(sockets[0].url).toBe(endpoints[i]);
				sendError();
			}
		});

		describe('onNext', function() {	
			it('should buffer messages if no socket exists yet', function(){var socket;
				var socketSubject = RxSocketSubject.create('');

				socketSubject.onNext('one');
				socketSubject.onNext('two');
				socketSubject.onNext('three');

				disposable = socketSubject.subscribe(function(){});
				var socket = sockets[0];
				
				expect(socket.send.calls.all().length).toBe(0);

				sendOpen();

				expect(socket.send.calls.all()).toEqual([
					{ object: socket, args: ['one'] },
					{ object: socket, args: ['two'] },
					{ object: socket, args: ['three'] }
				]);
			});

			it('should buffer messages AGAIN if the underlying socket has been closed because the observable has been disposed', function(){
				var socketSubject = RxSocketSubject.create('');

				var disp1 = socketSubject.subscribe(function(){});

				var socket = sockets[0];
				
				expect(socket.send.calls.all().length).toBe(0);
				sendOpen();

				disp1.dispose();

				socketSubject.onNext('one');
				socketSubject.onNext('two');
				socketSubject.onNext('three');

				disposable = socketSubject.subscribe(function(){});
				
				// get the socket again, because the dispose killed the other one.
				socket = sockets[0];

				expect(socket.send.calls.all().length).toBe(0);
				sendOpen();

				expect(socket.send.calls.all()).toEqual([
					{ object: socket, args: ['one'] },
					{ object: socket, args: ['two'] },
					{ object: socket, args: ['three'] }
				]);
			});

			it('should send a message to the socket when it is called and the socket is OPEN', function() {
				var socketSubject = RxSocketSubject.create('');
				
				disposable = socketSubject.forEach(function(){});

				sendOpen();

				socketSubject.onNext('hello');

				var socket = sockets[0];

				expect(socket.send).toHaveBeenCalledWith('hello');
			});
		});

	 	describe('onError', function(){
		  it('should call socket.close(1008, string) when called with a string', function(){
				var socketSubject = RxSocketSubject.create('');

				disposable = socketSubject.forEach(function(){});

				var socket = sockets[0];

				socketSubject.onError('boop.');

				expect(socket.close).toHaveBeenCalledWith(RxSocketSubject.CLOSE_GENERIC, 'boop.');
			});


		  it('should call socket.close(e.code, e.message) when called with a ClientInitiatedError', function(){
				var socketSubject = RxSocketSubject.create('');

				disposable = socketSubject.forEach(function(){});

				var socket = sockets[0];

				socketSubject.onError(new RxSocketSubject.ClientInitiatedError('boop.', 4002));

				expect(socket.close).toHaveBeenCalledWith(4002, 'boop.');
			});


		  it('should call socket.close(4003, "shazbot") when called with a { code: 4003, message: "shazbot" }', function(){
				var socketSubject = RxSocketSubject.create('');

				disposable = socketSubject.forEach(function(){});

				var socket = sockets[0];

				socketSubject.onError({ code: 4003, message: 'shazbot' });

				expect(socket.close).toHaveBeenCalledWith(4003, 'shazbot');
			});
		});

	 	describe('onCompleted', function() {
			it('should call socket.close() when called with no arguments', function(){
				var socketSubject = RxSocketSubject.create('', undefined, undefined, undefined);

				disposable = socketSubject.forEach(function(){});

				var socket = sockets[0];

				socketSubject.onCompleted();

				expect(socket.close).toHaveBeenCalledWith();
			});
		});

		describe('when subscribe or forEach is called', function(){
			it('should create a socket', function(){
				var socketSubject = RxSocketSubject.create('');

				expect(sockets.length).toBe(0);

				disposable = socketSubject.forEach(function(){});

				expect(sockets.length).toBe(1);
			});

			describe('more than once', function() {
				it('should only create one socket', function(){
					var socketSubject = RxSocketSubject.create('');

					disposable = new Rx.CompositeDisposable(
						socketSubject.forEach(function(){}),
						socketSubject.forEach(function(){})
					);

					expect(sockets.length).toBe(1);
				});
			});
	 	});
	});
});

var sockets = [];

function sendOpen() {
	sockets.forEach(function(socket) {
		socket.readyState = 1;
		socket.dispatchEvent(createEvent(socket, 'open'));
	});
}


function sendMessage(data) {
	sockets.forEach(function(socket) {
		socket.dispatchEvent(createEvent(socket, 'message', { data: data }));
	});
}


function sendClose(code, reason) {
	sockets.forEach(function(socket) {
		socket.readyState = 3;
		socket.dispatchEvent(createEvent(socket, 'close', { code: code, reason: reason }));
	});
}

function sendError(err) {
	sockets.forEach(function(socket) {
		socket.readyState = 3;
		socket.dispatchEvent(createEvent(socket, 'error'));
	});
}

function MockSocket(url, prototype) {
	this.url = url;
	this.prototype = prototype;

	sockets.push(this);

 	var handlers = {};

	this.addEventListener = jasmine.createSpy('addEventListener').and.callFake(function(name, handler) {
		handlers[name] = handlers[name] || [];
		handlers[name].push(handler);
	});

	this.removeEventListener = jasmine.createSpy('removeEventListener').and.callFake(function(name, handler) {
		handlers[name] = handlers[name] || [];
		handlers[name].splice(handlers[name].indexOf(handler), 1);
	});

	this.dispatchEvent = function(evt) {
		var handler = handlers[evt.type];
		if(handler) {
			handler.forEach(function(fn) {
				fn.call(this, evt)
			});
		}
	};

	this.send = jasmine.createSpy('send');

	var self = this;
	this.close = jasmine.createSpy('close').and.callFake(function(){
		sockets.splice(sockets.indexOf(self), 1);
	});
}


// up yours, PhantomJS 1.9
function createEvent(target, name, data) {
	var evt = {
		type: name,
		target: target,
	};

	if(data) {
		for(var key in data) {
			if(data.hasOwnProperty(key)) {
				evt[key] = data[key];
			}
		}
	}

	return evt;
}