define(
  "rx-socket-subject.umd",
  ["./rx-socket-subject", "exports"],
  function(rx$socket$subject$$, __exports__) {
    "use strict";

    function __es6_export__(name, value) {
      __exports__[name] = value;
    }

    var RxSocketSubject;
    RxSocketSubject = rx$socket$subject$$["default"];

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
  }
);

//# sourceMappingURL=rx-socket-subject.umd.js.map