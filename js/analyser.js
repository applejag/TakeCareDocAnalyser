
/*
var read = {
    Vårdtillfällen[0..n]: {
            Rubrik: "" string,
            Inskrivningsdatum: Date,
            Utskrivningsdatum: Date,
            Diagnoser[0..n]: "" string
            Åtgärder[0..n]: "" string
        }
    ],

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
            ["värdenamn"]: number|string
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
    }

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

function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");
    findFeberMätvärden();
    //checkLongestVårdtillfälle();
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

function findFeberMätvärden() {
    var feberdok = read.Mätvärden;
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

    for (var j = 0; j < feberdok.length; j++) {
        console.log(feberdok[j].Datum + " " + feberdok[j].Värden.Kroppstemperatur);
    }
}

function formateraMikrobiologi() {
    list = [
        "positiv",
        "fynd",
        "påvisa",
        "funne",
        "växt"
    ];

    var positives = new RegExp("("+list.join('|')+")", "i");
    var negatives = /(ej|inte|ingen|inga)\s+(positiv|fynd|påvisa|funne|växt)/gi;

    var newMikroB = [];
    var tmp = "";

    for (var i = 0; i < mikroBdok.length; i++) {
        tmp = mikroBdok[i].svar.replace(negatives, "");

        if(positives.test(tmp)){
            newMikroB.push(mikroBdok[i]);
        }
    }
    mikroBdok = newMikroB;
}
