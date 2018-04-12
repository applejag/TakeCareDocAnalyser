
function isRegExp(val) {
    return val instanceof RegExp;
}

function isString(val) {
    return typeof val == "string" || val instanceof String;
}

function parseDate(str) {
    str=str.trim();
    var reg = /(?:Den\s*)?(\d+)\s*(\w+)\s*(\d+)?(?:(?:kl\s*|\D+)?(\d+:\d+))?/i.exec(str);
    var date = reg ? Date.parse(reg[2]+" "+reg[1]+" "+(reg[3]||'')+" "+(reg[4]||'')) : Date.parse(str);
    if (!date) throw new Error("Unable to parse date `"+JSON.stringify(str)+"`!");
    return date;
}

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
