describe('RxSocketSubject.create()', function(){
	var disposable;

	it('should exist', function(){
		expect(typeof RxSocketSubject.create).toBe('function');
	});

	it('should create a Subject', function() {
		var socketSubject = RxSocketSubject.create('');
		expect(typeof socketSubject.observer !== 'undefined' && typeof socketSubject.observable !== 'undefined').toBe(true);
	});

	it('should accept an openObserver argument', function(done){
		var socket;

		RxSocketSubject.config.WebSocket = function MockSocket() {
			socket = this;
			setTimeout(function(){
				socket.onopen('opened');
			}, 0);
		};

		var openObserver = Rx.Observer.create(function(e) {
			expect(e).toBe('opened');
			done();
		});

		var socketSubject = RxSocketSubject.create('', openObserver);

		disposable = socketSubject.forEach(function(){});
	});


	it('should accept an errorObserver argument', function(done){
		var socket;

		RxSocketSubject.config.WebSocket = function MockSocket() {
			socket = this;
			setTimeout(function(){
				socket.onerror('oops');
			}, 0);
		};

		var errorObserver = Rx.Observer.create(function(e) {
			expect(e).toBe('oops');
			done();
		});

		var socketSubject = RxSocketSubject.create('', undefined, errorObserver);

		disposable = socketSubject.forEach(function(){});
	});


	it('should accept a closeObserver argument', function(done) {
		var socket;

		RxSocketSubject.config.WebSocket = function MockSocket() {
			socket = this;
			setTimeout(function(){
				socket.onclose('closed');
			}, 0);
		};

		var closeObserver = Rx.Observer.create(function(e) {
			expect(e).toBe('closed');
			done();
		});

		var socketSubject = RxSocketSubject.create('', undefined, undefined, closeObserver);

		disposable = socketSubject.forEach(function(){});
	});

	describe('the returned subject', function(){
		it('should create a WebSocket with the passed endpoint on subcription', function(){
			RxSocketSubject.config.WebSocket = jasmine.createSpy('MockSocket');
			var socketSubject = RxSocketSubject.create('ws://test.com');
			disposable = socketSubject.forEach(function(x) {});
			expect(RxSocketSubject.config.WebSocket).toHaveBeenCalledWith('ws://test.com');
		});

		it('should provide a stream of messages from the socket and complete on close', function(done){
			var socket;
			RxSocketSubject.config.WebSocket = function MockSocket() {
				socket = this;
			};

			var socketSubject = RxSocketSubject.create('ws://test.com');
			var results = [];

			disposable = socketSubject.forEach(function(x) {
				results.push(x);
			}, function(e){
				expect(true).toBe(false); //ghetto? yes.
				done();
			}, function(){
				expect(results).toEqual(['one', 'two', 'three']);
				done();
			});
			
			socket.onmessage('one');
			socket.onmessage('two');
			socket.onmessage('three');
			socket.onclose();
		});

		it('should error when the socket errors', function(done){
			var socket;
			RxSocketSubject.config.WebSocket = function MockSocket() {
				socket = this;
			};

			var errorObserver = Rx.Observer.create(function(e) {
				expect(e).toBe('wat');
				done();
			});

			var socketSubject = RxSocketSubject.create('ws://test.com', null, errorObserver);

			disposable = socketSubject.forEach(function(x) {
			});
			
			socket.onerror('wat');
		});


		it('should accept either one endpoint or an array of endpoints, and iterate through them if they fail to connect', function(done) {
			var endpoints = ['ws://bad1', 'ws://bad2', 'ws://good', 'ws://toofar'];
			var socket;
			var tries = 0;
			var errors = [];

			var errorObserver = Rx.Observer.create(function(e) {
				errors.push(e);
			});

			RxSocketSubject.config.WebSocket = function MockSocket(endpoint) {
				expect(typeof endpoint).toBe('string');
				tries++;
				socket = this;

				if(endpoint !== 'ws://good') {
					// simulate immediate connection error
					setTimeout(function(){
						socket.onerror(endpoint);
					}, 0);
				} else {
					expect(tries).toBe(3);
					done();
				}
			};

			var socketSubject = RxSocketSubject.create(endpoints, null, errorObserver);
			disposable = socketSubject.forEach(function() {});
		});

		describe('onNext', function() {	
			it('should send a message to the socket when it is called and the socket is OPEN', function() {
				var socket;
				var sendSpy = jasmine.createSpy('socket.send');

				RxSocketSubject.config.WebSocket = function MockSocket() {
					this.readyState = 1; //OPEN
					this.OPEN = 1;
					this.send = sendSpy;
					socket = this;
				};

				var socketSubject = RxSocketSubject.create('');
				disposable = socketSubject.forEach(function(){});

				socketSubject.onNext('hello');

				expect(socket.send).toHaveBeenCalledWith('hello');
			});

			it('should queue up messages sent if the socket is not OPEN, then send them when it opens', function(){
				var sent = [];
				var socket;

				RxSocketSubject.config.WebSocket = function MockSocket() {
					this.readyState = 0; //OPEN
					this.OPEN = 1;
					this.send = function() {
						sent.push([].slice.call(arguments));
					};
					socket = this;
				};

				var socketSubject = RxSocketSubject.create('');
				disposable = socketSubject.forEach(function(){});

				socketSubject.onNext('one');
				socketSubject.onNext('two');
				socketSubject.onNext('three');

				socket.readyState = socket.OPEN;
				socket.onopen();

				socketSubject.onNext('four');

				expect(sent).toEqual([['one'],['two'],['three'],['four']]);
			});
		});

		describe('onError', function(){
		  it('should call socket.close(1008, string) when called with a string', function(){
				var socket;

				RxSocketSubject.config.WebSocket = function MockSocket() {
					socket = this;
					socket.close = jasmine.createSpy('socket.close');
				};

				var errorObserver = Rx.Observer.create(function(err) {
					expect(err.code).toBe(1008);
					expect(err.message).toBe('boop.');
				});

				var socketSubject = RxSocketSubject.create('', undefined, errorObserver, undefined);

				disposable = socketSubject.forEach(function(){});

				socketSubject.onError('boop.');

				expect(socket.close).toHaveBeenCalledWith(RxSocketSubject.CLOSE_GENERIC, 'boop.');
			});


		  it('should call socket.close(e.code, e.message) when called with a ClientInitiatedError', function(){
				var socket;

				RxSocketSubject.config.WebSocket = function MockSocket() {
					socket = this;
					socket.close = jasmine.createSpy('socket.close');
				};

				var errorObserver = Rx.Observer.create(function(err) {
					expect(err.code).toBe(4002);
					expect(err.message).toBe('boop.');
				});

				var socketSubject = RxSocketSubject.create('', undefined, errorObserver, undefined);

				disposable = socketSubject.forEach(function(){});

				socketSubject.onError(new RxSocketSubject.ClientInitiatedError('boop.', 4002));

				expect(socket.close).toHaveBeenCalledWith(4002, 'boop.');
			});


		  it('should call socket.close(4003, "shazbot") when called with a { code: 4003, message: "shazbot" }', function(){
				var socket;

				RxSocketSubject.config.WebSocket = function MockSocket() {
					socket = this;
					socket.close = jasmine.createSpy('socket.close');
				};

				var errorObserver = Rx.Observer.create(function(err) {
					expect(err.code).toBe(4003);
					expect(err.message).toBe('shazbot');
				});

				var socketSubject = RxSocketSubject.create('', undefined, errorObserver, undefined);

				disposable = socketSubject.forEach(function(){});

				socketSubject.onError(new RxSocketSubject.ClientInitiatedError('shazbot', 4003));

				expect(socket.close).toHaveBeenCalledWith(4003, 'shazbot');
			});
		});

		describe('onCompleted', function() {
			it('should call socket.close() when called with no arguments', function(){
				var socket;

				RxSocketSubject.config.WebSocket = function MockSocket() {
					socket = this;
					socket.close = jasmine.createSpy('socket.close');
				};

				var socketSubject = RxSocketSubject.create('', undefined, undefined, undefined);

				disposable = socketSubject.forEach(function(){});

				socketSubject.onCompleted();

				expect(socket.close).toHaveBeenCalledWith();
			});
		});
	});


	afterEach(function(){
		RxSocketSubject.config.WebSocket = window.WebSocket;
		if(disposable) {
			disposable.dispose();
		}
	});
});