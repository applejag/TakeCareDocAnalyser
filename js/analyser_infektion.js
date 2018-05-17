//Diagnoskoder för olika VRI:er
var VRIkoder = /T880|T802|T814|T826|T835|T836|T814|T818|A047|T827/i;

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

        allaFiltreradeReads[i].InfDebut = [];
        allaFiltreradeReads[i].InfDebut = allaFiltreradeReads[i].InfDebut.concat(hittaInfDebuter(i));

        for (var j = 0; j < allaFiltreradeReads[i].hittadeKemSvar.length; j++) {
            if(allaFiltreradeReads[i].hittadeKemSvar[j].analysNamn == "B-Leukocyter")
                leukocyter.push(allaFiltreradeReads[i].hittadeKemSvar[j]);
            if(allaFiltreradeReads[i].hittadeKemSvar[j].analysNamn == "P-CRP")
                crp.push(allaFiltreradeReads[i].hittadeKemSvar[j]);
        }

        if (allaFiltreradeReads[i].hittadeDKoder.length > 0) {
            var tmpKoder = [];
            for (var k = 0; k < allaFiltreradeReads[i].hittadeDKoder.length; k++){
                //if (allaFiltreradeReads[i].hittadeDKoder[k].tillfälle == "Vårdtillfälle"){
                    harInf = true;
                    tmpKoder.push(allaFiltreradeReads[i].hittadeDKoder[k].kod);

                    if (VRIkoder.test(allaFiltreradeReads[i].hittadeDKoder[k].kod)){
                        // Diagnoskod(er) för infektion
                        addScore(i, "INF13", "Diagnoskod för VRI funnen: " + allaFiltreradeReads[i].hittadeDKoder[k].kod);
                    }
                //}
            }
            addScore(i, "INF14", "Diagnoskoder för infektion funna för vårdtillfället: " + tmpKoder.join(", "));
        }

        if(allaFiltreradeReads[i].hittadFeber.length > 0)
            // Feber under vårdtiden
            addScore(i, "INF01");
        if(allaFiltreradeReads[i].hittadeOdlingar.length > 0) // NYTT, FÖR KARTLÄGGNING AV KODER OCH POÄNG
            // Hittade odlingar
            addScore(i, "INF02");
        if(crp.length > 0)
            // Högt CRP
            addScore(i, "INF03");
        if(leukocyter.length > 0)
            // LPK utanför intervall
            addScore(i, "INF04");

        // if(allaFiltreradeReads[i].Score < 50)
        //     checkIfDatesMatch(i);


        if(allaFiltreradeReads[i].InfDebut.length > 0){
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
                // Diagnoskoder för infektion funna efter utskrivning
                addScore(index, "INF08");
                //infektionEfterVtf = dkoder[j].datum;
            }

            if(VRIkoder.test(dkoder[j].kod)){
                // Diagnoskod för VRI funnen!
                addScore(index, "INF13");
                //infektionEfterVtf = dkoder[j].datum;
            }

            onlyScoreForFirstFinding = false;
        }
    }

    onlyScoreForFirstFinding = true;                    // NYTT
    for (var i = 0; i < journaltexter.length; i++) {
        if(journaltexter[i].Datum > utDatum){
            if(onlyScoreForFirstFinding){
                // Journaltexter som tyder på infektion efter utskrivning
                addScore(index, "INF06");
                onlyScoreForFirstFinding = false;
            }
        }
    }
}


/**
* Kollar vilken tid efter inskrivningsdatum som inf uppstått, om >48h ge poäng annars dra av om det inte finns åtgärder gjorda innan
* Om det finns flera infektioner under vtf dras inga poäng
*  @param {Integer} index Anger vilket vårdtillfälle i listan allaFiltreradeReads som ska behandlas
*/
function infITidEfterInskrivning(index){

    infDebut = allaFiltreradeReads[index].InfDebut[0];
    if(infDebut - allaFiltreradeReads[index].Vårdtillfälle.Inskrivningsdatum > 48*60*60*1000){  // NYTT
        // Infektion dök upp >48h efter inskrivning
        addScore(index, "INF05");

    } else {
        if(index == 0 && finnsÅtgärderInnanFörstaVtf(index)){
            // Inskriven för infektion efter tidigare kontakt med vård
            addScore(index, "INF07");
        }
        else{
            if(allaFiltreradeReads[index].InfDebut.length == 1){
                // Infektion dök upp inom 48h efter inskrivning
                addScore(index, "INF09");
            }
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
*
*/
function hittaInfDebuter(index){
    var feber = allaFiltreradeReads[index].hittadFeber;
    var kemSvar = allaFiltreradeReads[index].hittadeKemSvar;
    var odlingar = allaFiltreradeReads[index].hittadeOdlingar;
    var tvådygn = 2*24*60*60*1000;
    var feberList = [];
    var kemList = [];
    var list = [];

    if(feber.length > 0){
        feberList.push(feber[feber.length - 1].datum);
        for (var i = feber.length - 2; i > 0; i--) {
            if((feber[i-1] - feber[i]) > tvådygn)
                feberList.push(feber[i-1]);
        }
    }

    if(kemSvar.length > 0){
        kemList.push(kemSvar[kemSvar.length - 1].datum);
        for (var k = kemSvar.length - 2; k > 0; k--) {
            if((kemSvar[k-1] - kemSvar[k]) > tvådygn)
                kemList.push(kemSvar[k-1]);
        }
    }
    
    if(feberList.length > 0){
        for(var j = 0; j < feberList.length; j++){
            if(checkIfDatesMatch(index, feberList[j], 0))
                list.push(feberList[j]);
        }
    } else {
        for(var l = 0; l < list.length; l++){
            if(checkIfDatesMatch(index, 0, kemList[l]))
                list.push(kemList[l]);
        }
    }

    if(list.length == 0 && allaFiltreradeReads[index].hasInfection){
        if(allaFiltreradeReads[index].infekteradeTexter.length > 0){
            list.push(allaFiltreradeReads[index].infekteradeTexter.datum);    
        }
    }

    return list;
}

/**
* Undersöker om datum för feber, odlingar och crp stämmer överens och ger bonuspoäng därefter
* +10 poäng om kemsvar < 24h efter feber, +10 om odling < 5 dygn efter feber
* Om ingen feber finns jämförs kemsvar och odling, +10 om odling < 4 dygn efter kemsvar
* @param index - Index för det vårdtillfälle du vill undersöka
*/
function checkIfDatesMatch(index, feberDebut, kemDebut){
    var feberLista = allaFiltreradeReads[index].hittadFeber;
    var odlingLista = allaFiltreradeReads[index].hittadeOdlingar; // 3-5 dygn
    var kemLista = allaFiltreradeReads[index].hittadeKemSvar; // 1-4 h
    

    var count = 0;
    if(feberDebut != 0){
        for (var i = 0; i < odlingLista.length; i++){
            if((odlingLista[i] - feberDebut) < 864000000 && odlingLista[i] > feberDebut){ //864000000 = 10 dygn
                // Odling funnen samtidigt som feber
                addScore(index, "INF10");
                count++;
                break;
            }
        }
        for (var j = 0; j < kemLista.length; j++) {
            if((kemLista[j].datum - feberDebut) < 86400000 && kemLista[j].datum > feberDebut){ //86400000 = 24h, 14400000 = 4h
                // Onormalt CRP eller LPK funnet samtidigt som feber
                addScore(index, "INF11");
                count++;
                break;
            }
        }
        if(count >= 1)
            return true;
    } else {
        for (var k = 0; k < odlingLista.length; k++) {
            
            if((odlingLista[k].datum - kemDebut) < 691200000 && odlingLista[k].datum > kemDebut){ //691200000 = 8 dygn
                // Ingen feber men odling funnen samtidigt som onormalt CRP eller LPK
                addScore(index, "INF12");
                return true;
            }
        }
    }
    return false;
}
