
/**
 * @type {FiltreradRead[]}
 */
var allaFiltreradeReads = [];

function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");
    sättIhopVTF();
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
    findSjukdomarInVtfAndÖvk();
    hittaMedicinering();
    hittaCytostatika();

    analyseInfectionData();
    analyseÅtgärder();
    analyseMedicinering();
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

/**
 * I de fall en patient flyttats mellan avdelningar och fått flera olika vårdtillfällen
 * sätter denna funktion ihop dem till ett
 */
function sättIhopVTF(){
    var vtf = read.Vårdtillfällen;
    var ettdygn = 24*60*60*1000; //ms
    var satellit = false;

    // äldst först
    vtf.sort(function(a,b) {
        return a.Inskrivningsdatum - b.Inskrivningsdatum;
    });

    if (vtf.length > 0){
        for (var i = 0; i < vtf.length; i++) {
            var senareVTF = vtf[i+1];
            if (senareVTF) {
                if ((senareVTF.Inskrivningsdatum - vtf[i].Utskrivningsdatum) < ettdygn) {
                    if(!satellit){
                        vtf[i].Rubrik = vtf[i].Rubrik + " - Satellit";
                        satellit = true;
                    }
                    vtf[i].Utskrivningsdatum = senareVTF.Utskrivningsdatum;
                    vtf[i].Diagnoser = sättIhopListaUtanDubletter(vtf[i].Diagnoser, senareVTF.Diagnoser);
                    vtf[i].Åtgärder = sättIhopListaUtanDubletter(vtf[i].Åtgärder, senareVTF.Åtgärder);
                    vtf.splice(i+1, 1);
                    i--;
                }
            }
            else {
                break;
            }
        }
    }
}

function sättIhopListaUtanDubletter(lista1, lista2){
    for (var i = 0; i < lista1.length; i++) {
        for (var j = 0; j < lista2.length; j++) {
            if(lista1[i] == lista2[j])
                lista2.splice(j, 1);
        }
    }
    return lista1.concat(lista2);
}

/**
 * Sorterar alla dokument och parar ihop dem tillsammans med ett vårdtillfälle i ett objekt
 * Alla dessa objekt placeras i en lista.
 * Dokumenten sorteras så att alla dokument f.o.m. ett inskr. datum till det följande inskr. datumet
 * tillhör det tidigare vårdtillfället. Det äldsta vårdtillfället tilldelas även de dokument som daterats tidigare än det.
 */

function sorteraVTF() {
    var VTFnummer = 0;
    var blacklist = ["Vårdtillfällen", "ParsedDocuments", "DatumMin", "DatumMax"];
    allaFiltreradeReads = [];
    var dateMin = new Date(2017, 0, 15);
    var dateMax = new Date(2017, 2, 20);

    // Äldst först
    read.Vårdtillfällen.sort(function(a,b) {
        return a.Inskrivningsdatum - b.Inskrivningsdatum;
    });

    for (var ti = 0; ti < read.Vårdtillfällen.length; ti++) {
        var tillfälle = read.Vårdtillfällen[ti];
        var yngre = read.Vårdtillfällen[ti+1];

        if(tillfälle.Inskrivningsdatum < dateMax && tillfälle.Utskrivningsdatum > dateMin){
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
                    if (dok.Datum < tillfälle.Inskrivningsdatum && VTFnummer !== 0)
                        continue;
                    // Skippa om det "tillhör" yngre
                    if (yngre && dok.Datum >= yngre.Inskrivningsdatum && yngre.Inskrivningsdatum < read.DatumMax)
                        continue;

                    filtreradRead[dokTyp].push(dok);
                    VTFnummer++;
                }
            }
        }

    }
}
/**
* Ibland skrivs patienter in oplanerat och hamnar inte i Vårdtillfällen
*/
function hittaOplaneradInskrivning(){
    var kanskeNyaVTF = [];
    var nyttVTF = false;
    var ettDygn = 1*24*60*60*1000; // i ms

    for (var i = 0; i < read.ÖppenVårdkontakter.length; i++) {
        var övk = read.ÖppenVårdkontakter[i];
        for (var j = 0; j < övk.Åtgärder.length; j++) {
            if(övk.Åtgärder[j] == "XS100"){
                kanskeNyaVTF.push(övk.Datum);
            }
        }
    }

    for (var k = 0; k < kanskeNyaVTF.length; k++) {
        for (var l = 0; l < read.Vårdtillfällen.length; l++) {
            vtf = read.Vårdtillfällen[l];

            if((vtf.Inskrivningsdatum - kanskeNyaVTF[k]) < ettDygn){
                nyttVTF = false;
                break;
            }
            nyttVTF = true;
        }
        read.Vårdtillfällen.push({
            Rubrik: doc.head.data2,
            Inskrivningsdatum: parseDate(tab.Inskrivningsdatum.text),
            Utskrivningsdatum: parseDate(tab.Utskrivningsdatum.text),
            Diagnoser: findTableFirstColumn(doc.tables, "Diagnoser", true) || [],
            Åtgärder: findTableFirstColumn(doc.tables, "Åtgärder", true) || []
        });
    }
}

/**
* Utskrift av analysens resultat
*/

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
            console.log(allaFiltreradeReads[v].hittadRespirator[l].toString().substring(0, 15));
        }
        console.log("");

        for (var i = 0; i < allaFiltreradeReads[v].ScoringHistory.length; i++) {
            console.log(allaFiltreradeReads[v].ScoringHistory[i].score + " : " + allaFiltreradeReads[v].ScoringHistory[i].orsak);
        }
        console.log("= " + allaFiltreradeReads[v].Score);
        if(allaFiltreradeReads[v].Score >= 80)
            console.log("Misstänkt VRI!");
    }
}
