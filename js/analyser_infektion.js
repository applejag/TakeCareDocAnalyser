
// Ska kolla utifrån resultat från epikrisen, feber, mikrobiologi svar
// och kemlab svar om patienten har infektion.
function analyseInfectionData() {
    findFeberMätvärden();
    hittaKemSvar();
    hittaOdlingarMikrobiologi();
    findInfInJournaltext();
    findDKoderInVtf();

    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        allaFiltreradeReads[i].hasInfection = false;
        allaFiltreradeReads[i].VRIscore = 0;
        var vriPoints = 0;
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
            harInf = true;
            vriPoints += 50;
        }
        if(allaFiltreradeReads[i].hittadFeber.length > 0 && !harInf)
            vriPoints += 8;
            //hittaFeberDebuter()
        if(allaFiltreradeReads[i].hittadeOdlingar.length > 0 && !harInf)
            vriPoints += 8;
        if(crp.length > 0 && !harInf)
            vriPoints += 8;
        if(leukocyter.length > 0 && !harInf)
            vriPoints += 8;

        if(vriPoints < 50)
            vriPoints += checkIfDatesMatch(i);

        allaFiltreradeReads[i].InfDebut = hittaInfDebut(i);
        if(vriPoints > 32){
            harInf = true;
            vriPoints += infITidEfterInskrivning(i);
        }

        vriPoints += hittasInfEfterUtskrivning(i);

        allaFiltreradeReads[i].VRIscore = vriPoints;
        allaFiltreradeReads[i].hasInfection = harInf;

    }

}

// Kolla om patienten tagit kontakt med vården efter utskrivning
function hittasInfEfterUtskrivning(index){
    var utDatum = allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum;
    var journaltexter = allaFiltreradeReads[index].infekteradeTexter;
    var dkoder = allaFiltreradeReads[index].hittadeDKoder;
    var bonusPoints = 0;

    for (var i = 0; i < journaltexter.length; i++) {
        if(journaltexter[i].Datum > utDatum){
            bonusPoints += 20;
            break;
        }
    }
    for (var j = 0; j < dkoder.length; j++) {
        if(dkoder[j].datum > utDatum){
            bonusPoints += 20;
            break;
        }
    }
    return bonusPoints;
}


// Kollar om fevern upptstått efter Inskrivningsdatum
// Tar i nuläget inte hänsyn till om multipla febrar förekommit under vårdtiden
function infITidEfterInskrivning(index){
    var bonusPoints = 0;

    infDebut = allaFiltreradeReads[index].InfDebut;
    if(infDebut - allaFiltreradeReads[index].Vårdtillfälle.Inskrivningsdatum > 48*60*60*1000){
        bonusPoints = 30;
    } else {
        if(index == 0 && finnsÅtgärderInnanFörstaVtf(index)){
            bonusPoints = + 30;
        }
        else{
            bonusPoints = - 30;
        }
    }
    return bonusPoints;
}


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


/*
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

    var bonusPoints = 0;

    if(feberDebut !== 0){
        if(odlingDebut !== 0){
            if((odlingDebut - feberDebut) < 864000000 && odlingDebut > feberDebut) //864000000 = 10 dygn
                bonusPoints += 9;
        }
        if(kemDebut !== 0){
            if((kemDebut - feberDebut) < 86400000) //86400000 = 24h, 14400000 = 4h
                bonusPoints += 9;
        }
    } else {
        if(kemDebut !== 0){
            if(odlingDebut !== 0){
                if((odlingDebut - kemDebut) < 691200000 && odlingDebut > kemDebut) //691200000 = 8 dygn
                    bonusPoints += 9;
            }
        }
    }
    return bonusPoints;
}
