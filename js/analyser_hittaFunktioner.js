var infarter = [/(?:^|[\s\\/\-_&.,:;])KAD(?:$|[\s\\/\-_&.,:;])/i, /Urinavledning/i, /CVK/i, /Picc/i, /SVP/i, /CDK/i, /Venport/i, /(Suprapubiskateter|sp-kateter)/i]; // KAD = urinkateter

var intressantaDKoder = ["A419", "T814", "A415", "A410", "A403", "A418", "A409", "A411", "P369",
                            "A400", "A408", "A414", "A402", "A021", "A401", "A412", "B377", "A413", "P360",
                            "T802", "A392", "A483", "A327", "P364", "P368", "A394", "P362", "G019", "N080",
                            "G079", "I390", "M492", "I398"];

function hittaInfDebut(index){
    if(allaFiltreradeReads[index].hittadFeber.length > 0)
        return allaFiltreradeReads[index].hittadFeber[allaFiltreradeReads[index].hittadFeber.length - 1];
    if(allaFiltreradeReads[index].hittadeKemSvar.length > 0)
        return allaFiltreradeReads[index].hittadeKemSvar[allaFiltreradeReads[index].hittadeKemSvar.length - 1];
    if(allaFiltreradeReads[index].hittadeOdlingar.length > 0)
        return allaFiltreradeReads[index].hittadeOdlingar[allaFiltreradeReads[index].hittadeOdlingar.length - 1];


    return 0;
}

function findDKoderInVtf() {

    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        allaFiltreradeReads[i].hittadeDKoder = [];

        var diagnoserVTF = allaFiltreradeReads[i].Vårdtillfälle.Diagnoser;
        var ÖVård = allaFiltreradeReads[i].ÖppnaVårdkontakter;

        compareKoder(diagnoserVTF, "Vårdtillfälle", allaFiltreradeReads[i].Vårdtillfälle.Utskrivningsdatum, i, 1, "hittadeDKoder");

        for (var l = 0; l < ÖVård.length; l++) {
            compareKoder(ÖVård[l].Diagnoser, "Öppenvård", allaFiltreradeReads[i].ÖppnaVårdkontakter[l].Datum, i, 1, "hittadeDKoder");
        }
    }
}

// Kollar om patienten haft feber under vårdtiden
// När och vilken temperatur
function findFeberMätvärden() {

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var feberDok = allaFiltreradeReads[v].Mätvärden;
        allaFiltreradeReads[v].hittadFeber = [];

        for (var i = 0; i < feberDok.length; i++) {
            if (feberDok[i].Värden.Kroppstemperatur >= 38) {
                var feberData = {temp: feberDok[i].Värden.Kroppstemperatur, datum: feberDok[i].Datum};
                allaFiltreradeReads[v].hittadFeber.push(feberData);
            }
        }
    }
}

function hittaOdlingarMikrobiologi() {
    // Solla ut negativa resultat
    var negatives = /(ej|inte|ingen|inga)\s+(positiv|fynd|påvisa|funne|växt)|\bNegativ|flora/i;

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var mikroBdok = allaFiltreradeReads[v].MikrobiologiSvar;
        allaFiltreradeReads[v].hittadeOdlingar = [];

        for (var i = 0; i < mikroBdok.length; i++) {
            var stycken = mikroBdok[i].Svar.split("\r\n\r\n");
            mikroBdok[i].Stycken = [];

            for (var s = 0; s < stycken.length; s++) {
                var stycke = stycken[s];

                if (negatives.test(stycke)) {
                    continue;
                }
                if(/clostridium, difficile/i.test(stycke)) // En bakterie som alltid är VRI
                    allaFiltreradeReads.VRIscore += 500;

                var odlingData = {svar: stycke, datum: mikroBdok[i].Datum};
                allaFiltreradeReads[v].hittadeOdlingar.push(odlingData);
            }
        }
    }
}


function findInfInJournaltext() {

    var negativInf = /(ej|inte|ingen|inga tecken på|inga kända)\s+(infektion|infektionstecken|sepsis|infektera)|infektionsklinik|desinfekt/i;
    //NANDA 00004 - risk för infektion
    var positivInf = /(infektion|NANDA 00004|sepsis|infektera)/i;

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].infekteradeTexter = [];

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;
            journaltext.replace(negativInf, "");

            if(positivInf.test(journaltext)) {
                allaFiltreradeReads[v].infekteradeTexter.push(journaltexter[i]);
            }
        }
    }
}

function hittaKemSvar() {

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var kemSvarLista = allaFiltreradeReads[v].KemlabSvar;
        allaFiltreradeReads[v].hittadeKemSvar = [];


        for (var i = 0; i < kemSvarLista.length; i++) {
            var kemSvar = kemSvarLista[i];

            for (var j = 0; j < kemSvar.Värden.length; j++) {
                var analys = kemSvar.Värden[j];

                if (/P-CRP|B-Leukocyter/.test(analys.Analysnamn)) {
                    if (analys.Resultat > 9) {
                        var kemSvarData = {analysNamn: analys.Analysnamn, värde: analys.Resultat};
                        allaFiltreradeReads[v].hittadeKemSvar.push(kemSvarData);
                    }
                }
            }

        }
    }
}

function hittaRespirator() {
    var ventilationSökord = /andningsstöd|respirator|intubera|tracheostomi|ventilatorstöd/gi;

    for(var j = 0; j < allaFiltreradeReads.length; j++) {
        var journaltexter = allaFiltreradeReads[j].Journaltexter;
        allaFiltreradeReads[j].hittadRespirator = [];
        var tmpString = "";

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;
            var execList = [];
            var tmpList = [];

            while((execList = ventilationSökord.exec(journaltext)) !== null){
                tmpString = execList[0].charAt().toUpperCase() + execList[0].substr(1).toLowerCase();
                tmpList.push(tmpString);
            }
            if(tmpList.length > 0){
                var vent = {respTyp: tmpList, datum: journaltexter[i].Datum};
                allaFiltreradeReads[j].hittadRespirator.push(vent);
            }
        }

    }
}

function hittaKirurgi() {

    var åtgärdskoder = [];
    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        allaFiltreradeReads[v].hittadeKirurgKoder = [];

        for(var j = 0; j < allaFiltreradeReads[v].ÖppnaVårdkontakter.length; j++){
            åtgärdskoder = allaFiltreradeReads[v].ÖppnaVårdkontakter[j].Åtgärder;
            compareKoder(åtgärdskoder, "Öppenvård", allaFiltreradeReads[v].ÖppnaVårdkontakter[j].Datum, v, 0, "hittadeKirurgKoder");
        }

        åtgärdskoder = allaFiltreradeReads[v].Vårdtillfälle.Åtgärder;
        compareKoder(åtgärdskoder, "Vårdtillfälle", allaFiltreradeReads[v].Vårdtillfälle.Utskrivningsdatum, v, 0, "hittadeKirurgKoder");
    }
}



function compareKoder(kodLista, tillfälleTyp, datumet, index, chosenSearchList, pushHere){
    var kirurgkoder = /^\D{3,}/;
    var regexDKoder = new RegExp("(" + intressantaDKoder.join('|') + ")");
    var sökListor = [kirurgkoder, regexDKoder];
    //var kirurgKoder1 = /^(H|B|J|L|P|E|M|N|F|K|C|Y|T|U|GB|GC|GE|GW|XA|XC|XF|XG|XJ|XK|XL|XN|XP|XX|YC|YF|YG|YJ|YK|YN|YP|YQ|YW)/;
    //var kirurgKoder2 = /^(A|Q|P|D)+\D{2,}|^(GA|GD)+\D/;

    for (var s = 0; s < kodLista.length; s++) {
        if (sökListor[chosenSearchList].test(kodLista[s])) {
            var koddata = {kod: kodLista[s], tillfälle: tillfälleTyp, datum: datumet};
            allaFiltreradeReads[index][pushHere].push(koddata);
        }
    }
}




function hittaDrän() { //Skulle kunna bakas in i Infarter
    var inDatum = new Date();
    var utDatum = new Date();

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeDrän = [];
        var matches = 0;

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;

            if(/drän|dränera|dränage/i.test(journaltext)) {
                matches++;
                if(matches == 1){
                    utDatum = journaltexter[i].Datum;
                }
                inDatum = journaltexter[i].Datum;
            }

        }
        if(matches > 0){
            var dränData = {inDatum: inDatum, utDatum: utDatum};
            allaFiltreradeReads[v].hittadeDrän.push(dränData);
        }
    }
}


function hittaInfarter() {
    var inDatum = new Date();
    var utDatum = new Date();
    var matches = 0;
    var match = [];
    var infartStrings = ["KAD", "Urinavledning", "CVK", "Picc", "SVP", "CDK", "Venport", "Suprapubiskateter"];

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeInfarter = [];

        for (var j = 0; j < infarter.length; j++) {
            matches = 0;
            for (var i = 0; i < journaltexter.length; i++) {
                var journaltext = journaltexter[i].Fritext;

                if(infarter[j].test(journaltext)) {
                    matches++;
                    if(matches == 1){
                        utDatum = journaltexter[i].Datum;
                    }
                    inDatum = journaltexter[i].Datum;
                }
            }
            if(matches > 0){
                var infartData = {typAvInfart: infartStrings[j], inDatum: inDatum, utDatum: utDatum};
                allaFiltreradeReads[v].hittadeInfarter.push(infartData);
            }
        }
    }
}
