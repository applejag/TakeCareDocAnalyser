
var antibiotika = ["Doxycyklin EQL Pharma, EQL Pharma, tablett 100 mg","Doxyferm, Nordic Drugs, koncentrat till infusionsvätska, lösning 20 mg/ml",
                "Doxyferm, Nordic Drugs, tablett 100 mg", "Oracea, Galderma Nordic, kapsel med modifierad frisättning, hård 40 mg",
                "Vibranord, Pharmanovia, oral suspension 10 mg/ml Vibranord, Pharmanovia, tablett 100 mg", "Doxycyklin 2care4",
                "Doxycyklin Ebb", "Lymecycline Actavis", "Lymelysal", "Tetralysal", "Lymecycline Actavis", "Lymelysal", "Tetralysal",
                "Tetracyklin Meda", "Tygacil", "Kloramfenikol CCS", "Kloramfenikol Santen", "Doktacillin", "Amimox", "Amoxicillin Aurobindo",
                "Amoxicillin Mylan", "Amoxicillin Sandoz", "Imacillin", "Penomax", "Selexid", "Piperacillin/Tazobactam Fresenius Kabi",
                "Piperacillin/Tazobactam Reig Jofre", "Piperacillin/Tazobactam Sandoz", "Piperacillin/Tazobactam Stragen",
                "Piperacillin/Tazobaktam AB Unimedic Vial Mate", "Tikacillin, Filmdragerad tablett 1 g", "Tikacillin, Filmdragerad tablett 800 mg",
                "Heracillin", "Bensylpenicillin Meda", "Benzylpenicillin Panpharma", "Avopenin", "Fenoximetylpenicillin EQL Pharma", "Kåvepenin",
                "Kåvepenin Frukt", "Tikacillin", "Cloxacillin Stragen", "Ekvacillin", "Flucloxacillin Orion", "Flucloxacillin Sandoz",
                "Flukloxacillin Meda", "Heracillin", "Ekvacillin (Kloxacillin)", "Amoxicillin/Clavulanic acid Aurobindo", "Amoxicillin/Clavulanic acid BB",
                "Betaklav", "Bioclavid", "Klaximol", "Spektramox", "Amoxicillin/Clavulanic acid 2care4", "Amoxicillin/Klavulansyra Ebb", "Tikacillin",
                "Cefazolin MIP", "Cefadroxil Mylan", "Cefadroxil Sandoz", "Cefamox löslig", "Aprokam (Cefuroxim)", "Zinacef (Cefuroxim)", "Ceftriaxon Fresenius Kabi",
                "Ceftriaxon Stragen", "Ceftriaxon Villerton", "Cefotaxim MIP", "Cefotaxim Sandoz", "Cefotaxim Stragen", "Cefotaxim Villerton",
                "Ceftazidim Sandoz", "Fortum", "Ceftriaxon Fresenius Kabi", "Ceftriaxon MIP", "Ceftriaxon Stragen", "Ceftriaxon Villerton",
                "Rocephalin med lidokain (Ceftriaxon)", "Zavicefta", "Rocephalin med lidokain", "Cefepim MIP", "Azactam", "Cayston", "Meropenem Fresenius Kabi",
                "Meropenem Hexal", "Meropenem Hospira", "Meropenem Mylan", "Meropenem STADA", "Meronem (Meropenemanhydrat)", "Ertapenem Fresenius Kabi",
                "Invanz", "Imipenem/Cilastatin Fresenius Kabi", "Tienam", "Idotrim", "Trimetoprim Meda", "Bactrim", "Bactrim forte", "Eusaprim",
                "Eusaprim forte", "Sulfadiazin", "Sulfadiazin-natrium", "Azasulf", "Comcillin", "Debenal", "Penicillin-trippel-sulfa", "Pharmadiazin mite",
                "Pharmadiazin", "Pyrimal", "Sulfadital mite", "Sulfadital", "Sulphatriad", "Trimin sulfa", "Trisulf", "Abboticin", "Abboticin Novum",
                "Ery-Max", "Erythromycin Panpharma", "Erythromycin Ebb", "Roximstad", "Surlid", "Clarithromycin Aurobindo (Klaritromycin)", "Clarithromycin HEC Pharm (Klaritromycin)",
                "Clarithromycin Krka (Klaritromycin)", "Klacid (Klaritromycin)", "Nexium HP (Klaritromycin)", "Klacid (Klaritromycin)", "Azithromycin Jubilant",
                "Azithromycin Krka", "Azithromycin Mylan", "Azithromycin Orifarm", "Azithromycin Sandoz", "Azithromycin STADA", "Azitromax",
                "Azyter", "Azitromycin Ebb", "Clindamycin Actavis", "Clindamycin Alternova", "Clindamycin Orifarm", "Dalacin", "Dalacin", "Klindamycin Ebb", "Nebcina",
                "Tobi", "TOBI Podhaler", "Biklin", "Ciprofloxacin Accord", "Ciprofloxacin Amneal", "Ciprofloxacin Bluefish", "Ciprofloxacin Fresenius Kabi", "Ciprofloxacin Hexal",
                "Ciprofloxacin Krka", "Ciprofloxacin Mylan", "Ciprofloxacin Orion", "Ciprofloxacin Ranbaxy", "Ciprofloxacin Villerton", "Ciproxin", "Ciflox",
                "Ciprofloxacin Accord", "Ciprofloxacin MDS", "Ciproxin", "Norfloxacin Krka", "Levofloxacin Bluefish", "Levofloxacin Krka", "Levofloxacin Mylan", "Levofloxacin Orion",
                "Quinsair", "Tavanic", "Avelox", "Moxifloxacin Fresenius Kabi", "Moxifloxacin Krka", "Moxifloxacin Orion", "Avelox", "Vancomycin Actavis",
                "Vancomycin Hospira", "Vancomycin MIP", "Vancomycin Mylan", "Vancomycin Orion", "Vancomycin Xellia", "Targocid", "Teicoplanin Sandoz", "Targocid",
                "Xydalba", "Colineb", "Colobreathe", "Tadim", "Metronidazole Braun", "Fasigyn", "Furadantin", "Nitrofurantoin Alternova", "Fosfomycin Infectopharm",
                "Hiprex", "Linezolid Accord", "Linezolid Glenmark", "Linezolid Krka", "Linezolid Mylan", "Linezolid Orion", "Linezolid Reig Jofre", "Linezolid Sandoz",
                "Linezolid Teva", "Zyvoxid", "Cubicin", "Sivextro", "AmBisome", "Fungizone", "Ecovag", "Nystimex", "AmBisome", "Fungizone", "Kloramfenikol CCS",
                "Kloramfenikol Santen", "Terracortril med Polymyxin B", "Terracortril", "Terracortril med Polymyxin B", "Dalacin", "Flagyl", "Zidoval",
                "Canesten", "Pevaryl", "Pevaryl Depot", "Donaxyl", "Dequalinium Orifarm", "Terracortril med Polymyxin B", "Tetracyklin Meda", "Fucidin", "Fucidine",
                "Mekostest", "Betametason-neomycin i Essex kräm APL", "Gensumycin", "Gentamicin Ebb", "Bactroban", "Bactroban Nasal", "Xifaxan",
                "Altargo", "Bafucin", "Bafucin Mint", "Mekostest", "Betametason-neomycin i Essex kräm APL", "Nystimex", "Vancocin", "Vancomycin Xellia",
                "Xifaxan", "DIFICLIR", "Ansatipin", "Rifadin", "Rimactan", "Rifampicin Ebb", "Rifampicin Orifarm", "Rimactan", "Nexium HP"];


/**
* Kollar om det hittats medicinering klassat som riskfaktor
*/
function analyseMedicinering() {
    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        if(allaFiltreradeReads[i].hittadRiskMedicin.length > 0)
            // Har ordinerats cytostatika, steroider, immunhämmande läkemedel eller antibiotika <90 dagar innan vårdtillfället
            addScore(i, "MED01");
    }
}

/**
* Kollar om antibiotia ordinerats efter en åtgärd vilket skulle tyda på infektion
* Kollar även om Clostridium, difficile påvisats i samband med kur => oundviklig VRI
*/
function antibiotikaAnalys() {
    var fåttAntibiotika = [];
    var tvådygn = 2*24*60*60*1000; // i ms

    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        if(allaFiltreradeReads[i].hittadRiskMedicin.length > 0) {
            for (var j = 0; j < antibiotika.length; j++) {
                for (var k = 0; k < allaFiltreradeReads[i].hittadRiskMedicin.length; k++){
                    if (antibiotika[j] == allaFiltreradeReads[i].hittadRiskMedicin[k].läkemedel){
                        fåttAntibiotika.push(allaFiltreradeReads[i].hittadRiskMedicin[k].inDatum);
                    }
                }
            }
        }

        // Gå igenom antibiotikalistan som patienten ordinerats och se om datum faller in >48 efter åtgärd
        var åtgärder = [];

        for (var ii = 0; ii < fåttAntibiotika.length; ii++){

            var hittatÅtgärd = false;
            if(allaFiltreradeReads[i].hittadeInfarter.length > 0){
                var infarter = allaFiltreradeReads[i].hittadeInfarter;
                for (var inf = 0; inf < infarter.length; inf++){

                    if ((fåttAntibiotika[ii] - infarter[inf].datum) > tvådygn && !hittatÅtgärd) {
                        åtgärder.push("infart");
                        hittatÅtgärd = true;
                    }
                }
            }
            hittatÅtgärd = false;

            if(allaFiltreradeReads[i].hittadeDrän.length > 0){
                var drän = allaFiltreradeReads[i].hittadeDrän;
                for (var dr = 0; dr < drän.length; dr++){

                    if ((fåttAntibiotika[ii] - drän[dr].inDatum) > tvådygn && !hittatÅtgärd) {
                        åtgärder.push("drän");
                        hittatÅtgärd = true;
                    }
                }
            }
            hittatÅtgärd = false;

            if(allaFiltreradeReads[i].hittadeKirurgKoder.length > 0){
                var kirurgÅkoder = allaFiltreradeReads[i].hittadeKirurgKoder;
                for (var kr = 0; kr < kirurgÅkoder.length; kr++){

                    if ((fåttAntibiotika[ii] - kirurgÅkoder[kr].inDatum) > tvådygn && !hittatÅtgärd) {
                        åtgärder.push("kirurgiskt ingrepp");
                        hittatÅtgärd = true;
                    }

                }

            }
            hittatÅtgärd = false;

            if(allaFiltreradeReads[i].hittadRespirator.length > 0){
                var andStöd = allaFiltreradeReads[i].hittadRespirator;
                for (var a = 0; a < andStöd.length; a++){

                    if ((fåttAntibiotika[ii] - andStöd[a].inDatum) > tvådygn && !hittatÅtgärd) {
                        åtgärder.push("andningsstöd");
                        hittatÅtgärd = true;
                    }
                }
            }
            hittatÅtgärd = false;
        }

        if (åtgärder.length > 0) {
            // Kan finnas samband mellan åtgärdskod(er) och ordinerad antibiotika
            addScore(i, "MED26", "Kan finnas samband mellan " + åtgärder.join(", ") + " och ordinerad antibiotika");
        }
    }



}
