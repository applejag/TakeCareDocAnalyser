
/*
allaFiltreradeReads[0..n]: {
    /.../

    Score: Number,
    ScoringHistory[0..n]: {
            scoreKod: "" String,
            score: Number,
            orsak: "" String} // orsak läggs till när addscore körs då den i vissa fall kan variera
    }
}
*/

var scoreKoder = [{scoreKod: "ING01", score: 14, orsak: ""}, {scoreKod: "ING02", score: 10, orsak: ""},
        {scoreKod: "ING03", score: 14, orsak: ""}, {scoreKod: "ING04", score: 5, orsak: ""},
        {scoreKod: "ING05", score: 25, orsak: ""}, {scoreKod: "ING06", score: 15, orsak: ""},
        {scoreKod: "ING07", score: 10, orsak: ""},
        {scoreKod: "INF01", score: 8, orsak: ""}, {scoreKod: "INF02", score: 8, orsak: ""},
        {scoreKod: "INF03", score: 8, orsak: ""}, {scoreKod: "INF04", score: 8, orsak: ""},
        {scoreKod: "INF05", score: 25, orsak: ""}, {scoreKod: "INF06", score: 25, orsak: ""},
        {scoreKod: "INF07", score: 25, orsak: ""}, {scoreKod: "INF08", score: 25, orsak: ""},
        {scoreKod: "INF09", score: -30, orsak: ""}, {scoreKod: "INF10", score: 9, orsak: ""},
        {scoreKod: "INF11", score: 9, orsak: ""}, {scoreKod: "INF12", score: 9, orsak: ""},
        {scoreKod: "INF13", score: 100, orsak: ""}, {scoreKod: "INF14", score: 50, orsak: ""},
        {scoreKod: "MED01", score: 5, orsak: ""},
        {scoreKod: "SJU01", score: 1, orsak: ""}, {scoreKod: "SJU02", score: 1, orsak: ""},
        {scoreKod: "SJU03", score: 1, orsak: ""}, {scoreKod: "ING08", score: 25, orsak: ""}];

/**
 * Lägg till eller ta bort poäng för någon del av analysen.
 * @param {Number} vtf_index Assigned vårdtillfälle
 * @param {Number} scoreCode_index Index to scoreObjekt in the list scoreKoder
 * @param {String} reason_comment Reason behind scoring
 * @returns {Number} New final score for specified vårdtillfälle
 */
function addScore(vtf_index, scoreCode_index, reason_comment) {
    if (!isNumber(vtf_index)) throw new Error("vtf_index expected number, got "+typeof2(vtf_index));
    //if (!isNumber(delta_score)) throw new Error("delta_score expected number, got "+typeof2(delta_score));
    if (!isString(reason_comment)) throw new Error("reason_comment expected string, got "+typeof2(reason_comment));
    if (vtf_index < 0 || vtf_index >= allaFiltreradeReads.length) throw new Error("vtf_index expected 0.."+allaFiltreradeReads.length+", got "+vtf_index);

    var vtf_object = allaFiltreradeReads[vtf_index];

    if (!(vtf_object.ScoringHistory instanceof Array)) vtf_object.ScoringHistory = [];
    if (!isNumber(vtf_object.Score)) vtf_object.Score = 0;

    scoreKoder[scoreCode_index].orsak = reason_comment;

    vtf_object.ScoringHistory.push(scoreKoder[scoreCode_index]);
    vtf_object.Score += scoreKoder[scoreCode_index].score;

    return vtf_object.Score;
}


/*
ING     (Ingreppskoder)                                                                 Index i listan
01    14, "Har haft infart(er) under vårdtillfället");                                  (0)
02    10, "Har haft dränage under vårdtillfället");                                     (1)
03    14, "Kirurgiskt ingrepp under vårdtillfället");                                   (2)
04    5, "Har fått andningsstöd under vårdtillfället");                                 (3)
05    25, Diagnoskod tyder  samband mellan " + åtgärd " och infektion efter utskrivning"(4) Antingen denna eller (25)
06    25, "Diagnoskoder tyder på infektion i samband med " + åtgärd);                   (5) Antingen denna eller (6)
07    25, "Journaltext tyder på infektion i samband med " + åtgärd);                    (6)
08    25, "Journaltext tyder samband mellan " + åtgärd " och infektion efter utskrivning"(25)

INF     (Infektionskoder)
01    8, "Feber under vårdtiden");                                                      (7)
02    8, "Hittade odlingar");                                                           (8)
03    8, "Högt CRP");                                                                   (9)
04    8, "LPK utanför intervall");                                                      (10)
05    20, "Infektion dök upp >48h efter inskrivning");                                  (11)
06    25, "Journaltexter som tyder på infektion efter utskrivning");                    (12) Antingen denna eller (14)
07    15, "Inskriven för infektion efter tidigare kontakt med vård");                   (13)
08    25, "Diagnoskoder för infektion funna efter utskrivning");                        (14)
09    -30, "Infektion dök upp inom 48h efter inskrivning");                             (15)
10    9, "Odling funnen samtidigt som feber");                                          (16)
11    9, "Onormalt CRP eller LPK funnet samtidigt som feber");                          (17)
12    9, "Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK");         (18)
13    100, "Diagnoskod för VRI funnen!");                                               (19)
14    50, "Diagnoskoder för infektion funna för vårdtillfället:"+tmpKoder.join(", "));  (20)

MED     (Medicineringskoder)
01    5, "Har ordinerats läkemedel bla bla... <90 dager innan vtf";                     (21)

SJU     (Sjukdomskoder)
01    1, 'Hittade '+funnaICD10.length+'st ICD-10 diagnoskoder för'+sjukdom+': '+koder); (22)
02    1, 'Hittade spår i epikriser för ' + sjukdom + ' (från nyckelord "'+texter+'")'); (23)
03    1, 'Hittade '+funnaKVÅ.length+'st KVÅ koder för ' + sjukdom+': '+koder2);         (24)

*/
