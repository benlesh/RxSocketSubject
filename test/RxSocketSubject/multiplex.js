var Subject = Rx.Subject;
var Observable = Rx.Observable;
var multiplex = RxSocketSubject.multiplex;

describe('multiplex', function(){
	describe('the returned multiplexer function', function(){
		it('should be a function', function(){
			var socket = new Subject();
			var multiplexer = multiplex(socket, function() {
				return function(x){ return x; }
			});
			expect(typeof multiplexer).toBe('function');
		});

		it('should return an observable', function(){
			var socket = new Subject();
			var multiplexer = multiplex(socket, function() {
				return function(x){ return x; }
			});
			var result = multiplexer({ sub: 1 }, { unsub: 1 });
			expect(result instanceof Observable).toBe(true);
		});

		describe('the returned observable', function(){
			it('should subscribe to the underlying socket and send a message on subscription and unsubscription', function(){
				var socket = new Subject();
				var socketDisposalSpy = jasmine.createSpy('socket.dispose');
				spyOn(socket, 'onNext');
				spyOn(socket, 'subscribe').and.callFake(function(){
					return { 
						dispose: function() {
							expect(socket.onNext).toHaveBeenCalledWith(JSON.stringify({ unsub: 1 }));
							socketDisposalSpy();
						} 
					};
				});

				var multiplexer = multiplex(socket, function() {
					return function(x){ return x; }
				});
				var result = multiplexer({ sub: 1 }, { unsub: 1 });
				var disposable = result.subscribe(function(){});
				expect(socket.subscribe).toHaveBeenCalled();
				expect(socket.onNext).toHaveBeenCalledWith(JSON.stringify({ sub: 1 }));
				disposable.dispose();
				expect(socketDisposalSpy).toHaveBeenCalled();
			});
		});
	});
});