
/*
cell: {
    text: string,
    html: string,
    isItalic: bool,
    isBold: bool
}

documentsData: [
    [0..n]: {
        head: {
            category: string,
            data1: string,
            data2: string,
            datestring: string
        },
        body: [
            [0..n]: [
                [1..n]: cell
            ]
        ],
        tables: [
            [0..n]: {
                head: [
                    [1..n]: cell
                ],
                rows: [
                    [1..n]: {
                        columns: [
                            [1..n]: cell
                        ],
                        [th text]: cell
                    }
                ],
                columns: {
                    [th text]: [
                        [0..n]: cell
                    ]
                }
            }
        ]
    }
]
*/

parser.addOutput("Vårdtillfällen", function(parsed) {
    var output = "";

    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];
        if (doc.head.category !== "Vårdtillfälle") continue;

        var tab = findTableFirstRow(doc.tables, "Vårdenhet");
        if (!tab) continue;

        output += tab.Vårdenhet.text + "|" +
            tab.Inskrivningsdatum.text + "|" +
            tab.Utskrivningsdatum.text + "|" +
            findTableFirstColumnJoined(doc.tables, "Diagnoser") +
            "\n";
    }
    return output;
});

parser.addOutput("Öppna vårdkontakter", function(parsed) {
    var output = "";

    for (var i = 0; i < parsed.length; i++) {
        var doc = parsed[i];
        if (doc.head.category !== "Öppen vårdkontakt") continue;

        output += doc.head.data2 + "|" +
            doc.head.datestring + "|" +
            findTableFirstColumnJoined(doc.tables, "Diagnoser") +
            "\n";
    }
    return output;
});

parser.addOutput("JSON", function(parsed) {
    return JSON.stringify(parsed, null, 4);
});

/* HELPER FUNCTIONS */

// returns
function findTableFirstRow(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });

    if (!tab) return "";

    return tab.rows[0];
}

// returns cell[]
function findTableFirstColumnJoined(tables, firstColumnName) {
    var tab = findTableFirstColumn(tables, firstColumnName);

    if (!tab) return "";

    return tab
        .map(function(d) {return d.text;})
        .join(';');
}

function findTableFirstColumn(tables, firstColumnName) {
    var tab = tables.find(function(tbl) {
        return tbl.head[0].text === firstColumnName;
    });

    if (!tab) return null;

    return tab.columns[firstColumnName];
}
