import { create } from './rx-socket-subject';

var RxSocketSubject = {
	create: create
};

/* global define:true module:true window: true */
if (typeof define === 'function' && define['amd']) {
  define(function() { return RxSocketSubject; });
} else if (typeof module !== 'undefined' && module['exports']) {
  module['exports'] = RxSocketSubject;
} else if (typeof this !== 'undefined') {
  this['RxSocketSubject'] = RxSocketSubject;
}