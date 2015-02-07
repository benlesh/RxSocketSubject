import RxSocketSubject from './rx-socket-subject';

/* global define:true module:true window: true */

/**
	@namespace RxSocketSubject
*/
if (typeof define === 'function' && define['amd']) {
  define(function() { return RxSocketSubject; });
} else if (typeof module !== 'undefined' && module['exports']) {
  module['exports'] = RxSocketSubject;
} else if (typeof this !== 'undefined') {
  this['RxSocketSubject'] = RxSocketSubject;
}