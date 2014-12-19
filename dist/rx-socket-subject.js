(function() {
    "use strict";
    function $$RxSocketSubject$create$$create() {

    }

    var rx$socket$subject$umd$$RxSocketSubject = {
        create: $$RxSocketSubject$create$$create
    };

    /* global define:true module:true window: true */
    if (typeof define === 'function' && define['amd']) {
      define(function() { return rx$socket$subject$umd$$RxSocketSubject; });
    } else if (typeof module !== 'undefined' && module['exports']) {
      module['exports'] = rx$socket$subject$umd$$RxSocketSubject;
    } else if (typeof this !== 'undefined') {
      this['RxSocketSubject'] = rx$socket$subject$umd$$RxSocketSubject;
    }
}).call(this);

//# sourceMappingURL=rx-socket-subject.js.map