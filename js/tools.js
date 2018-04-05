
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
