describe('RxSocketSubject.config.WebSocket', function(){
	it('should default to window.WebSocket', function(){
		expect(RxSocketSubject.config.WebSocket).toBe(window.WebSocket);
	});

	it('should allow mocking of WebSocket ctor', function(){
		RxSocketSubject.config.WebSocket = jasmine.createSpy('MockWebSocket');
		var d = RxSocketSubject.create('test').forEach();
		expect(RxSocketSubject.config.WebSocket).toHaveBeenCalledWith('test');
		d.dispose();
	});

	afterEach(function() {
		RxSocketSubject.config.WebSocket = window.WebSocket;
	});
});