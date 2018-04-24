
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
