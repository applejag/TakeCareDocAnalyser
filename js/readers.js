
/*

cell = {
    text: "" string,
    html: "" string,
    isItalic: bool,
    isBold: bool
}

doc: {
    head: {
        id: "" string',
        category: "" string,
        data1: "" string,
        data2: "" string,
        datestring: "" string,
        datetime: Date,
    },

    body[0..n]:
        [1..n]: cell

    notes[0..n]: cell,

    tables[0..n]: {
        head[1..n]: cell,

        rows[1..n]: {
            columns[1..n]: cell,
            _th_cell_text: cell,
        },

        columns: {
            _th_cell_text[0..n]: cell
        }
    },

    trees[0..n]: tree
}

tree: {
    title: cell,
    content: cell,
    children[0..n]: tree
}

*/

var read = {
    Vårdtillfällen: [],
    ÖppnaVårdkontakter: [],
    Mätvärden: [],
    Journaltexter: []
};

// parser.addReader = function(category, func(parsed))

parser.addReader("Journaltext", function(doc) {
    // Måste ha ett journaldokument textträd
    var tree = doc.trees[0];
    if (!tree) return;

    var signCell = doc.body[0][1];
    var sign = signCell.text;

    read.Journaltexter.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Signeringsansvarig: sign,
        Fritext: flattenTreeContentText(tree)
    });
});

parser.addReader("Mätvärde", function(doc) {
    // Vårdenhet tabellen innehåller in/ut datum
    var tab = findTable(doc.tables, "Term");
    if (!tab) return; // next doc plz

    var värden = {};

    // foreach row
    for (var i = 0; i < tab.rows.length; i++) {
        var row = tab.rows[i];
        var num = parseFloat(row.Mätvärde.text.replace(",", "."));

        värden[row.Term.text] = isNaN(num) ? row.Mätvärde.text : num;
    }

    var registCell = doc.notes[0];
    var registMatch = /^Registrerad av:\s*(.*)$/.exec(registCell.text);
    var regist = registMatch ? registMatch[1] : "<UNKNOWN>";

    // Spara grejer
    read.Mätvärden.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        RegistreradAv: regist,
        Värden: värden
    });
});

parser.addReader("Vårdtillfälle", function(doc) {
    // Vårdenhet tabellen innehåller in/ut datum
    var tab = findTableFirstRow(doc.tables, "Vårdenhet");
    if (!tab) return; // next doc plz

    // Spara grejer
    read.Vårdtillfällen.push({
        Rubrik: doc.head.data2,
        Inskrivningsdatum: parseDate(tab.Inskrivningsdatum.text),
        Utskrivningsdatum: parseDate(tab.Utskrivningsdatum.text),
        Diagnoser: findTableFirstColumn(doc.tables, "Diagnoser", true) || [],
        Åtgärder: findTableFirstColumn(doc.tables, "Åtgärder", true) || []
    });
});

parser.addReader("Öppen vårdkontakt", function(doc) {
    // Spara grejer
    read.ÖppnaVårdkontakter.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Diagnoser: findTableFirstColumn(doc.tables, "Diagnoser", true) || [],
        Åtgärder: findTableFirstColumn(doc.tables, "Åtgärder", true) || []
    });
});

/* HELPER FUNCTIONS */

function flattenTreeContentText(tree) {
    var output = tree.content.text;

    for (var i = 0; i < tree.children.length; i++) {
        var childtext = flattenTreeContentText(tree.children[i]);
        
        if (childtext == "") continue;
        if (output == "") output = childtext;
        else output += "\n" + childtext;
    }

    return output;
}

// callback(cell, row, doc)
function forEachCell(parsed, callback) {
    forEachRow(parsed, function(row, doc) {
        // foreach cell
        for (var i = 0; i < row.length; i++) {
            var cell = row[i];
            var ret = callback(cell, row, doc);
            if (ret) return ret;
        }
    });
}

// callback(row, doc)
function forEachRow(parsed, callback) {
    forEachDocument(parsed, function(doc) {
        // foreach row
        for (var i = 0; i < doc.body.length; i++) {
            var row = doc.body[i];
            var ret = callback(row, doc);
            if (ret) return ret;
        }
    });
}

// callback(doc)
function forEachDocument(parsed, callback) {
    // foreach document
    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];
        var ret = callback(doc);
        if (ret) return ret;
    }
}

// returns doctable || null
function findTable(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });
    return tab || null;
}

// returns cell[] || null
function findTableFirstRow(tables, firstColumnName, textOnly) {
    var tab = findTable(tables, firstColumnName);

    if (!tab) return null;
    if (textOnly) return tab.rows[firstColumnName].map(function(x) {
        return x.text;
    });

    return tab.rows[0];
}

// return cell[] || null
function findTableFirstColumn(tables, firstColumnName, textOnly) {
    var tab = findTable(tables, firstColumnName);

    if (!tab) return null;
    if (textOnly) return tab.columns[firstColumnName].map(function(x) {
        return x.text;
    });

    return tab.columns[firstColumnName];
}
