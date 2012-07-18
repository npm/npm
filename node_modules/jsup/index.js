var burrito = require('burrito');
var traverse = require('traverse');

var jsup = module.exports = function (src) {
    var self = {};
    
    var obj = JSON.parse(src);
    var ann = jsup.annotate(src, obj);
    
    self.get = function (path) {
        return traverse(obj).get(path || []);
    }
    
    self.set = function (path, value) {
        traverse(obj).set(path, value);
        
        var key = path.pop();
        var cur = path.reduce(function (cur, k) {
            return cur.value[k];
        }, ann);
        var res = traverse(obj).get(path);
        
        if (cur.node.name === 'array') {
            if (!cur.node.value[0][key]) {
                throw new Error('array node does not exist')
            }
            
            var c = cur.node.value[0][key];
        }
        else if (cur.node.name === 'object') {
            var xs = cur.node.value[0];
            var c = null;
            
            for (var i = 0; i < xs.length; i++) {
                if (xs[i][0] === key) {
                    c = xs[i][1];
                    break;
                }
            }
            
            if (!c) throw new Error('object node does not exist');
        }
        else throw new Error('unexpected node type: ' + cur.node.name)
        
        var start = c[0].start.pos - 2;
        
        if (c[0].start.pos === c[0].end.pos) {
            var end = start + JSON.stringify(c[1]).length;
        }
        else {
            var end = c[0].end.pos - 1;
        }
        
        var before = src.slice(0, start);
        var after = src.slice(end);
        src = before + JSON.stringify(value) + after;
        
        ann = jsup.annotate(src, obj);
        
        return self;
    };
    
    self.stringify = self.toString = function () {
        return src;
    };
    
    self.inspect = function () {
        return 'jsup(\'' + JSON.stringify(obj) + '\')';
    };
    
    return self;
};

jsup.annotate = function (src, obj) {
    if (!obj) obj = JSON.parse(src);
    
    var cur = obj;
    var root = { value : Array.isArray(obj) ? [] : {} };
    
    burrito('[\n' + src + '\n][0]', function (node) {
        var p = node.parent();
        
        if (p && p.name === 'sub' && node.value[0] !== 0) {
            root.node = node;
        }
        if (node.start.pos < 2 || node.end.pos > src.length - 5) return;
        
        var key = undefined;
        
        if (p.name === 'object') {
            var ix = this.path[ this.path.length - 2 ];
            key = p.value[0][ix][0];
        }
        else if (p.name === 'array') {
            key = this.key;
        }
        else throw new Error('unexpected name')
        
        if (node.name === 'object' || node.name === 'array') {
            root.value[key] = {
                node : node,
                value : node.name === 'array' ? [] : {}
            };
            
            var root_ = root;
            root = root.value[key];
            
            var cur_ = cur;
            cur = cur[key];
            
            this.after(function () {
                root = root_;
                cur = cur_;
            });
        }
        else {
            root.value[key] = {
                node : node,
                value : cur[key]
            };
        }
    });
    
    return root;
};
