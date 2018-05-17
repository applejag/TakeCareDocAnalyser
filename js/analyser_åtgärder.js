var infartDkoder = /(A40|A41|T814|A327|B37|A021|T802|A483|A413|R572|R651|T835|N00|N03|N01|N02|N04|N05|N10|N11|N12|N30|N330|N34|N35|N390|N41|O863|O862)/i;
var dränDkoder = /(L00|L01|L02|L03|L04|L05|L08|B37|A021|T802|A483|A413|R572|R651|A49)/i;
var respiratorDkoder = /(J00|J01|J02|J03|J04|J05|J06|J09|J10|J11|J12|J13|J14|J15|J16|J17|J18|J20|J21|J22|J32|J37|J69)/i;
var kirurgiDkoder = /(A40|A41|T814|A327|B37|A021|T802|A483|A413|R572|R651|A49|I39|T880|T802|T814|T826|T835||T836|T814|T818)/i;
var KADInf = /(urin|urinvägs|uretra|uretär)+(infektion|inflammation)/i;
var CVKInf = /((rodnad|inflammation|irritation|infektion)\s*(vid|i)|)|lokal\s*(instick|sår|infektion)/i;
var dränInf = /(hud|lokal)\s*(infektion|irritation|inflammation)|abscess/i;
var kirurgiInf = /sår+(infektion|inflammation|irritation)/i;
var respInf = /(lung|inflammtion i|luftvägs)\s*(inflammation|infektion|lunga|luftvägar|lungor)|bronkit|pneumoni/i;

function analyseÅtgärder(){
    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        if(allaFiltreradeReads[i].hittadCVK.length > 0){
            var cvk = allaFiltreradeReads[i].hittadCVK;
            // Haft central infart under vårdtillfället
            addScore(i, "ING09", "Har haft någon typ av CVK under vårdtillfället");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(infartDkoder, CVKInf, i, cvk[cvk.length - 1].inDatum, "CVK");
        }

        if(allaFiltreradeReads[i].hittadKAD.length > 0){
            var kad = allaFiltreradeReads[i].hittadKAD;
            // Har haft någon typ av KAD under vårdtillfället
            addScore(i, "ING01");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(infartDkoder, KADInf, i, kad[kad.length - 1].inDatum, "KAD");
        }

        if(allaFiltreradeReads[i].hittadeDrän.length > 0){
            var drän = allaFiltreradeReads[i].hittadeDrän;
            // Har haft dränage under vårdtillfället
            addScore(i, "ING02");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(dränDkoder, dränInf, i, drän[drän.length - 1].inDatum, "dränage");
        }

        if(allaFiltreradeReads[i].hittadeKirurgKoder.length > 0){
            var kirurgÅkoder = allaFiltreradeReads[i].hittadeKirurgKoder;
            // Kirurgiskt ingrepp under vårdtillfället
            addScore(i, "ING03");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(kirurgiDkoder, kirurgiInf, i, kirurgÅkoder[kirurgÅkoder.length - 1].datum, "kirurgiskt ingrepp");
        }

        if(allaFiltreradeReads[i].hittadRespirator.length > 0){
            var andStöd = allaFiltreradeReads[i].hittadRespirator;
            // Har fått andningsstöd under vårdtillfället
            addScore(i, "ING04");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(respiratorDkoder, respInf, i, andStöd[andStöd.length - 1], "andningsstöd");
        }
    }
}


function hittaInfektionÅtgärdSamband(sökDKoder, sökord, index, åtgärdDatum, åtgärd){
    var fannSambandUnderVtfKod = false;
    var fannSambandUnderVtfText = false;
    var fannSambandEfterVtfKod = false;
    var fannSambandEfterVtfText = false;
    var hittadeKoder = allaFiltreradeReads[index].hittadeDKoder;

    if (hittadeKoder.length > 0) {
        for (var i = 0; i < hittadeKoder.length; i++) {

            if(sökDKoder.test(hittadeKoder[i].kod)){
                if(åtgärdDatum < hittadeKoder[i].datum && hittadeKoder[i].datum <= allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum)
                    fannSambandUnderVtfKod = true;
                
                if(hittadeKoder[i].Datum > åtgärdDatum && hittadeKoder[i].datum > allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum)
                    fannSambandEfterVtfKod = true;

            }
        }
    }

    var infText = allaFiltreradeReads[index].infekteradeTexter;

    if (infText.length > 0) {
        for (var j = 0; j < infText.length; j++) {
            if(sökord.test(infText[j].Fritext)){

                if(infText[j].Datum > åtgärdDatum)
                    fannSambandUnderVtfText = true;

                if(infText[j].Datum > åtgärdDatum && infText[j].Datum > allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum)
                    fannSambandEfterVtfText = true;

            }
        }
    }

    if(fannSambandUnderVtfKod){
        // Diagnoskod tyder på infektion i samband med åtgärdskoder
        addScore(index, "ING06", "Diagnoskod tyder på infektion i samband med " + åtgärd);
    } else {
        if(fannSambandUnderVtfText)
            // Journaltext tyder på infektion i samband med åtgärdskoder
            addScore(index, "ING07", "Journaltext tyder på infektion i samband med " + åtgärd);
    }

    if(fannSambandEfterVtfKod){
        // Diagnoskod tyder samband mellan åtgärdskod och infektion efter utskrivning
        addScore(index, "ING05", "Diagnoskod tyder samband mellan " + åtgärd + " och infektion efter utskrivning");
    } else {
        if(fannSambandEfterVtfText)
            // Journaltext tyder samband mellan åtgärdkod och infektion efter utskrivning
            addScore(index, "ING08", "Journaltext tyder samband mellan " + åtgärd + " och infektion efter utskrivning");
    }


}
