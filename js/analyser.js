
var allaFiltreradeReads = [];


function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");
    sorteraVTF();

    hittaInfarter();
    hittaDrän();
    hittaKirurgi();
    hittaRespirator();
    findFeberMätvärden();
    hittaKemSvar();
    hittaOdlingarMikrobiologi();
    findInfInJournaltext();
    findDKoderInVtf();

    analyseInfectionData();
    analyseÅtgärder();
    //checkLongestVårdtillfälle();

    printData();

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

    var blacklist = ["Vårdtillfällen", "ParsedDocuments", "DatumMin", "DatumMax"];
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
            Vårdtillfälle: tillfälle,
            ScoringHistory: [],
            Score: 0
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
            console.log(allaFiltreradeReads[v].hittadeInfarter[ii].typAvInfart + " " + allaFiltreradeReads[v].hittadeInfarter[ii].inDatum.toString().substring(0, 15) + " - " + allaFiltreradeReads[v].hittadeInfarter[ii].utDatum.toString().substring(0, 15));
        }
        console.log("");
        console.log("Kemsvar:");
        for (var kk = 0; kk < allaFiltreradeReads[v].hittadeKemSvar.length; kk++) {
            console.log(allaFiltreradeReads[v].hittadeKemSvar[kk].analysNamn + " " + allaFiltreradeReads[v].hittadeKemSvar[kk].värde);
        }
        console.log("");
        console.log("Insatta drän:");
        for (var id = 0; id < allaFiltreradeReads[v].hittadeDrän.length; id++) {
            console.log(allaFiltreradeReads[v].hittadeDrän[id].inDatum.toString().substring(0, 15) + " - " + allaFiltreradeReads[v].hittadeDrän[id].utDatum.toString().substring(0, 15));
        }
        console.log("");
        console.log("Kirurgiska ingrepp:");
        for (var k = 0; k < allaFiltreradeReads[v].hittadeKirurgKoder.length; k++) {
            console.log(allaFiltreradeReads[v].hittadeKirurgKoder[k].kod);
        }
        console.log("");
        console.log("Hittat andningsstöd:");
        for (var l = 0; l < allaFiltreradeReads[v].hittadRespirator.length; l++) {
            console.log(allaFiltreradeReads[v].hittadRespirator[l].datum.toString().substring(0, 15));
        }
        console.log("");

        for (var i = 0; i < allaFiltreradeReads[v].ScoringHistory.length; i++) {
            console.log(allaFiltreradeReads[v].ScoringHistory[i].delta + " : " + allaFiltreradeReads[v].ScoringHistory[i].reason);
        }
        console.log("= " + allaFiltreradeReads[v].Score);
    }
}
