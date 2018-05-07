
/*
allaFiltreradeReads[0..n]: {
    /.../

    Score: Number,
    ScoringHistory[0..n]: {
        delta: Number,
        reason: "" String
    }
}
*/

/**
 * Lägg till eller ta bort poäng för någon del av analysen.
 * @param {Number} vtf_index Assigned vårdtillfälle
 * @param {Number} delta_score Score to add/subtract
 * @param {String} reason_comment Reason behind scoring
 * @returns {Number} New final score for specified vårdtillfälle
 */
function addScore(vtf_index, delta_score, reason_comment) {
    if (!isNumber(vtf_index)) throw new Error("vtf_index expected number, got "+typeof2(vtf_index));
    if (!isNumber(delta_score)) throw new Error("delta_score expected number, got "+typeof2(delta_score));
    if (!isString(reason_comment)) throw new Error("reason_comment expected string, got "+typeof2(reason_comment));
    if (vtf_index < 0 || vtf_index >= allaFiltreradeReads.length) throw new Error("vtf_index expected 0.."+allaFiltreradeReads.length+", got "+vtf_index);

    var vtf_object = allaFiltreradeReads[vtf_index];

    if (!(vtf_object.ScoringHistory instanceof Array)) vtf_object.ScoringHistory = [];
    if (!isNumber(vtf_object.Score)) vtf_object.Score = 0;

    vtf_object.ScoringHistory.push({
        delta: delta_score,
        reason: reason_comment
    });
    vtf_object.Score += delta_score;

    return vtf_object.Score;
}

/*
* scoreObjekt = {scoreKod: ,
*               score: ,
*               orsak: }
*/

var scoreKoder = [{scoreKod: , orsak: }];


/*
ING     (Ingreppskoder)
01    14, "Har haft infart(er) under vårdtillfället"); 
02    10, "Har haft dränage under vårdtillfället");  
03    14, "Kirurgiskt ingrepp under vårdtillfället");
04    5, "Har fått andningsstöd under vårdtillfället");
05    25, "Journaltext och diagnoskoder tyder på infektion i samband med " + åtgärd);
06    15, "Diagnoskoder tyder på infektion i samband med " + åtgärd);      
07    10, "Journaltext tyder på infektion i samband med " + åtgärd);

INF     (Infektionskoder)
01    8, "Feber under vårdtiden");       
02    8, "Hittade odlingar");
03    8, "Högt CRP");
04    8, "LPK utanför intervall");      
05    15, "Journaltexter som tyder på infektion efter utskrivning");               
06    20, "Infektion dök upp >48h efter inskrivning"); 
07    15, "Inskriven för infektion efter tidigare kontakt med vård");  
08    -30, "Infektion dök upp inom 48h efter inskrivning");
09    9, "Odling funnen samtidigt som feber");   
10    9, "Onormalt CRP eller LPK funnet samtidigt som feber");      
11    9, "Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK");
12    15, "Diagnoskoder för infektion funna efter utskrivning");
13    100, "Diagnoskod för VRI funnen!");
14    50, "Diagnoskoder för infektion funna för vårdtillfället: " + tmpKoder.join(", "));

MED     (Medicineringskoder)
01    1, "Har ordinerats cytostatika, steroider, immunhämmande läkemedel eller antibiotika <90 dagar innan vårdtillfället");

SJU     (Sjukdomskoder)
01    1, 'Hittade '+funnaICD10.length+'st ICD-10 diagnoskoder för ' + sjukdom+': '+koder);
02    1, 'Hittade spår i epikriser för ' + sjukdom + ' (från nyckelord "'+texter+'")');
03    1, 'Hittade '+funnaKVÅ.length+'st KVÅ koder för ' + sjukdom+': '+koder2);

*/