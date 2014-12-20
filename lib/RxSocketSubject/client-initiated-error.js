import { CLOSE_GENERIC } from './constants';

function ClientInitiatedError(message, code) {
	this.message = message;
	this.code = code || CLOSE_GENERIC;
}

export default ClientInitiatedError;

