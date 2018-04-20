
var hasInfection = false;
var allaFiltreradeReads = [];

var infarter = ["KAD", "suprapubiskateter", "urinavledning", "CVK",
                    "picc", "Picc", "SVP", "CDK", "cvk", "cdk", "svp", "kateter", "venport"];

var intressantaDKoder = ["A419", "T814", "A415", "A410", "A403", "A418", "A409", "A411", "P369",
                            "A400", "A408", "A414", "A402", "A021", "A401", "A412", "B377", "A413", "P360",
                            "T802", "A392", "A483", "A327", "P364", "P368", "A394", "P362", "G019", "N080",
                            "G079", "I390", "M492", "I398"];

function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");
    sorteraVTF();
    analyzeInfectionData();
    //checkLongestVårdtillfälle();
    hittaInfarter();
    hittaKemSvar();
    hittaDrän();
    hittaKirurgi();
    hittaRespirator();
    printData();


}


// Ska kolla utifrån resultat från epikrisen, feber, mikrobiologi svar
// och kemlab svar om patienten har infektion.
function analyzeInfectionData() {
    findFeberMätvärden();
    hittaOdlingarMikrobiologi();
    findInfInJournaltext();
    findDKoderInVtf();

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

        //var åKoderVTF = allaFiltreradeReads[v].Vårdtillfälle.Åtgärder.join(" ");
        //var tmpArray = [];
        // var journaltexter = allaFiltreradeReads[v].Journaltexter;
        // for (var i = 0; i < journaltexter.length; i++) {
        //     var journaltext = journaltexter[i];
        // while ((tmpArray = kirurgKoder1.exec(åKoderVTF)) !== null) {
        //     console.log(`Found ${array1[0]}. Next starts at ${regex1.lastIndex}.`);
        //
        // }
        //         var kodData2 = {kod: "???", kodtyp: "Kirurgi", tillfälle: "Vårdtillfälle", datum: journaltext.Datum};
        //         allaFiltreradeReads[i].hittadeKirurgKoder.push(kodData2);
        //     }
        // }




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



function hittaDrän() {

    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeDrän = [];

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;

            if(/drän|dränera|dränage/i.test(journaltext)) {
                allaFiltreradeReads[v].hittadeDrän.push(journaltexter[i].Datum);
            }

        }
    }
}


function hittaInfarter() {
    var tmpStrings = [];
    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        var journaltexter = allaFiltreradeReads[v].Journaltexter;
        allaFiltreradeReads[v].hittadeInfarter = [];

        for (var i = 0; i < journaltexter.length; i++) {
            var journaltext = journaltexter[i].Fritext;

            for (var j = 0; j < infarter.length; j++) {
                if(journaltext.indexOf(infarter[j]) !== -1 && tmpStrings.join(" ").toLowerCase().indexOf(infarter[j].toLowerCase()) == -1) {
                    if(infarter[j].length > 3){
                        tmpStrings.push(infarter[j].charAt().toUpperCase() + infarter[j].substr(1).toLowerCase());
                    } else {
                        tmpStrings.push(infarter[j].toUpperCase());
                    }
                }
            }
            if(tmpStrings.length > 0){
                var infartData = {typAvInfart: tmpStrings.join(", "), datum: journaltexter[i].Datum};
                allaFiltreradeReads[v].hittadeInfarter.push(infartData);
            }
            tmpStrings = [];
        }
    }
}


function checkLongestVårdtillfälle() {
    // Minst 1 tillfälle
    var listan = read.Vårdtillfällen;
    if (listan.length == 0) return;

    var longest;
    var longestSpan;

    for (var i = 1; i < listan.length; i++) {
        var tillfälle = listan[i];
        var span = tillfälle.Utskrivningsdatum - tillfälle.Inskrivningsdatum;

        if (!longest || span > longestSpan)
        {
            longest = tillfälle;
            longestSpan = span;
        }
    }

    var days = longestSpan / 1000 / 60 / 60 / 24;

    console.log("Längsta Vårdtillfälle var " + longest.Rubrik + "\n" +
        "Från: " + longest.Inskrivningsdatum + "\n" +
        "Till " + longest.Utskrivningsdatum + "\n" +
        "(" + Math.round(days) + " dagar!)");
}


function sorteraVTF() {

    var blacklist = ["Vårdtillfällen", "ParsedDocuments"];
    allaFiltreradeReads = [];

    // Äldst först
    read.Vårdtillfällen.sort(function(a,b) {
        return a.Inskrivningsdatum - b.Inskrivningsdatum;
    });

    for (var ti = 0; ti < read.Vårdtillfällen.length; ti++) {
        var tillfälle = read.Vårdtillfällen[ti];
        var yngre = read.Vårdtillfällen[ti+1];

        // new read obj per tillfälle
        var filtreradRead = {
            Vårdtillfälle: tillfälle
        };
        allaFiltreradeReads.push(filtreradRead);

        // Loopa dokument typer, ex: Mätvärden, RöntgenSvar, etc
        for (var dokTyp in read) {
            if (!read.hasOwnProperty(dokTyp))
                continue;
            if (blacklist.indexOf(dokTyp) !== -1)
                continue;

            filtreradRead[dokTyp] = [];

            var origDokLista = read[dokTyp];
            for (var di = 0; di < origDokLista.length; di++) {
                var dok = origDokLista[di];
                // Skippa om för tidig, om inte är första tillfället
                if (dok.Datum < tillfälle.Inskrivningsdatum && ti !== 0)
                    continue;
                // Skippa om det "tillhör" yngre
                if (yngre && dok.Datum >= yngre.Inskrivningsdatum)
                    continue;

                filtreradRead[dokTyp].push(dok);
            }
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
    var negatives = /(ej|inte|ingen|inga)\s+(positiv|fynd|påvisa|funne|växt)|Negativ|flora/i;

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

function printData(){
    for (var v = 0; v < allaFiltreradeReads.length; v++) {
        console.log("Vårdtillfälle: " + allaFiltreradeReads[v].Vårdtillfälle.Inskrivningsdatum.toString().substring(0, 15));
        console.log("");
        console.log("Feber: ");
        for (var kf = 0; kf < allaFiltreradeReads[v].hittadFeber.length; kf++) {
            console.log(allaFiltreradeReads[v].hittadFeber[kf].temp);
        }
        console.log("");
        console.log("Hittade odlingar:");
        for (var ko = 0; ko < allaFiltreradeReads[v].hittadeOdlingar.length; ko++) {
            console.log(allaFiltreradeReads[v].hittadeOdlingar[ko].svar);
        }
        console.log("");
        console.log("Texter som tyder på infektion:");
        for (var ki = 0; ki < allaFiltreradeReads[v].infekteradeTexter.length; ki++) {
            console.log(allaFiltreradeReads[v].infekteradeTexter[ki].Datum.toString().substring(0, 15));
        }
        console.log("");
        console.log("Hittade diagnoskoder:");
        for (var kd = 0; kd < allaFiltreradeReads[v].hittadeDKoder.length; kd++) {
            console.log(allaFiltreradeReads[v].hittadeDKoder[kd].kod);
        }
        console.log("");
        console.log("Insatta infarter:");
        for (var ii = 0; ii < allaFiltreradeReads[v].hittadeInfarter.length; ii++) {
            console.log(allaFiltreradeReads[v].hittadeInfarter[ii].typAvInfart + " " + allaFiltreradeReads[v].hittadeInfarter[ii].datum.toString().substring(0, 15));
        }
        console.log("");
        console.log("Kemsvar:");
        for (var kk = 0; kk < allaFiltreradeReads[v].hittadeKemSvar.length; kk++) {
            console.log(allaFiltreradeReads[v].hittadeKemSvar[kk].analysNamn);
        }
        console.log("");
        console.log("Insatta drän:");
        for (var id = 0; id < allaFiltreradeReads[v].hittadeDrän.length; ii++) {
            console.log(allaFiltreradeReads[v].hittadeDrän[id].toString().substring(0, 14));
        }
        console.log("");
        console.log("Kirurgiska ingrepp:");
        for (var k = 0; k < allaFiltreradeReads[v].hittadeKirurgKoder.length; k++) {
            console.log(allaFiltreradeReads[v].hittadeKirurgKoder[k].kod);
        }
        console.log("");
        console.log("Hittad respirator:");
        for (var l = 0; l < allaFiltreradeReads[v].hittadRespirator.length; l++) {
            console.log(allaFiltreradeReads[v].hittadRespirator[l].respTyp + " " + allaFiltreradeReads[v].hittadRespirator[l].datum.toString().substring(0, 15));
        }
        console.log("");
    }
}
