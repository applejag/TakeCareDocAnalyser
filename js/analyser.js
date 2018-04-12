
/*
var read = {
    Vårdtillfällen[0..n]: {
        Rubrik: "" string,
        Inskrivningsdatum: Date,
        Utskrivningsdatum: Date,
        Diagnoser[0..n]: "" string
        Åtgärder[0..n]: "" string
    }

    ÖppnaVårdkontakter[0..n]: {
        Rubrik: "" string,
        Datum: Date,
        Diagnoser[0..n]: "" string
        Åtgärder[0..n]: "" string
    }

    Mätvärden[0..n]: {
        Rubrik: "" string,
        Datum: Date,
        RegistreradAv: "" string,
        Värden: {
            ["värdenamn"]: string|number
        }
    }

    Journaltexter[0..n]: {
        Rubrik: "" string,
        Datum: Date,
        Signeringsansvarig: "" string,
        Fritext: "" string
    }

    MikrobiologiSvar[0..n]: {
        Rubrik: "" string,
        Datum: Date,
        Remittent: "" string,
        Undersökning: "" string,
        Provmaterial: "" string,
        Svar: "" string
    },

    RöntgenSvar[0..n]: {
        Rubrik: "" string,
        Datum: Date,
        Remittent: "" string,
        Beställning: "" string,
        ÖnskadUndersökning: "" string,
        Frågeställning: "" string,
        Svar: "" string,
        Utlåtande: "" string
    },

    KemlabSvar[0..n] {
        Rubrik: "" string,
        Datum: Date,
        Sjukhus: "" string,
        Remittent: "" string,
        UtanförNågotIntervall: true|false,
        Värden[1..n]: {
            Analysnamn: "" string,
            Resultat: number|string,
            UtanförIntervall: true|false,
            ReferensLägre: number|null,
            ReferensÖvre: number|null,
        },
    }
};
//*/
var hasInfection = false;
var allaFiltreradeReads = [];

function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");
    //sorteraVTF();
    analyzeInfectionData();
    checkLongestVårdtillfälle();
}


// Ska kolla utifrån resultat från epikrisen, feber, mikrobiologi svar
// och kemlab svar om patienten har infektion.
function analyzeInfectionData() {
    // Om infektion finnes i journaltexten sätt hasInfection=true
    // och hoppa över resten
    var feberdagar = findFeberMätvärden();
    var odlingar = hittaOdlingarMikrobiologi();
    var infektionstexter = findInfInJournaltext();
    var funnaDKoder = findInfInVtf();
    //hittaInfarter();
    // var dåligaKemSvar = findIrregularKemSvar();


    console.log("Dagar med feber:");
    for (var j = 0; j < feberdagar.length; j++) {
        console.log(feberdagar[j].Datum + " " + feberdagar[j].Värden.Kroppstemperatur);
    }
    console.log("");
    console.log("Odlingar och tester:\n");
    for (var i = 0; i < odlingar.length; i++) {
        console.log(odlingar[i].Datum, odlingar[i].Stycken);
    }
    console.log("");
    console.log("Antal journaltexter som tyder på infektion: " + infektionstexter.length);
    console.log("");
    console.log("Funna diagnoskoder för infektion: " + funnaDKoder.join(", "));
}


function hittaInfarter() {         // FIXA SEN TILL allaFiltreradeReads
    var journaltexter = read.Journaltexter;
    var infarter = [];
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

    for (var ti = 0; ti < read.Vårdtillfällen.length; ti++) {
        var tillfälle = read.Vårdtillfällen[ti];
        var nästa = read.Vårdtillfällen[ti+1];
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
            for (var di = origDokLista.length-1; di > -1 ; di--) {
                var dok = origDokLista[di];
                // Skippa om för tidig
                if (dok.Datum < tillfälle.Inskrivningsdatum)
                    continue;
                // Skippa om det "tillhör" nästa
                if (nästa && dok.Datum >= nästa.Inskrivningsdatum)
                    continue;

                filtreradRead[dokTyp].push(dok);
            }
        }

    }

}


function findInfInVtf() {
    var vtf = read.Vårdtillfällen; // FIXA SEN TILL allaFiltreradeReads
    var resultatKoder = [];
    var dKoder = ["A419", "T814", "A415", "A410", "A403", "A418", "A409",
                    "A411", "P369", "A400", "A408", "A414", "A402", "A021",
                    "A401", "A412", "B377", "A413", "P360", "T802", "A392",
                    "A483", "A327", "P364", "P368", "A394", "P362", "G019*",
                    "N080*", "G079*", "I390*", "M492*", "I398*"];

    for (var i = 0; i < vtf.length; i++) {
        for (var j = 0; j < vtf[i].Diagnoser.length; j++) {
            for (var k = 0; k < dKoder.length; k++) {
                if(vtf[i].Diagnoser[j] == dKoder[k]) {
                    resultatKoder.push(dKoder[k]);
                }
            }
        }
    }
    return resultatKoder;
}


// Kollar om patienten haft feber under vårdtiden
// När och vilken temperatur
function findFeberMätvärden() {
    var feberdok = read.Mätvärden; // FIXA SEN TILL allaFiltreradeReads
    var tmpFeberdok = [];

    for (var i = 0; i < feberdok.length; i++) {
        if (feberdok[i].Värden.Kroppstemperatur >= 38) {
            tmpFeberdok.push(feberdok[i]);
        }
    }

    if (tmpFeberdok.length>0) {
        funnitsFeber = true;
    }
    feberdok = tmpFeberdok;

    return feberdok;
}

function hittaOdlingarMikrobiologi() {
    var mikroBdok = read.MikrobiologiSvar; // FIXA SEN TILL allaFiltreradeReads

    // Solla ut negativa resultat

    var negatives = /(ej|inte|ingen|inga)\s+(positiv|fynd|påvisa|funne|växt)|Negativ|blandflora|uretraflora/i;

    for (var i = 0; i < mikroBdok.length; i++) {

        var stycken = mikroBdok[i].Svar.split("\r\n\r\n");
        mikroBdok[i].Stycken = [];

        for (var s = 0; s < stycken.length; s++) {
            var stycke = stycken[s];

            if (negatives.test(stycke)) {
                continue;
            }

            mikroBdok[i].Stycken.push(stycke);
        }
    }

    mikroBdok = mikroBdok.filter(function(d) {
        return d.Stycken.length>0;
    });

    // Echo

    return mikroBdok;
}


function findInfInJournaltext() {
    var journaltexter = read.Journaltexter; // FIXA SEN TILL allaFiltreradeReads
    var infekteradeTexter = [];

    var negativInf = /(ej|inte|ingen|inga tecken på)\s+(infektion|infektionstecken|sepsis|infektera)|infektionsklinik/i;
    //NANDA 00004 - risk för infektion
    var positivInf = /(infektion|NANDA 00004|sepsis|infektera)/i;

    for (var i = 0; i < journaltexter.length; i++) {

        var journaltext = journaltexter[i].Fritext;
        journaltext.replace(negativInf, "");

        if(positivInf.test(journaltext)) {
            infekteradeTexter.push(journaltexter[i]);
        }
    }

    return infekteradeTexter;
}

// Om infection = false kolla framåt i akutjournaler, telefonkontakt
// efter infektionstecken. Därefter kolla nästa vtf.

// Om sant borde man kolla när den uppstått under vårdtillfället

/*Funktion för
    Vilka vtf
    När uppstod Infektionen
    Har åtgärder gjorts (infarter, drän, operationer) och när
    jämför inlägging/åtgärd med uppkomst - [tid]
*/
