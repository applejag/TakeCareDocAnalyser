
function isRegExp(val) {
    return val instanceof RegExp;
}

function isString(val) {
    return typeof val == "string" || val instanceof String;
}

function parseDate(str) {
    str=str.trim();
    var reg = /(?:Den\s*)?(\d+)\s+(\w+)\s+(\d+)?(?:(?:kl\s*|\D+)?(\d+:\d+))?/i.exec(str);
    var date = reg ? Date.parse(reg[2]+" "+reg[1]+" "+(reg[3]||'')+" "+(reg[4]||'')) : Date.parse(str);
    if (!date) date = new Date(str);
    if (!date || date.toString() === "Invalid Date")
        throw new Error("Unable to parse date `"+JSON.stringify(str)+"`!");
    return date;
}

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
    elem.innerHTML = "";
    elem.focus();
}

function selectText(elemId) {
    var doc = document;
    var text = doc.getElementById(elemId);
    var range, selection;

    if (doc.body.createTextRange) {
        range = document.body.createTextRange();
        range.moveToElementText(text);
        range.select();
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
    selectText(elemId);
    var selection = document.getSelection();
    selection.collapseToEnd();
    document.getElementById(elemId).focus();
}
