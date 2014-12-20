describe('ClientInitiatedError class', function(){
	it('should exist', function(){
		expect(typeof RxSocketSubject.ClientInitiatedError).toBe('function');
	});

	it('should accept just a message', function(){
		var err = new RxSocketSubject.ClientInitiatedError('boop.');
		expect(err.message).toBe('boop.');
		expect(err.code).toBe(RxSocketSubject.CLOSE_GENERIC);
	});

	it('should accept a message and a code', function(){
		var err = new RxSocketSubject.ClientInitiatedError('beep!', 4001);
		expect(err.message).toBe('beep!');
		expect(err.code).toBe(4001);
	});
})