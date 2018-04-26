
/*

# Hämtar från `read.Vårdtillfällen`, `read.ÖppnaVårdkontakter`
# och `read.Journaltexter`
# Sparar resultat i `hittadeSjukdomar`
findSjukdomarInVtfAndÖvk();

hittadeSjukdomar: {
    ['kategori'][0..n]: {
        Värde: "" String,
        Dokument: "" String,
        Datum: Date
    }
}
*/

var hittadeSjukdomar = {};

function _d() {
    var _ = Array.from(arguments).mapField('source');
    return new RegExp('^(?:'+_.join('|')+').*$', 'i');
}

function _w() {
    var _ = Array.from(arguments).mapField('source');
    return new RegExp('\\b(?:'+_.join('|')+')\\b', 'i');
}

var sjukdomsRegExp = {
    Njursjukdomar: {
        icd10: _d(
            /N[0-2][0-9]/ // N00-N29
        )
    },
    Diabetes: {
        icd10: _d(
            /E1[0-4]/ // E10-E14
        ),
        epikris: _w(
            /\w*diabetes/
        )
    },
    Lungsjukdomar: {
        icd10: _d(
            /J4[0-6]/, // J40-J46
            /D860/ // D86.0
        )
    },
    Cancer: {
        icd10: _d(
            /(?:C[0-8][0-9]|C9[0-7])/, // C00-C97
            /D0[0-9]/, // D00-D09
            /(?:D3[7-9]|D4[0-8])/, // D37-D48
            /Z85/ // Z85
        )
    },
    KardiovaskuläraSjukdomar: {
        icd10: _d(
            ///I109/, // I10.9, hypertoni
            /I2[0-5]/, // I20-I25
            /I50/, // I50
            /I6[0-9]/ // I60-I69, tyder på stroke
        ),
        epikris: _w(
            // /hypertoni/,
            // /flimmer/,
            /stroke/,
            /hjärtsvikt/
        )
    }
};

function findSjukdomarInVtfAndÖvk() {
    hittadeSjukDKoder = {};

    function addResultToList(list, regex, texts, dok, datum) {
        for (var i = 0; i < texts.length; i++) {
            var result = regex.exec(texts[i]);

            if (!result || result.length === 0) continue;
            var value = result[result.length - 1];

            // Om diagnosen inte redan är funnen
            if (list.mapField('Värde').indexOfCaseInsensitive(value) !== -1)
                continue;

            // Då spara koden
            list.push({Värde: value, Dokument: dok, Datum: datum});
        }
    }

    // För varje sjukdomskategori...
    for (var sjukdom in sjukdomsRegExp) {
        if (!sjukdomsRegExp.hasOwnProperty(sjukdom)) continue;

        var funnaResultat = [];
        var icd10 = sjukdomsRegExp[sjukdom].icd10;
        var epikris = sjukdomsRegExp[sjukdom].epikris;

        if (icd10) {
            // För varje Vårdtillfälle...
            for (var vi = 0; vi < read.Vårdtillfällen.length; vi++) {
                // Leta efter koder
                var vtf = read.Vårdtillfällen[vi];
                addResultToList(funnaResultat, icd10, vtf.Diagnoser, 'Vårdtillfälle', vtf.Inskrivningsdatum);
            }

            // För varje Öppen vårdkontakt...
            for (var öi = 0; öi < read.ÖppnaVårdkontakter.length; öi++) {
                // Leta efter koder
                var övk = read.ÖppnaVårdkontakter[öi];
                addResultToList(funnaResultat, icd10, övk.Diagnoser, 'Öppen vårdkontakt', övk.Datum);
            }
        }

        if (epikris) {
            // För varje journal...
            for (var ji = 0; ji < read.Journaltexter.length; ji++) {
                var j = read.Journaltexter[ji];
                // Bara epikriser
                if (!/epikris/i.test(j.Mall)) continue;
                // Leta resultat
                addResultToList(funnaResultat, epikris, j.Fritext.splitSentences(), 'Epikris', j.Datum);
            }
        }

        // Spara sjukdomens matachade diagnoser
        hittadeSjukDKoder[sjukdom] = funnaResultat;

        if (funnaResultat.length > 0) {
            var koder = funnaResultat.map(function(o) {return o.Värde;});
            console.log("-> hittade ("+funnaResultat.length+") " + koder.join(',') + " för " + sjukdom);
        }
    }
}
