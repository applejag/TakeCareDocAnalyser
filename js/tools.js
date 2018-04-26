
Math.randomRange = function randomRange(lower, upper) {
    return Math.random() * (upper - lower) + lower;
};

Math.irandomRange = function irandomRange(lower, upper) {
    lower = lower>>0;
    upper = upper>>0;
    return (Math.random() * (upper - lower + 1) ) << 0;
};

function isRegExp(val) {
    return val instanceof RegExp;
}

function isString(val) {
    return typeof val == "string" || val instanceof String;
}

function isNumber(val) {
    return typeof val == "number" || val instanceof Number;
}

function typeof2(val) {
    if (val instanceof String) return "String";
    if (val instanceof Number) return "Number";
    if (val instanceof Array) return "Array";
    if (val instanceof Date) return "Date";
    return typeof val;
}

function formatDate(date) {
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());

    return year.padStart(4,'0')+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0');
}

function formatTime(date) {
    var hour = String(date.getHours());
    var minute = String(date.getMinutes());

    return hour.padStart(2, '0')+':'+minute.padStart(2,'0');
}

function formatDateTime(date) {
    return formatDate(date)+' '+formatTime(date);
}

function tryParseDate(str) {
    if (!isString(str)) return null;
    str=str.trim();
    var reg = /(?:Den\s*)?(\d+)\s+(\w+)\s+(\d+)?(?:(?:kl\s*|\D+)?(\d+:\d+))?/i.exec(str);
    var date = reg ? Date.parse(reg[2]+" "+reg[1]+" "+(reg[3]||'')+" "+(reg[4]||'')) : Date.parse(str);
    if (!date) date = new Date(str);
    if (!date || date.toString() === "Invalid Date")
        return null;
    return date;
}

function parseDate(str) {
    var date = tryParseDate(str);
    if (!date)
        throw new Error("Unable to parse date `"+JSON.stringify(str)+"`!");
    return date;
}

Object.prototype.cloneDeep = function() {
    if (this === null) return null;
    if (typeof this === 'undefined') return this;
    if (typeof this === 'boolean') return this;
    if (typeof this === 'string') return this;
    if (typeof this === 'number') return this;
    if (typeof this === 'function') return this;
    if (this instanceof String) return String(this);
    if (this instanceof Number) return Number(this);
    if (this instanceof Date) return new Date(this);
    if (this instanceof Node) return this.cloneNode(true);

    var clone;
    if (this instanceof Array) clone = [];
    else clone = {};

    for (var key in this) {
        if (this.hasOwnProperty(key)) {
            clone[key] = Object.prototype.cloneDeep.call(this[key]);
        }
    }

    return clone;
};

Array.prototype.mapField = function(key) {
    return this.map(function(elem) {
        return elem[key];
    });
};

Array.prototype.indexOfCaseInsensitive = function(value) {
    if (!isString(value))
        return this.indexOf(value);

    value = value.toLowerCase();

    for (var i = 0; i < this.length; i++) {
        var elem = isString(this[i]) ? this[i].toLowerCase() : this[i];
        if (elem === value)
            return i;
    }

    return -1;
};

String.prototype.countMatchingChars = function(other) {
    if (!isString(other))
        throw new Error("Cannot compare string with " + typeof other);

    var limit = Math.min(this.length, other.length);

    for (var i = 0; i < limit; i++) {
        if (this[i] !== other[i])
            return i;
    }

    return limit;
};

// http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
String.prototype.hashCode = function(){
	var hash = 0;
	if (this.length == 0) return hash;
	for (i = 0; i < this.length; i++) {
		code = this.charCodeAt(i);
		hash = ((hash<<5)-hash)+code;
		hash = hash & hash; // Convert to 32bit integer
	}
	return hash;
};

String.prototype.splitSentences = (function() {
    // very kind/non restrictive url matching
    var urls = "(https?:\\/\\/.)?(www\\.)?([-a-zA-Z0-9@:%._\\+~#=]{2,256})(\\.[a-z]{2,6})\\b([-a-zA-Z0-9@:%_\\+.~#?&//=]*)";

    var abbr = [
        "osv.",     // och så vidare
        "etc.",     // etcetra
        "e. ?dyl.?",// eller dylikt
        "f.d.",     // före detta
        "fr.o.m.?", // från och med
        "t.o.m.?",  // till och med
        "i.o.m.?",  // i och med
        "dvs.",     // det vill säga
        "m.m.?",    // med mera
        "obs.",     // observera
        "st.",      // styck
        "sek.",     // sekunder
        "min.",     // minuter
        "h.",       // timmar
        "ssk.",     // sjuksköterska
        "rtg.",     // röntgen
        "vtf."      // vårdtillfälle
    ].map(function(a) {
        return a.replace(/\./g, '\\.')      // \.  => \.
                .replace(/\s\?/g, '\\s*')   // \s? => \s*
                .replace(/\s/g, '\\s');     // \s  => \s
    });

    abbr.push(urls);
    abbr.push(".");

    var regex = new RegExp("(?:^|\\s*)((?:"+abbr.join('|')+")+?(?:[.?!]+|$))", "gim");

    function trimmer(str) {
        return str.trim();
    }

    return function () {
        var matches = this.match(regex);
        return matches ? matches.map(trimmer) : [];
    };
})();

function clearContent(elemId) {
    var elem = document.getElementById(elemId);
    if (elem.tagName == "TEXTAREA") {
        elem.value = "";
    } else {
        elem.innerHTML = "";
    }
    elem.focus();
}

function selectText(elemId) {
    var text = document.getElementById(elemId);
    var range, selection;

    if (document.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
    } else if (text.tagName == "TEXTAREA") {
        text.focus();
        text.select();
    } else if (window.getSelection) {
        selection = window.getSelection();
        range = document.createRange();
        range.selectNodeContents(text);
        selection.removeAllRanges();
        selection.addRange(range);
    }
}

function focusAll(elemId) {
    selectText(elemId);
    document.getElementById(elemId).focus();
}

function focusEnd(elemId) {
    var elem = document.getElementById(elemId);
    if (elem.tagName == "TEXTAREA") {
        elem.focus();
        elem.setSelectionRange(elem.value.length,elem.value.length);
    } else {
        selectText(elemId);
        var selection = document.getSelection();
        selection.collapseToEnd();
        elem.focus();
    }
}
