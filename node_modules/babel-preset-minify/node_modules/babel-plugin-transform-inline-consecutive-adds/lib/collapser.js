"use strict";

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var NotImplementedError = Error("NotImplementedError");

var Collapser =
/*#__PURE__*/
function () {
  function Collapser() {
    _classCallCheck(this, Collapser);
  }

  _createClass(Collapser, [{
    key: "isInitTypeValid",
    value: function isInitTypeValid() {
      throw NotImplementedError;
    }
  }, {
    key: "isExpressionTypeValid",
    value: function isExpressionTypeValid() {
      throw NotImplementedError;
    }
  }, {
    key: "getExpressionChecker",
    value: function getExpressionChecker() {
      throw NotImplementedError;
    }
  }, {
    key: "extractAssignment",
    value: function extractAssignment() {
      throw NotImplementedError;
    }
  }, {
    key: "addSuccessfully",
    value: function addSuccessfully() {
      throw NotImplementedError;
    }
  }, {
    key: "isSizeSmaller",
    value: function isSizeSmaller() {
      return true;
    }
  }]);

  return Collapser;
}();

module.exports = Collapser;