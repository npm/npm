function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = new Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

// Set that counts
module.exports =
/*#__PURE__*/
function () {
  function CountedSet() {
    _classCallCheck(this, CountedSet);

    // because you can't simply extend Builtins yet
    this.map = new Map();
  }

  _createClass(CountedSet, [{
    key: "keys",
    value: function keys() {
      return _toConsumableArray(this.map.keys());
    }
  }, {
    key: "has",
    value: function has(value) {
      return this.map.has(value);
    }
  }, {
    key: "add",
    value: function add(value) {
      if (!this.has(value)) {
        this.map.set(value, 0);
      }

      this.map.set(value, this.map.get(value) + 1);
    }
  }, {
    key: "delete",
    value: function _delete(value) {
      if (!this.has(value)) return;
      var count = this.map.get(value);

      if (count <= 1) {
        this.map.delete(value);
      } else {
        this.map.set(value, count - 1);
      }
    }
  }]);

  return CountedSet;
}();