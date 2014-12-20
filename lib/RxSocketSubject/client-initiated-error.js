import { CLOSE_GENERIC } from './constants';

/**
	An error class for triggering errors with a custom reason
	and code.

	### Example

				var ClientInitiatedError = RxSocketSubject.ClientInitiatedError;

				socket.onError(new ClientInitiatedError('bad things', 4001));

	@class ClientInitiatedError
	@constructor
	@param message {String} the message (aka reason)
	@param code {Number} [optional] the custom error code. Defaults to `1008`
*/
function ClientInitiatedError(message, code) {
	this.message = message;
	if(code) {
		this.code = code;
	}
}

ClientInitiatedError.prototype = {
	constructor: ClientInitiatedError,

	/**
		The message (aka reason)
		@property message
		@type {String}
		@default ''
	*/
	message: '',

	/**
		The status code
		@property code
		@type {Number}
		@default 1008
	*/
	code: CLOSE_GENERIC
};

export default ClientInitiatedError;

