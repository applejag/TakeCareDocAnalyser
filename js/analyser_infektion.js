
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
            vriPoints += checkIfAfterInskrivning(i);
        }

        vriPoints += checkAfterUtskrivning(i);

        allaFiltreradeReads[i].VRIscore = vriPoints;
        allaFiltreradeReads[i].hasInfection = harInf;

    }

}

// Kolla om patienten tagit kontakt med vården efter utskrivning
function checkAfterUtskrivning(index){
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
            bonusPoints += 30;
            break;
        }
    }
    return bonusPoints;
}


// Kollar om fevern upptstått efter Inskrivningsdatum
// Tar i nuläget inte hänsyn till om multipla febrar förekommit under vårdtiden
function checkIfAfterInskrivning(index){
    var bonusPoints = 0;

    infDebut = allaFiltreradeReads[index].InfDebut;
    if(infDebut - allaFiltreradeReads[index].Vårdtillfälle.Inskrivningsdatum > 172800000){
        bonusPoints = 30;
    } else {
        bonusPoints = - 30;
    }
    return bonusPoints;
}

// Kan behövas om patienten har feber eller inf. när de kommer in
// function hittaFeberDebuter(){
//     feberDagar = allaFiltreradeReads.hittadFeber;
//
//     for (var i = 0; i < feberDagar.length - 1; i++) {
//         if((feberDagar[i + 1] - feberDagar[i]) > 172800000){
//
//         }
//     }
// }


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
    var feberDebut = feberLista[feberLista.length - 1];
    var odlingDebut = odlingLista[odlingLista.length - 1];
    var kemDebut = kemLista[kemLista.length - 1];
    var bonusPoints = 0;

    if(feberDebut !== undefined){
        if(odlingDebut !== undefined){
            if((odlingDebut - feberDebut) < 864000000 && odlingDebut > feberDebut) //864000000 = 10 dygn
                bonusPoints += 9;
        }
        if(kemDebut !== undefined){
            if((kemDebut - feberDebut) < 86400000 && kemDebut > feberDebut) //86400000 = 24h, 14400000 = 4h
                bonusPoints += 9;
        }
    } else {
        if(kemDebut !== undefined){
            if(odlingDebut !== undefined){
                if((odlingDebut - kemDebut) < 691200000 && odlingDebut > kemDebut) //691200000 = 8 dygn
                    bonusPoints += 9;
            }
        }
    }
    return bonusPoints;
}
