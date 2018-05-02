var infarter = [/(?:^|[\s\\/\-_&.,:;])KAD(?:$|[\s\\/\-_&.,:;])/i, /Urinavledning/i, /CVK/i, /Picc/i, /SVP/i, /CDK|dialyskateter/i, /Venport/i, /(Suprapubiskateter|sp-kateter)/i]; // KAD = urinkateter

//Diagnoskoder för olika infektioner
var intressantaDKoder = ["(A|B|T814|T802|T835|T880|T802|T814|T826|T835|T836|T814|T818|R572|R651|I39|N0[0-5]|N1[0-2]|N30|N330|N34|",
            "N35|N390|N41|O862|O863|O98|Z22|E06|L0[0-5]|L08|K12|K102|K112|K113|K130|J0[0-6]|J09|J1[0-8]|J2[0-2]|",
            "J32|J37|J69|G0[1-8]|G61|M0[0-3]|M0[5-9]|M1[0-4]|M3[0-5]|M45|M46|M60|M63|M86|H01|H10|H16|H20|H30|H46|D709C)"];

//Diagnoskoder för olika VRI:er
var VRIkoder = /T880|T802|T814|T826|T835|T836|T814|T818|A047/i;

function hittaInfDebut(index){
    if(allaFiltreradeReads[index].hittadFeber.length > 0)
        return allaFiltreradeReads[index].hittadFeber[allaFiltreradeReads[index].hittadFeber.length - 1].datum;
    if(allaFiltreradeReads[index].hittadeKemSvar.length > 0)
        return allaFiltreradeReads[index].hittadeKemSvar[allaFiltreradeReads[index].hittadeKemSvar.length - 1].datum;
    if(allaFiltreradeReads[index].hittadeOdlingar.length > 0)
        return allaFiltreradeReads[index].hittadeOdlingar[allaFiltreradeReads[index].hittadeOdlingar.length - 1].datum;


    return 0;
}

function hittaMedicinering(){
    var ordinationer = read.Läkemedelsordinationer;
    var hittadRiskMedicin = [];
    var treMånaderInnanFeb = new Date(2016, 11, 1);

    for (var i = 0; i < ordinationer.length; i++) {
        for (var j = 0; j < ordinationer[i].Läkemedel.length; j++) {
            läkemedel = ordinationer[i].Läkemedel[j];
            var tmp = ATC.findATC(läkemedel);
            if(tmp !== null){
                if(ordinationer[i].Utsättningsdatum > treMånaderInnanFeb) {
                    var läkemedelData = {läkemedel: läkemedel, inDatum: ordinationer[i].Datum, utDatum: ordinationer[i].Utsättningsdatum};
                    hittadRiskMedicin.push(läkemedelData);
                }
            }
        }
    }

    for(var v = 0; v < allaFiltreradeReads.length; v++){
        allaFiltreradeReads[v].hittadRiskMedicin = hittadRiskMedicin;
    }

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
                    if ((analys.Analysnamn == "P-CRP" && analys.Resultat > 10) || (analys.Analysnamn == "B-Leukocyter" && analys.UtanförIntervall == true)) {
                        var kemSvarData = {analysNamn: analys.Analysnamn, värde: analys.Resultat, datum: kemSvar.Datum};
                        allaFiltreradeReads[v].hittadeKemSvar.push(kemSvarData);
                    }
                }
            }

        }
    }
}

function hittaRespirator() {
    var ventilationSökord = /andningsstöd|respirator\b|respiratorstöd|intubera|tracheostomi|ventilatorstöd/i;

    for(var j = 0; j < allaFiltreradeReads.length; j++) {
        var journaltexter = allaFiltreradeReads[j].Journaltexter;
        allaFiltreradeReads[j].hittadRespirator = [];
        var tmpString = "";

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;
            var execList = [];
            var tmpList = [];

            if(ventilationSökord.test(journaltext)){//while((execList = ventilationSökord.exec(journaltext)) !== null){
                //tmpString = execList[0].charAt().toUpperCase() + execList[0].substr(1).toLowerCase();
                //tmpList.push(tmpString);
                //var vent = {respTyp: tmpList, datum: journaltexter[i].Datum};
                allaFiltreradeReads[j].hittadRespirator.push(journaltexter[i].Datum);
            }
            // if(tmpList.length > 0){
            //     var vent = {respTyp: tmpList, datum: journaltexter[i].Datum};
            //     allaFiltreradeReads[j].hittadRespirator.push(vent);
            // }
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
    var regexDKoder = new RegExp(intressantaDKoder.join(''), "i");
    var sökListor = [kirurgkoder, regexDKoder];
    //var kirurgKoder1 = /^(H|B|J|L|P|E|M|N|F|K|C|Y|T|U|GB|GC|GE|GW|XA|XC|XF|XG|XJ|XK|XL|XN|XP|XX|YC|YF|YG|YJ|YK|YN|YP|YQ|YW)/;
    //var kirurgKoder2 = /^(A|Q|P|D)+\D{2,}|^(GA|GD)+\D/;

    for (var s = 0; s < kodLista.length; s++) {
        if (sökListor[chosenSearchList].test(kodLista[s])) {
            var koddata = {kod: kodLista[s], tillfälle: tillfälleTyp, datum: datumet};
            allaFiltreradeReads[index][pushHere].push(koddata);

            if(VRIkoder.test(koddata.kod)){
                addScore(index, 100, "Diagnoskod för VRI funnen!");
            }
        }
    }
}


function hittaDrän() {
    var inDatum = new Date();
    var utDatum = new Date();

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeDrän = [];
        var matches = 0;

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;

            if(/\bdrän\b|dränera|dränage/i.test(journaltext)) {
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
    var negatives = /(vägrar|inte|ej|förnekar|ingen)/i;
    var infartStrings = ["KAD", "Urinavledning", "CVK", "Picc", "SVP", "CDK", "Venport", "Suprapubiskateter"];

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeInfarter = [];
        var startIndex = 0;

        for (var j = 0; j < infarter.length; j++) {
            matches = 0;
            for (var i = 0; i < journaltexter.length; i++) {
                var journaltext = journaltexter[i].Fritext;

                if(infarter[j].test(journaltext)) {
                    match = infarter[j].exec(journaltext);
                    if(match.index >= 12){
                        startindex = match.index - 12;
                    } else {
                        startIndex = 0;
                    }

                    if(!negatives.test(journaltext.substr(startIndex, match.index))){
                        matches++;
                        if(matches == 1){
                            utDatum = journaltexter[i].Datum;
                        }
                        inDatum = journaltexter[i].Datum;
                    }
                }
            }
            if(matches > 0){
                var infartData = {typAvInfart: infartStrings[j], inDatum: inDatum, utDatum: utDatum};
                allaFiltreradeReads[v].hittadeInfarter.push(infartData);
            }
        }
    }
}
