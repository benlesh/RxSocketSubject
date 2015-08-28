MockSocket.OPEN = 1;
var Observable = Rx.Observable;

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
		var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));
		expect(typeof socketSubject.observer !== 'undefined' && typeof socketSubject.observable !== 'undefined').toBe(true);
	});

	it('should accept an openObserver argument', function(done){
		var openObserver = Rx.Observer.create(function(e) {
			done();
		});

		var socketSubject = RxSocketSubject.create(Rx.Observable.just(''), openObserver);

		disposable = socketSubject.subscribe(function(){});

		sendOpen();
	});

	it('should pass through connections errors', function(done){
		var socketSubject = RxSocketSubject.create(Rx.Observable.throw('wat'));

		disposable = socketSubject.subscribe(function(){}, function(err) { 
			expect(err).toBe('wat');
			done();
		});
	});
	
	it('should accept an errorObserver argument', function(done){
		var called = false;

		var errorObserver = Rx.Observer.create(function(e) {
			done();
		});

		var socketSubject = RxSocketSubject.create(Rx.Observable.just(''), undefined, errorObserver);

		disposable = socketSubject.subscribe(function(){});

		sendError('err');
	});

	describe('the returned subject', function() {
		it('should reconnect the socket when a new connection is emitted into it', function(){
			var connections = new Rx.BehaviorSubject('ws://one');
			var socketSubject = RxSocketSubject.create(connections);

			socketSubject.subscribe(function(){});
			var socket = sockets[0];

			expect(socket.url).toBe('ws://one');
			expect(socket.close).not.toHaveBeenCalled();

			connections.onNext('ws://two');

			expect(socket.close).toHaveBeenCalled();
			expect(socket).not.toBe(sockets[0]); // new socket created
			var socket = sockets[0];
			expect(socket.url).toBe('ws://two');
		});

		it('should create one socket, and close the socket when all subscribed observables are complete', function(){
			var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));
			var disp1 = socketSubject.subscribe(function(){});
			var disp2 = socketSubject.subscribe(function(){});

			expect(sockets.length).toBe(1);

			var socket = sockets[0];

			disp1.dispose();
			expect(socket.close).not.toHaveBeenCalled();

			disp2.dispose();
			expect(socket.close).toHaveBeenCalled();
		});

		it('should create a WebSocket with the passed endpoint on subcription', function(){
			var socketSubject = RxSocketSubject.create(Rx.Observable.just('ws://test.com'));
			disposable = socketSubject.subscribe(function(x) {});
			expect(sockets[0].url).toBe('ws://test.com');
		});

		it('should provide a stream of messages from the socket and complete on close', function(done){
			var socketSubject = RxSocketSubject.create(Rx.Observable.just('ws://test.com'));
			var results = [];

			disposable = socketSubject.subscribe(function(x) {
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
			sendClose(1000, 'done');
		});

		it('should accept a closingObserver that emits when the socket is about to close', function(done) {
			var socket;

			var closingObserver = Rx.Observer.create(function() {
				expect(socket.close).not.toHaveBeenCalled();
				done();
			});

			var socketSubject = RxSocketSubject.create(Rx.Observable.just(''), null, null, closingObserver);

			var disp = socketSubject.subscribe(function(){});

			socket = sockets[0];

			disp.dispose();
		});

		describe('onNext', function() {	
			it('should buffer messages if no socket exists yet', function(){var socket;
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));

				socketSubject.onNext('one');
				socketSubject.onNext('two');
			        socketSubject.onNext('three');

				disposable = socketSubject.subscribe(function(){});
				var socket = sockets[0];

			        expect(socket.send.calls.all().length).toBe(0);

			        sendOpen();

				expect(socket.send.calls.all()).toEqual([
					{ object: socket, args: ['one'], returnValue: undefined},
					{ object: socket, args: ['two'], returnValue: undefined},
					{ object: socket, args: ['three'], returnValue: undefined}
				]);
			});

			it('should buffer messages AGAIN if the underlying socket has been closed because the observable has been disposed', function(){
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));

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
					{ object: socket, args: ['one'], returnValue: undefined},
					{ object: socket, args: ['two'], returnValue: undefined},
					{ object: socket, args: ['three'], returnValue: undefined}
				]);
			});

			it('should send a message to the socket when it is called and the socket is OPEN', function() {
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));
				
				disposable = socketSubject.subscribe(function(){});

				sendOpen();

				socketSubject.onNext('hello');

				var socket = sockets[0];

				expect(socket.send).toHaveBeenCalledWith('hello');
			});
		});

	 	describe('onError', function(){
		  it('should call socket.close(4003, "shazbot") when called with a { code: 4003, message: "shazbot" }', function(){
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));

				disposable = socketSubject.subscribe(function(){});

				var socket = sockets[0];

				socketSubject.onError({ code: 4003, reason: 'shazbot' });

				expect(socket.close).toHaveBeenCalledWith(4003, 'shazbot');
			});
		});

	 	describe('onCompleted', function() {
			it('should call socket.close() when called with no arguments', function(){
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''), undefined, undefined, undefined);

				disposable = socketSubject.subscribe(function(){});

				var socket = sockets[0];

				socketSubject.onCompleted();

				expect(socket.close).toHaveBeenCalledWith(1000, '');
			});
		});

		describe('when subscribe or subscribe is called', function(){
			it('should create a socket', function(){
				var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));

				expect(sockets.length).toBe(0);

				disposable = socketSubject.subscribe(function(){});

				expect(sockets.length).toBe(1);
			});

			describe('more than once', function() {
				it('should only create one socket', function(){
					var socketSubject = RxSocketSubject.create(Rx.Observable.just(''));

					disposable = new Rx.CompositeDisposable(
						socketSubject.subscribe(function(){}),
						socketSubject.subscribe(function(){})
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


function sendClose(code, reason, wasClean) {
	wasClean = (arguments.length === 3) ? wasClean : true;
	sockets.forEach(function(socket) {
		socket.readyState = 3;
		socket.dispatchEvent(createEvent(socket, 'close', { code: code, reason: reason, wasClean: wasClean }));
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
