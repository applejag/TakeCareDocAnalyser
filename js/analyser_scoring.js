
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
var ingFaktor = 0.6;
var infFaktor = 0.5;
var sambandFaktor = 0.6;
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
    INF01: /*07*/ {score: 2.341*infFaktor, orsak: "Feber under vårdtiden"},
    INF02: /*08*/ {score: 1.597*infFaktor, orsak: "Hittade odlingar"},
    INF03: /*09*/ {score: 1*infFaktor, orsak: "Högt CRP"},
    INF04: /*10*/ {score: 1.491*infFaktor, orsak: "LPK utanför intervall"},
    INF05: /*11*/ {score: 1.468, orsak: "Infektion dök upp >48h efter inskrivning"},
    INF06: /*12*/ {score: 0.49*infFaktor, orsak: "Journaltexter som tyder på infektion efter utskrivning"},
    INF07: /*13*/ {score: 0.2*infFaktor, orsak: "Inskriven för infektion efter tidigare kontakt med vård"}, // hittat på
    INF08: /*14*/ {score: 0.857, orsak: "Diagnoskoder för infektion funna efter utskrivning"},
    INF09: /*15*/ {score: -1, orsak: "Infektion dök upp inom 48h efter inskrivning"}, // hittat på lite
    INF10: /*16*/ {score: 0.001, orsak: "Odling funnen samtidigt som feber"},
    INF11: /*17*/ {score: 1.797, orsak: "Onormalt CRP eller LPK funnet samtidigt som feber"},
    INF12: /*18*/ {score: 0.001, orsak: "Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK"},
    INF13: /*19*/ {score: 5, orsak: "Diagnoskod för VRI funnen!"},
    INF14: /*20*/ {score: 3.229, orsak: "Diagnoskoder för infektion funna för vårdtillfället"},
    // ING - Kirurgiska ingrepp
    ING01: /*00*/ {score: 1.228*ingFaktor, orsak: "Har haft någon typ av KAD under vårdtillfället"},
    ING02: /*01*/ {score: 1.914*ingFaktor, orsak: "Har haft dränage under vårdtillfället"},
    ING03: /*02*/ {score: 0.328*ingFaktor, orsak: "Kirurgiskt ingrepp under vårdtillfället"},
    ING04: /*03*/ {score: 0.283*ingFaktor, orsak: "Har fått andningsstöd under vårdtillfället"},
    ING05: /*04*/ {score: 0.001*sambandFaktor, orsak: "Diagnoskod tyder samband mellan åtgärdskod och infektion efter utskrivning"},
    ING06: /*05*/ {score: 3.227*sambandFaktor, orsak: "Diagnoskod tyder på infektion i samband med åtgärdskoder"},
    ING07: /*06*/ {score: 2.093*sambandFaktor, orsak: "Journaltext tyder på infektion i samband med åtgärdskoder"},
    ING08: /*25*/ {score: 1.278*sambandFaktor, orsak: "Journaltext tyder samband mellan åtgärdkod och infektion efter utskrivning"},
    ING09: /*27*/ {score: 3.207*ingFaktor, orsak: "Haft central infart under vårdtillfället"},
    // MED - Medicinering
    MED01: /*21*/ {score: 0.001, orsak: "Har ordinerats cytostatika, steroider, immunhämmande läkemedel eller antibiotika <90 dagar innan vårdtillfället"},
    MED02: /*26*/ {score: 0.001, orsak: "Kan finnas samband mellan åtgärdskod(er) och ordinerad antibiotika"},
    // SJU - Sjukdomar
    SJU01: /*22*/ {score: 0.001, orsak: "Hittade ICD-10 diagnoskoder för sjukdom"},
    SJU02: /*23*/ {score: 0.553, orsak: "Hittade spår i epikriser för sjukdom"},
    SJU03: /*24*/ {score: 0.001, orsak: "Hittade KVÅ koder för sjukdom"}
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

function calcVRIprobability(){
    var beta0 = -3.40;
    var p_VRI = 0;

    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        var vtfScore = allaFiltreradeReads[i].Score;

        p_VRI = 100*(Math.exp(beta0 + vtfScore)/(1 + Math.exp(beta0 + vtfScore)));

        allaFiltreradeReads[i].VRIsannolikhet = p_VRI.toFixed(2);
    }
}
