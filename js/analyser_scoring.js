
/*
allaFiltreradeReads[0..n]: {
    /.../

    Score: Number,
    ScoringHistory[0..n]: {
        scoreKod: "" String,
        score: Number,
        orsak: "" String
    }
}
*/

/**
 * @typedef {Object} ScoreKod
 * @prop {String} scoreKod Unique code, ex: "INF13"
 * @prop {Number} score Points for given code
 * @prop {String} orsak Score description
 */

/**
 * @type {Object<string, ScoreKod>}
 */
var scoreKoder = {
    // INF - Infektioner
    INF01: /*07*/ {score: 8, orsak: "Feber under vårdtiden"},
    INF02: /*08*/ {score: 10, orsak: "Hittade odlingar"},
    INF03: /*09*/ {score: 8, orsak: "Högt CRP"},
    INF04: /*10*/ {score: 8, orsak: "LPK utanför intervall"},
    INF05: /*11*/ {score: 25, orsak: "Infektion dök upp >48h efter inskrivning"},
    INF06: /*12*/ {score: 25, orsak: "Journaltexter som tyder på infektion efter utskrivning"},
    INF07: /*13*/ {score: 25, orsak: "Inskriven för infektion efter tidigare kontakt med vård"},
    INF08: /*14*/ {score: 25, orsak: "Diagnoskoder för infektion funna efter utskrivning"},
    INF09: /*15*/ {score: -30, orsak: "Infektion dök upp inom 48h efter inskrivning"},
    INF10: /*16*/ {score: 9, orsak: "Odling funnen samtidigt som feber"},
    INF11: /*17*/ {score: 9, orsak: "Onormalt CRP eller LPK funnet samtidigt som feber"},
    INF12: /*18*/ {score: 9, orsak: "Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK"},
    INF13: /*19*/ {score: 100, orsak: "Diagnoskod för VRI funnen!"},
    INF14: /*20*/ {score: 40, orsak: "Diagnoskoder för infektion funna för vårdtillfället"},
    // ING - Kirurgiska ingrepp
    ING01: /*00*/ {score: 14, orsak: "Har haft någon typ av KAD under vårdtillfället"},
    ING02: /*01*/ {score: 10, orsak: "Har haft dränage under vårdtillfället"},
    ING03: /*02*/ {score: 14, orsak: "Kirurgiskt ingrepp under vårdtillfället"},
    ING04: /*03*/ {score: 5, orsak: "Har fått andningsstöd under vårdtillfället"},
    ING05: /*04*/ {score: 25, orsak: "Diagnoskod tyder samband mellan åtgärdskod och infektion efter utskrivning"},
    ING06: /*05*/ {score: 15, orsak: "Diagnoskod tyder på infektion i samband med åtgärdskoder"},
    ING07: /*06*/ {score: 10, orsak: "Journaltext tyder på infektion i samband med åtgärdskoder"},
    ING08: /*25*/ {score: 25, orsak: "Journaltext tyder samband mellan åtgärdkod och infektion efter utskrivning"},
    ING09: /*27*/ {score: 14, orsak: "Haft central infart under vårdtillfället"},
    // MED - Medicinering
    MED01: /*21*/ {score: 5, orsak: "Har ordinerats cytostatika, steroider, immunhämmande läkemedel eller antibiotika <90 dagar innan vårdtillfället"},
    MED02: /*26*/ {score: 10, orsak: "Kan finnas samband mellan åtgärdskod(er) och ordinerad antibiotika"},
    // SJU - Sjukdomar
    SJU10: /*22*/ {score: 1, orsak: "Hittade ICD-10 diagnoskoder för sjukdom"},
    SJU11: {score: 1, orsak: "Hittade ICD-10 diagnoskod för Njursjukdomar"},
    SJU12: {score: 1, orsak: "Hittade ICD-10 diagnoskod för Diabetes"},
    SJU13: {score: 1, orsak: "Hittade ICD-10 diagnoskod för Lungsjukdomar"},
    SJU14: {score: 1, orsak: "Hittade ICD-10 diagnoskod för Cancer"},
    SJU15: {score: 1, orsak: "Hittade ICD-10 diagnoskod för Kardiovaskulära Sjukdomar"},
    SJU20: /*23*/ {score: 1, orsak: "Hittade spår i epikriser för sjukdom"},
    SJU21: {score: 1, orsak: "Hittade spår i epikriser för Njursjukdomar"},
    SJU22: {score: 1, orsak: "Hittade spår i epikriser för Diabetes"},
    SJU23: {score: 1, orsak: "Hittade spår i epikriser för Lungsjukdomar"},
    SJU24: {score: 1, orsak: "Hittade spår i epikriser för Cancer"},
    SJU25: {score: 1, orsak: "Hittade spår i epikriser för Kardiovaskulära Sjukdomar"},
    SJU30: /*24*/ {score: 1, orsak: "Hittade KVÅ koder för sjukdom"},
    SJU31: {score: 1, orsak: "Hittade KVÅ koder för Njursjukdomar"},
    SJU32: {score: 1, orsak: "Hittade KVÅ koder för Diabetes"},
    SJU33: {score: 1, orsak: "Hittade KVÅ koder för Lungsjukdomar"},
    SJU34: {score: 1, orsak: "Hittade KVÅ koder för Cancer"},
    SJU35: {score: 1, orsak: "Hittade KVÅ koder för Kardiovaskulära Sjukdomar"}
};

for (var kod in scoreKoder) {
    if (scoreKoder.hasOwnProperty(kod)) {
        scoreKoder[kod].scoreKod = kod;
    }
}

/**
 * Lägg till eller ta bort poäng för någon del av analysen.
 * @param {Number} vtf_index Assigned vårdtillfälle
 * @param {String} score_key Index to scoreObjekt in the list scoreKoder
 * @param {String} [reason_override] Override default score description (optional)
 * @returns {Number} New final score for specified vårdtillfälle
 */
function addScore(vtf_index, score_key, reason_override) {
    // Assert
    if (!isNumber(vtf_index)) throw new Error("vtf_index expected number, got "+typeof2(vtf_index));
    if (!isString(score_key)) throw new Error("score_key expected string, got "+typeof2(score_key));
    if (!isString(reason_override) && typeof reason_override !== "undefined") throw new Error("reason_override expected string, got "+typeof2(reason_override));
    if (vtf_index < 0 || vtf_index >= allaFiltreradeReads.length) throw new Error("vtf_index expected 0.."+allaFiltreradeReads.length+", got "+vtf_index);
    if (!scoreKoder[score_key]) throw new Error("score_key \""+score_key+"\" doesn't exist");

    var vtf_object = allaFiltreradeReads[vtf_index];

    // Create score history if none
    if (!(vtf_object.ScoringHistory instanceof Array)) vtf_object.ScoringHistory = [];
    if (!isNumber(vtf_object.Score)) vtf_object.Score = 0;

    var score = scoreKoder[score_key];

    // Custom orsak?
    if (reason_override) {
        // Create copy
        score = {
            scoreKod: score.scoreKod,
            score: score.score,
            orsak: reason_override
        };
    }

    vtf_object.ScoringHistory.push(score);
    vtf_object.Score += score.score;

    return vtf_object.Score;
}
