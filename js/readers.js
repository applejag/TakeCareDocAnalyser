
/**
 * @type {ReadDocuments}
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

/**
 * @type {ReadDocuments}
 */
var read_default = read.cloneDeep();

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
        Remittent: findBodySecondColumnText(doc.body, /^Remittent:?\s*$/i, true) || "",
        Beställning: findBodySecondColumnText(doc.body, /^Beställning:?\s*$/i, true) || "",
        ÖnskadUndersökning: findBodySecondColumnText(doc.body, /^Önskad\s*undersökning:?\s*$/i, true) || "",
        Frågeställning: findBodySecondColumnText(doc.body, /^Frågeställning:?\s*$/i, true) || "",
        Svar: findBodySecondColumnText(doc.body, /^Svar:?\s*$/i, true) || "",
        Utlåtande: findBodySecondColumnText(doc.body, /^Utlåtande:?\s*$/i, true) || ""
    });
});

parser.addReader("Mikrobiologi svar", function(doc) {
    read.MikrobiologiSvar.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Remittent: findBodySecondColumnText(doc.body, /^Remittent:?\s*$/i, true) || "",
        Undersökning: findBodySecondColumnText(doc.body, /^Undersökning:?\s*$/i, true) || "",
        Provmaterial: findBodySecondColumnText(doc.body, /^Provmaterial:?\s*$/i, true) || "",
        Svar: findBodySecondColumnText(doc.body, /^Svar:?\s*$/i, true) || ""
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
    var row = findTableFirstRow(doc.tables, "Vårdenhet");
    if (!row) return; // next doc plz

    // Spara grejer
    read.Vårdtillfällen.push({
        Rubrik: doc.head.data2,
        Inskrivningsdatum: parseDate(row.Inskrivningsdatum.text),
        Utskrivningsdatum: parseDate(row.Utskrivningsdatum.text),
        Diagnoser: findTableFirstColumnText(doc.tables, "Diagnoser", true) || [],
        Åtgärder: findTableFirstColumnText(doc.tables, "Åtgärder", true) || []
    });
});

parser.addReader("Öppen vårdkontakt", function(doc) {
    // Spara grejer
    read.ÖppnaVårdkontakter.push({
        Rubrik: doc.head.data2,
        Datum: doc.head.datetime,
        Diagnoser: findTableFirstColumnText(doc.tables, "Diagnoser", true) || [],
        Åtgärder: findTableFirstColumnText(doc.tables, "Åtgärder", true) || []
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

/**
 * Find second columnd where first column matches {@link firstColumnSearch}
 * @param {ParsedCell[][]} body Parsed document body
 * @param {String} firstColumnSearch Text of first columns
 * @returns {ParsedCell}
 */
function findBodySecondColumn(body, firstColumnSearch) {
    for (var i = 0; i < body.length; i++) {
        var row = body[i];
        if (row[0].text.search(firstColumnSearch) !== -1) {
            return row[1];
        }
    }
    return null;
}

/**
 * Find second columnd where first column matches {@link firstColumnSearch}
 * @param {ParsedCell[][]} body Parsed document body
 * @param {String} firstColumnSearch Text of first columns
 * @returns {ParsedCell}
 */
function findBodySecondColumnText(body, firstColumnSearch) {
    for (var i = 0; i < body.length; i++) {
        var row = body[i];
        if (row[0].text.search(firstColumnSearch) !== -1) {
            return row[1].text;
        }
    }
    return null;
}

/**
 * @param {ParsedDocumentTree} tree 
 * @returns {String}
 */
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

/**
 * @param {ParsedDocumentTable[]} tables List of tables
 * @param {String} firstColumnName Header text of first column
 * @returns {ParsedDocumentTable}
 */
function findTable(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });
    return tab || null;
}

/**
 * @param {ParsedDocumentTable[]} tables List of tables
 * @param {String} firstColumnName Header text of first column
 * @returns {ParsedDocumentTableRow}
 */
function findTableFirstRow(tables, firstColumnName) {
    var tab = findTable(tables, firstColumnName);

    if (!tab) return null;
    if (!tab.rows[0]) return null;
    
    return tab.rows[0];
}

/**
 * @param {ParsedDocumentTable[]} tables List of tables
 * @param {String} firstColumnName Header text of first column
 * @returns {ParsedCell[]}
 */
function findTableFirstColumn(tables, firstColumnName) {
    var tab = findTable(tables, firstColumnName);

    if (!tab) return null;

    return tab.columns[firstColumnName];
}

/**
 * @param {ParsedDocumentTable[]} tables List of tables
 * @param {String} firstColumnName Header text of first column
 * @returns {String[]}
 */
function findTableFirstColumnText(tables, firstColumnName) {
    var tab = findTable(tables, firstColumnName);

    if (!tab) return null;

    return tab.columns[firstColumnName].mapField('text');
}