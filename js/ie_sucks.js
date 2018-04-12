
// https://stackoverflow.com/questions/7350912/16680415#16680415
if (!Array.prototype.find) {
    Array.prototype.map = function(converter) {
        var r=[];
        for(var i=0; i<this.length; i++)
            if(this[i] !== undefined)
                r[i] = converter(this[i]);
        return r;
    };
}

if (!Array.prototype.filter) {
    Array.prototype.filter = function(predicate) {
        var r = [];
        for(var i=0; i<this.length; i++)
            if(this[i] !== undefined && predicate(this[i]))
                r[i] = this[i];
        return r;
    };
}

// https://stackoverflow.com/questions/16186930/22598415#22598415
if (!Array.prototype.forEach) {
    Array.prototype.forEach = function(callback, thisArg){
        if (thisArg == undefined)
            thisArg = this;
        for (var i = 0; i < this.length; i++){
            callback.apply(thisArg, [this[i], i, thisArg]);
        }
    };
}

// https://tc39.github.io/ecma262/#sec-array.prototype.find
if (!Array.prototype.find) {
    Array.prototype.find = function(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
            throw new TypeError('"this" is null or not defined');
        }

        var o = Object(this);

        // 2. Let len be ? ToLength(? Get(O, "length")).
        var len = o.length >>> 0;

        // 3. If IsCallable(predicate) is false, throw a TypeError exception.
        if (typeof predicate !== 'function') {
            throw new TypeError('predicate must be a function');
        }

        // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
        var thisArg = arguments[1];

        // 5. Let k be 0.
        var k = 0;

        // 6. Repeat, while k < len
        while (k < len) {
            // a. Let Pk be ! ToString(k).
            // b. Let kValue be ? Get(O, Pk).
            // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
            // d. If testResult is true, return kValue.
            var kValue = o[k];
            if (predicate.call(thisArg, kValue, k, o)) {
                return kValue;
            }
            // e. Increase k by 1.
            k++;
        }
        // 7. Return undefined.
        return undefined;
    };
}

// https://stackoverflow.com/questions/11054511/11054570#11054570
if (!Function.prototype.bind) {
  Function.prototype.bind = function(oThis) {
    if (typeof this !== 'function') {
      // closest thing possible to the ECMAScript 5
      // internal IsCallable function
      throw new TypeError('Function.prototype.bind - what is trying to be bound is not callable');
    }

    var aArgs   = Array.prototype.slice.call(arguments, 1),
        fToBind = this,
        fNOP    = function() {},
        fBound  = function() {
          return fToBind.apply(this instanceof fNOP && oThis ? this : oThis,
                 aArgs.concat(Array.prototype.slice.call(arguments)));
        };

    fNOP.prototype = this.prototype;
    fBound.prototype = new fNOP();

    return fBound;
  };
}

// https://stackoverflow.com/questions/5472938/5473193#5473193
// if (Function.prototype.bind && window.console && typeof console.log == "object"){
//     [
//       "log","info","warn","error","assert","dir","clear","profile","profileEnd"
//     ].forEach(function (method) {
//         console[method] = Function.prototype.bind.call(console[method], console);
//     });
// }
