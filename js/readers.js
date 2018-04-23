
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
    Journaltexter: [],
    MikrobiologiSvar: [],
    RöntgenSvar: [],
    KemlabSvar: [],
    MultidisciplinäraSvar: [],
    Läkemedelsordinationer: [],

    ParsedDocuments: [],
    DatumMin: Date.parse("2017-02-01"),
    DatumMax: Date.parse("2017-02-28")
};

var read_default = {
    Vårdtillfällen: [],
    ÖppnaVårdkontakter: [],
    Mätvärden: [],
    Journaltexter: [],
    MikrobiologiSvar: [],
    RöntgenSvar: [],
    KemlabSvar: [],
    MultidisciplinäraSvar: [],
    Läkemedelsordinationer: [],

    ParsedDocuments: [],
    DatumMin: Date.parse("2017-02-01"),
    DatumMax: Date.parse("2017-02-28")
};

// parser.addReader = function(category, func(parsed))

parser.addReader("Läkemedelsordination", function(doc) {
    var utdatum = null;
    var läkemedel = [];
    for (var i = 0; i < doc.body.length; i++) {
        var row = doc.body[i];

        if (/^Utsättningsdatum:?\s*$/i.test(row[0].text)) {
            utdatum = parseDate(row[1].text);
        } else {
            läkemedel.push(row[1].text);
        }
    }

    if (läkemedel.length == 0)
        return;

    read.Läkemedelsordinationer.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Utsättningsdatum: utdatum,
        Läkemedel: läkemedel
    });
});

parser.addReader(/^Kemlab svar/i, function(doc) {
    var remittCell = doc.notes[0];
    var remittMatch = /^Remittent:\s*(.*)$/i.exec(remittCell.text);
    var remitt = remittMatch ? remittMatch[1] : "";

    var sjuk = doc.head.category.match(/^Kemlab svar\s*(.*)$/);

    var värden = readAnalysisResultTable(doc.tables);
    if (värden.length === 0) return;
    var outAny = värden.some(function(v) { return v.UtanförIntervall; });

    read.KemlabSvar.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Sjukhus: sjuk ? sjuk[1] : "",
        Remittent: remitt,
        UtanförNågotIntervall: outAny,
        Värden: värden
    });
});

parser.addReader("Multidisciplinärt svar", function(doc) {
    var remittCell = doc.notes[0];
    var remittMatch = /^Remittent:\s*(.*)$/i.exec(remittCell.text);
    var remitt = remittMatch ? remittMatch[1] : "";

    var värden = readAnalysisResultTable(doc.tables);
    if (värden.length === 0) return;
    var outAny = värden.some(function(v) { return v.UtanförIntervall; });

    read.MultidisciplinäraSvar.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Remittent: remitt,
        UtanförNågotIntervall: outAny,
        Värden: värden
    });
});

parser.addReader("Röntgen svar", function(doc) {
    read.RöntgenSvar.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Remittent: findBodySecondColumn(doc.body, /^Remittent:?\s*$/i, true) || "",
        Beställning: findBodySecondColumn(doc.body, /^Beställning:?\s*$/i, true) || "",
        ÖnskadUndersökning: findBodySecondColumn(doc.body, /^Önskad\s*undersökning:?\s*$/i, true) || "",
        Frågeställning: findBodySecondColumn(doc.body, /^Frågeställning:?\s*$/i, true) || "",
        Svar: findBodySecondColumn(doc.body, /^Svar:?\s*$/i, true) || "",
        Utlåtande: findBodySecondColumn(doc.body, /^Utlåtande:?\s*$/i, true) || ""
    });
});

parser.addReader("Mikrobiologi svar", function(doc) {
    read.MikrobiologiSvar.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Remittent: findBodySecondColumn(doc.body, /^Remittent:?\s*$/i, true) || "",
        Undersökning: findBodySecondColumn(doc.body, /^Undersökning:?\s*$/i, true) || "",
        Provmaterial: findBodySecondColumn(doc.body, /^Provmaterial:?\s*$/i, true) || "",
        Svar: findBodySecondColumn(doc.body, /^Svar:?\s*$/i, true) || ""
    });
});

parser.addReader("Journaltext", function(doc) {
    // Måste ha ett journaldokument textträd
    var tree = doc.trees[0];
    if (!tree) return;

    var docType = tree.title.text;
    var signCell = doc.body[0][1];
    var sign = signCell.text;

    read.Journaltexter.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Signeringsansvarig: sign,
        Mall: docType,
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
    var regist = registMatch ? registMatch[1] : "";

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

function readAnalysisResultTable(tables) {
    var tab = findTable(tables, "Analysnamn");
    if (!tab) return;

    var värden = [];
    for (var i = 0; i < tab.rows.length; i++) {
        var row = tab.rows[i];

        var out = row.Resultat.text.indexOf('*') !== -1;

        var result = parseFloat(row.Resultat.text.replace(/,/g, '.').match(/[\d\.]+/));
        if (isNaN(result)) result = row.Resultat.text;

        var refText = row.Referensintervall.text.replace(/,/g, ".");
        var ref = /^(-?[\d.]+)-(-?[\d.]+)|>(-?[\d.]+)|<(-?[\d.]+)$/i.exec(refText);
        var lower = null;
        var upper = null;

        if (ref) {
            if (ref[1] !== undefined) lower = parseFloat(ref[1]);
            if (ref[2] !== undefined) upper = parseFloat(ref[2]);
            if (ref[3] !== undefined) lower = parseFloat(ref[3]);
            if (ref[4] !== undefined) upper = parseFloat(ref[4]);
        }

        värden.push({
            Analysnamn: row.Analysnamn.text,
            Resultat: result,
            UtanförIntervall: out,
            ReferensLägre: lower,
            ReferensÖvre: upper
        });
    }

    return värden;
}

function findBodySecondColumn(body, firstColumnSearch, textOnly) {
    for (var i = 0; i < body.length; i++) {
        var row = body[i];
        if (row[0].text.search(firstColumnSearch) !== -1) {
            return textOnly ? row[1].text : row[1];
        }
    }
    return null;
}

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
