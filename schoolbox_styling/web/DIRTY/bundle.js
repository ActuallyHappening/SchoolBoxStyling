(function (firebase_core) {
  'use strict';

  function _interopNamespaceDefault(e) {
    var n = Object.create(null);
    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(n, k, d.get ? d : {
            enumerable: true,
            get: function () { return e[k]; }
          });
        }
      });
    }
    n.default = e;
    return Object.freeze(n);
  }

  var firebase_core__namespace = /*#__PURE__*/_interopNamespaceDefault(firebase_core);

  [
    ["firebase_core", firebase_core__namespace],
    ["app_check", firebase_core__namespace]
  ].forEach((b) => {
    window["ff_trigger_" + b[0]] = async (callback) => {
      callback(await import(b[1]));
    };
  });

})(firebase_core);
