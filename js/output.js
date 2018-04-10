
/*

cell = {
    text: "" string,
    html: "" string,
    isItalic: bool,
    isBold: bool
}

parsed = []
parsed[0..n]: {
    head: {
        category: "" string
        data1: "" string
        data2: "" string
        datestring: "" string
    }

    body[0..n]:
        [1..n]: cell

    tables[0..n]: {
        head[1..n]: cell

        rows[1..n]: {
            columns[1..n]: cell
            _th_cell_text: cell
        }

        columns: {
            _th_cell_text[0..n]: cell
        }
    }
}

*/

// parser.addOutput = function(name, id, func(parsed, parse_argument))

parser.addOutput("TEST", "test", function(parsed) {
    var docs = [];

    // foreach document
    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];

        docs.push({
            rubrik : doc.head.category,
            datum : doc.head.datestring
        });
    }

    return JSON.stringify(docs, null, 4);
});

parser.addOutput("Hitta text sträng", "hitta_sträng", function(parsed, needle) {

    if (needle === "")
        return "";

    var reg = /^\/(.+)\/((?:g(?:im?|mi?)?|i(?:gm?|mg?)?|m(?:gi?|ig?)?)?)$/.exec(needle);
    var exp;
    if (reg) {
        exp = new RegExp(reg[1], reg[2]);
    } else {
        needle = needle.trim().toUpperCase();
    }

    var output = "";

    forEachCell(parsed, function(cell, row, doc) {
        if (exp ? cell.text.search(exp) !== -1
                : cell.text.toUpperCase().indexOf(needle) !== -1)
        {
            output += [
                doc.head.category,
                doc.head.data1,
                doc.head.data2,
                doc.head.datestring
            ].join('|') + "\n";

            return true;
        }
    });

    return output;
});

parser.addOutput("Vårdtillfällen", "vård_sluten", function(parsed) {
    var output = "";

    // foreach document
    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];
        if (doc.head.category !== "Vårdtillfälle") continue;

        var tab = findTableFirstRow(doc.tables, "Vårdenhet");
        if (!tab) continue;

        output += [
            tab.Vårdenhet.text,
            tab.Inskrivningsdatum.text,
            tab.Utskrivningsdatum.text,
            findTableFirstColumnJoined(doc.tables, "Diagnoser")
        ].join('|') + "\n";
    }
    return output;
});

parser.addOutput("Öppna vårdkontakter", "vård_öppen", function(parsed) {
    var output = "";

    // foreach document
    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];
        if (doc.head.category !== "Öppen vårdkontakt") continue;

        output += [
            doc.head.data2,
            doc.head.datestring,
            findTableFirstColumnJoined(doc.tables, "Diagnoser")
        ].join('|') + "\n";
    }
    return output;
});

parser.addOutput("JSON", "json", function(parsed) {
    return JSON.stringify(parsed, null, 4);
});

/* HELPER FUNCTIONS */

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

// returns cell[] || null
function findTableFirstRow(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });

    if (!tab) return null;

    return tab.rows[0];
}

// returns ; sep. string
function findTableFirstColumnJoined(tables, firstColumnName) {
    var tab = findTableFirstColumn(tables, firstColumnName);

    if (!tab) return "";

    return tab
        .map(function(d) {return d.text;})
        .join(';');
}

// return cell[] || null
function findTableFirstColumn(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });

    if (!tab) return null;

    return tab.columns[firstColumnName];
}
