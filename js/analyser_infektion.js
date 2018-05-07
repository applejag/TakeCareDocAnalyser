//Diagnoskoder för olika VRI:er
var VRIkoder = /T880|T802|T814|T826|T835|T836|T814|T818|A047/i;

/**
* Ska kolla utifrån resultat från epikrisen, feber, mikrobiologi svar
* och kemlab svar om patienten har infektion.
*/
function analyseInfectionData() {

    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        allaFiltreradeReads[i].hasInfection = false;
        var harInf = false;
        var crp = [];
        var leukocyter = [];

        for (var j = 0; j < allaFiltreradeReads[i].hittadeKemSvar.length; j++) {
            if(allaFiltreradeReads[i].hittadeKemSvar[j].analysNamn == "B-Leukocyter")
                leukocyter.push(allaFiltreradeReads[i].hittadeKemSvar[j]);
            if(allaFiltreradeReads[i].hittadeKemSvar[j].analysNamn == "P-CRP")
                crp.push(allaFiltreradeReads[i].hittadeKemSvar[j]);
        }

        if(allaFiltreradeReads[i].hittadeDKoder.length > 0) {
            var tmpKoder = [];
            for(var k = 0; k < allaFiltreradeReads[i].hittadeDKoder.length; k++){
                if(allaFiltreradeReads[i].hittadeDKoder[k].tillfälle == "Vårdtillfälle"){
                    harInf = true;
                    tmpKoder.push(allaFiltreradeReads[i].hittadeDKoder[k].kod);

                    if(VRIkoder.test(allaFiltreradeReads[i].hittadeDKoder[k].kod)){
                        addScore(index, 19, "Diagnoskod för VRI funnen under vårdtillfället!");
                    }
                }
            }
            addScore(i, 20, "Diagnoskoder för infektion funna för vårdtillfället: " + tmpKoder.join(", "));
        }

        if(allaFiltreradeReads[i].hittadFeber.length > 0 && !harInf)
            addScore(i, 7, "Feber under vårdtiden");
            //hittaFeberDebuter()
        if(allaFiltreradeReads[i].hittadeOdlingar.length > 0 && !harInf)
            addScore(i, 8, "Hittade odlingar");
        if(crp.length > 0 && !harInf)
            addScore(i, 9, "Högt CRP");
        if(leukocyter.length > 0 && !harInf)
            addScore(i, 10, "LPK utanför intervall");

        if(allaFiltreradeReads[i].Score < 50)
            checkIfDatesMatch(i);

        allaFiltreradeReads[i].InfDebut = hittaInfDebut(i);
        if(allaFiltreradeReads[i].Score > 32){
            harInf = true;
            infITidEfterInskrivning(i);
        }

        hittasInfEfterUtskrivning(i);

        allaFiltreradeReads[i].hasInfection = harInf;

    }

}

/**
* Kolla om patienten tagit kontakt med vården efter utskrivning
* @param {Integer} index Anger vilket vårdtillfälle i listan allaFiltreradeReads som ska behandlas
*/
function hittasInfEfterUtskrivning(index){

    var utDatum = allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum;
    var journaltexter = allaFiltreradeReads[index].infekteradeTexter;
    var dkoder = allaFiltreradeReads[index].hittadeDKoder;
    var onlyScoreForFirstFinding = true;

    for (var j = 0; j < dkoder.length; j++) {
        if(dkoder[j].datum > utDatum){
            if (onlyScoreForFirstFinding) {
                addScore(index, 14, "Diagnoskod som tyder på infektion efter utskrivning");
                infektionEfterVtf = dkoder[j].datum;
            }

            if(VRIkoder.test(dkoder[j].kod)){
                addScore(index, 19, "Diagnoskod för VRI funnen efter vårdtillfället!");
                infektionEfterVtf = dkoder[j].datum;
            }

            onlyScoreForFirstFinding = false;
        }
    }

    for (var i = 0; i < journaltexter.length; i++) {
        if(journaltexter[i].Datum > utDatum){
            if(onlyScoreForFirstFinding){
                addScore(index, 12, "Journaltext som tyder på infektion efter utskrivning");
                onlyScoreForFirstFinding = false;
            }
        }
    }
}


/**
* Kollar vilken tid efter inskrivningsdatum som inf uppstått, om >48h ge poäng annars dra av om det inte finns åtgärder gjorda innan
* Tar i nuläget inte hänsyn till om multipla febrar förekommit under vårdtiden
*  @param {Integer} index Anger vilket vårdtillfälle i listan allaFiltreradeReads som ska behandlas
*/
function infITidEfterInskrivning(index){

    infDebut = allaFiltreradeReads[index].InfDebut;
    if(infDebut - allaFiltreradeReads[index].Vårdtillfälle.Inskrivningsdatum > 48*60*60*1000 && infDebut < allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum){
        addScore(index, 11, "Infektion dök upp >48h efter inskrivning");
    } else {
        if(index == 0 && finnsÅtgärderInnanFörstaVtf(index)){
            addScore(index, 13, "Inskriven för infektion efter tidigare kontakt med vård");
        }
        else{
            addScore(index, 15, "Infektion dök upp inom 48h efter inskrivning");
        }
    }
}

/**
* Kollar om det finns åtgärder gjorda innan inskrivning
* @param {Integer} index Anger vilket vårdtillfälle i listan allaFiltreradeReads som ska behandlas
* @return {Boolean} True|False True om åtgärd annars false
*/
function finnsÅtgärderInnanFörstaVtf(index){
    var vtf = allaFiltreradeReads[index];

    for(var i = 0; i < vtf.hittadeInfarter.length - 1; i++){
        if(vtf.hittadeInfarter[i].inDatum < vtf.Vårdtillfälle.Inskrivningsdatum)
            return true;
    }
    for(var j = 0; j < vtf.hittadeDrän.length - 1; j++){
        if(vtf.hittadeDrän[j].inDatum < vtf.Vårdtillfälle.Inskrivningsdatum)
            return true;
    }
    for(var k = 0; k < vtf.hittadeKirurgKoder.length - 1; k++){
        if(vtf.hittadeKirurgKoder[k].datum < vtf.Vårdtillfälle.Inskrivningsdatum)
            return true;
    }
    for(var l = 0; l < vtf.hittadRespirator.length - 1; l++){
        if(vtf.hittadeInfarter[l].datum < vtf.Vårdtillfälle.Inskrivningsdatum)
            return true;
    }

    return false;
}


/**
* Undersöker om datum för feber, odlingar och crp stämmer överens och ger bonuspoäng därefter
* +10 poäng om kemsvar < 24h efter feber, +10 om odling < 5 dygn efter feber
* Om ingen feber finns jämförs kemsvar och odling, +10 om odling < 4 dygn efter kemsvar
* @param index - Index för det vårdtillfälle du vill undersöka
*/
function checkIfDatesMatch(index){
    var feberLista = allaFiltreradeReads[index].hittadFeber;
    var odlingLista = allaFiltreradeReads[index].hittadeOdlingar; // 3-5 dygn
    var kemLista = allaFiltreradeReads[index].hittadeKemSvar; // 1-4 h
    var feberDebut, kemDebut, odlingDebut;

    if(feberLista.length > 0){
        feberDebut = feberLista[feberLista.length - 1].datum;
    } else {
        feberDebut = 0;
    }
    if(kemLista.length > 0){
        kemDebut = kemLista[kemLista.length - 1].datum;
    } else {
        kemDebut = 0;
    }
    if(odlingLista.length > 0){
        odlingDebut = odlingLista[odlingLista.length - 1].datum;
    } else {
        odlingDebut = 0;
    }


    if(feberDebut !== 0){
        if(odlingDebut !== 0){
            if((odlingDebut - feberDebut) < 864000000 && odlingDebut > feberDebut) //864000000 = 10 dygn
                addScore(index, 16, "Odling funnen samtidigt som feber");
        }
        if(kemDebut !== 0){
            if((kemDebut - feberDebut) < 86400000) //86400000 = 24h, 14400000 = 4h
                addScore(index, 17, "Onormalt CRP eller LPK funnet samtidigt som feber");
        }
    } else {
        if(kemDebut !== 0){
            if(odlingDebut !== 0){
                if((odlingDebut - kemDebut) < 691200000 && odlingDebut > kemDebut) //691200000 = 8 dygn
                    addScore(index, 18, "Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK");
            }
        }
    }
}
