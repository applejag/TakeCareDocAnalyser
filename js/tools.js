/**
 * Add a number of days to a date
 * @param {Date} date 
 * @param {Number} days 
 */
function addDays(date, days) {
    var result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
}

/**
 * Generates a random number from `lower` (inclusive) to `upper` (exclusive).
 * @param {Number} lower Lower limit for randomization range
 * @param {Number} upper Upper limit for randomization range
 * @alias Math.randomRange
 */
Math.randomRange = function randomRange(lower, upper) {
    return Math.random() * (upper - lower) + lower;
};

/**
 * Generates a random integer from `lower` (inclusive) to `upper` (inclusive).
 * @param {Number} lower Lower limit for randomization range
 * @param {Number} upper Upper limit for randomization range
 * @alias Math.irandomRange
 */
Math.irandomRange = function irandomRange(lower, upper) {
    lower = lower>>0;
    upper = upper>>0;
    return (Math.random() * (upper - lower + 1) ) << 0;
};

/**
 * @param {any} val Value to compare
 * @returns {Boolean} True if value is object of type RegExp, false otherwise.
 */
function isRegExp(val) {
    return val instanceof RegExp;
}

/**
 * @param {any} val Value to compare
 * @returns {Boolean} True if value is a string or object of type String, false otherwise.
 */
function isString(val) {
    return typeof val == "string" || val instanceof String;
}

/**
 * @param {any} val Value to compare
 * @returns {Boolean} True if value is a number or object of type Number, false otherwise.
 */
function isNumber(val) {
    return typeof val == "number" || val instanceof Number;
}

/**
 * Similar to naitive `typeof`, but returns special values for some objects.
 * `"String"` for String objects.
 * `"Number"` for Number objects.
 * `"Date"` for Date objects.
 * `"Array"` for Array objects. 
 * @param {any} val Value to retreive type from
 */
function typeof2(val) {
    if (val instanceof String) return "String";
    if (val instanceof Number) return "Number";
    if (val instanceof Array) return "Array";
    if (val instanceof Date) return "Date";
    return typeof val;
}

/**
 * @param {Date} date Date to format
 * @returns {String} The date in the format `YYYY-MM-DD`
 */
function formatDate(date) {
    var year = String(date.getFullYear());
    var month = String(date.getMonth() + 1);
    var day = String(date.getDate());

    return year.padStart(4,'0')+'-'+month.padStart(2,'0')+'-'+day.padStart(2,'0');
}

/**
 * @param {Date} date Date to format
 * @returns {String} The date in the format `HH:mm`
 */
function formatTime(date) {
    var hour = String(date.getHours());
    var minute = String(date.getMinutes());

    return hour.padStart(2, '0')+':'+minute.padStart(2,'0');
}

/**
 * @param {Date} date Date to format
 * @returns {String} The date in the format `YYYY-MM-DD HH:mm`
 */
function formatDateTime(date) {
    return formatDate(date)+' '+formatTime(date);
}

/**
 * Tries to parse a date using multiple parsing options.
 * @param {String} str String to parse
 * @returns {Date|null} The date if successful. Null otherwise.
 */
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

/**
 * Tries to parse a date using multiple parsing options. Throws error on failure.
 * @param {String} str String to parse
 * @throws Thrown upon invalid date format.
 * @returns {Date|null} The parsed date.
 */
function parseDate(str) {
    var date = tryParseDate(str);
    if (!date)
        throw new Error("Unable to parse date `"+JSON.stringify(str)+"`!");
    return date;
}

/**
 * Performs a deep clone on an object.
 * @memberOf Object
 */
Object.prototype.cloneDeep = function cloneDeep() {
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

/**
 * Performs a mapping procedure via `.map`
 * where the value of the chosen key from the
 * elements is returned.
 * @param {String} key Name of the key
 * @memberOf Array
 */
Array.prototype.mapField = function mapField(key) {
    return this.map(function(elem) {
        return elem[key];
    });
};

/**
 * Finds the index of the searched string
 * while comparing in a case insensitive fashion.
 * @param {String} value String to find index of
 * @returns {Number} Index of match, else -1.
 * @memberOf Array
 */
Array.prototype.indexOfCaseInsensitive = function indexOfCaseInsensitive(value) {
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

/**
 * Compares from the start of two strings character by character,
 * and returns the number of characters that matched.
 * @param {String} other Other string to compare with
 * @returns {Number} The number of matching characters
 * @memberOf String
 */
String.prototype.countMatchingChars = function countMatchingChars(other) {
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
/**
 * Calculates a hash code for a string
 * @memberOf String
 */
String.prototype.hashCode = function hashCode(){
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

    /**
     * Splits a string at dots, exclamation marks, and question marks into its compound sentences.
     * Tries to keep urls and abbreviations intact.
     * @returns {String[]} The list of sentences.
     * @memberOf String
     */
    function splitSentences() {
        var matches = this.match(regex);
        return matches ? matches.map(trimmer) : [];
    }

    return splitSentences;
})();

/**
 * Clears an element of all its children nodes.
 * For <textarea> and <input>, only the value is cleared.
 * @param {String} elemId ID of target HTML element
 */
function clearContent(elemId) {
    var elem = document.getElementById(elemId);
    if (elem.tagName == "TEXTAREA" || elem.tagName == "INPUT") {
        elem.value = "";
    } else {
        elem.innerHTML = "";
    }
    elem.focus();
}

/**
 * Selects all text and elements inside the target element.
 * @param {String} elemId ID of target HTML element
 */
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
