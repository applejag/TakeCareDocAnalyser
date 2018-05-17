
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
            /Z511/, // Z51.1
            /Z85/ // Z85
        ),
        kvå: _d(
            /V[A-C]/, // VA, VB, VC
            /V[E-H]/, // VE, VF, VG, VH
            /V[L-N]/ // VL, VM, VN
        )
    },
    KardiovaskuläraSjukdomar: {
        icd10: _d(
            ///I109/, // I10.9, hypertoni
            /I2[0-5]/, // I20-I25
            /I50/, // I50
            /I6[0-3]/, // I60-I63, tyder på stroke
            /I670/, // I67.0
            /I676/, // I67.6
            /I677/, // I67.7
            /G45/ // G45
        ),
        epikris: _w(
            // /hypertoni/, // borttaget pga ointressant
            // /flimmer/, // borttaget pga ointressant
            // /stroke/,
            /hjärtsvikt/
        )
    }
};

/**
 * Hämtar från `allaFiltreradeReads[n].Vårdtillfälle`, `allaFiltreradeReads[n].ÖppnaVårdkontakter`
 * och `allaFiltreradeReads[n].Journaltexter`
 * Sparar resultat i `allaFiltreradeReads[n]`
 */
function findSjukdomarInVtfAndÖvk() {
    /**
     * @param {Array<{}>} list List of results
     * @param {RegExp} regex RegExp to find the match for the results list
     * @param {Array<String>} texts List of strings to use the regex on
     * @param {String} dok Document source name
     * @param {Date} datum Date of document
     */
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

    for (var ri = 0; ri < allaFiltreradeReads.length; ri++) {
        var fread = allaFiltreradeReads[ri];
        fread.hittadeSjukdomarICD10 = {};
        fread.hittadeSjukdomarEpikris = {};
        fread.hittadeSjukdomarKVÅ = {};

        // För varje sjukdomskategori...
        for (var sjukdom in sjukdomsRegExp) {
            if (!sjukdomsRegExp.hasOwnProperty(sjukdom)) continue;


            var funnaICD10 = [];
            fread.hittadeSjukdomarICD10[sjukdom] = funnaICD10;
            var icd10 = sjukdomsRegExp[sjukdom].icd10;
            if (icd10) {
                // Leta i vårdtillfället
                var vtf = fread.Vårdtillfälle;
                addResultToList(funnaICD10, icd10, vtf.Diagnoser, 'Vårdtillfälle', vtf.Inskrivningsdatum);

                // För varje Öppen vårdkontakt...
                for (var öi = 0; öi < fread.ÖppnaVårdkontakter.length; öi++) {
                    // Leta efter koder
                    var övk = fread.ÖppnaVårdkontakter[öi];
                    addResultToList(funnaICD10, icd10, övk.Diagnoser, 'Öppen vårdkontakt', övk.Datum);
                }
                if (funnaICD10.length > 0) {
                    var koder = funnaICD10.mapField('Värde').join(', ');
                    // Hittade ICD-10 diagnoskoder för sjukdom
                    addScore(ri, "SJU01", 'Hittade '+funnaICD10.length+'st ICD-10 diagnoskoder för ' + sjukdom+': '+koder);
                }
            }
            

            var funnaEpikris = [];
            fread.hittadeSjukdomarEpikris[sjukdom] = funnaEpikris;
            var epikris = sjukdomsRegExp[sjukdom].epikris;
            if (epikris) {
                // För varje journal...
                for (var ji = 0; ji < fread.Journaltexter.length; ji++) {
                    var j = fread.Journaltexter[ji];
                    // Bara epikriser
                    if (!/epikris/i.test(j.Mall)) continue;
                    // Leta resultat
                    addResultToList(funnaEpikris, epikris, j.Fritext.splitSentences(), 'Epikris', j.Datum);
                }
                if (funnaEpikris.length > 0) {
                    var texter = funnaEpikris.mapField('Värde').join('", "');
                    addScore(ri, "SJU02", 'Hittade spår i epikriser för ' + sjukdom + ' (från nyckelord "'+texter+'")');
                }
            }

            var funnaKVÅ = [];
            fread.hittadeSjukdomarKVÅ[sjukdom] = funnaKVÅ;
            var kvå = sjukdomsRegExp[sjukdom].kvå;
            if (kvå) {
                // Leta i vårdtillfället
                var vtf2 = fread.Vårdtillfälle;
                addResultToList(funnaKVÅ, kvå, vtf2.Åtgärder, 'Vårdtillfälle', vtf2.Inskrivningsdatum);

                // För varje Öppen vårdkontakt...
                for (var öi2 = 0; öi2 < fread.ÖppnaVårdkontakter.length; öi2++) {
                    // Leta efter koder
                    var övk2 = fread.ÖppnaVårdkontakter[öi2];
                    addResultToList(funnaKVÅ, kvå, övk2.Åtgärder, 'Öppen vårdkontakt', övk2.Datum);
                }
                if (funnaKVÅ.length > 0) {
                    var koder2 = funnaKVÅ.mapField('Värde').join(', ');
                    // Hittade KVÅ koder för sjukdom
                    addScore(ri, "SJU03", 'Hittade '+funnaKVÅ.length+'st KVÅ koder för ' + sjukdom+': '+koder2);
                }
            }

        }
    }
}
