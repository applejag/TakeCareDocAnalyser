var infartDkoder = /(A40|A41|T814|A327|B37|A021|T802|A483|A413|R572|R651|T835|N00|N03|N01|N02|N04|N05|N10|N11|N12|N30|N330|N34|N35|N390|N41|O863|O862)/i;
var dränDkoder = /(L00|L01|L02|L03|L04|L05|L08|B37|A021|T802|A483|A413|R572|R651|A49)/i;
var respiratorDkoder = /(J00|J01|J02|J03|J04|J05|J06|J09|J10|J11|J12|J13|J14|J15|J16|J17|J18|J20|J21|J22|J32|J37|J69)/i;
var kirurgiDkoder = /(A40|A41|T814|A327|B37|A021|T802|A483|A413|R572|R651|A49|I39|T880|T802|T814|T826|T835||T836|T814|T818)/i;
var infartInf = /(urin|urinvägs|uretra|uretär)+(infektion|inflammation)/i;
var dränInf = /(hud|lokal)\s*(infektion|irritation|inflammation)|abscess/i;
var kirurgiInf = /sår+(infektion|inflammation)/i;
var respInf = /(lung|inflammtion i|luftvägs)\s*(inflammation|infektion|lunga|luftvägar|lungor)|bronkit|pneumoni/i;

function analyseÅtgärder(){
    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        if(allaFiltreradeReads[i].hittadeInfarter.length > 0){
            var infarter = allaFiltreradeReads[i].hittadeInfarter;
            addScore(i, 0, "Har haft infart(er) under vårdtillfället");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(infartDkoder, infartInf, i, infarter[infarter.length - 1].inDatum, "en infart");
        }

        if(allaFiltreradeReads[i].hittadeDrän.length > 0){
            var drän = allaFiltreradeReads[i].hittadeDrän;
            addScore(i, 1, "Har haft dränage under vårdtillfället");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(dränDkoder, dränInf, i, drän[drän.length - 1].inDatum, "dränage");
        }

        if(allaFiltreradeReads[i].hittadeKirurgKoder.length > 0){
            var kirurgÅkoder = allaFiltreradeReads[i].hittadeKirurgKoder;
            addScore(i, 2, "Kirurgiskt ingrepp under vårdtillfället");
            if(allaFiltreradeReads[i].hasInfection)
                hittaInfektionÅtgärdSamband(kirurgiDkoder, kirurgiInf, i, kirurgÅkoder[kirurgÅkoder.length - 1].datum, "kirurgiskt ingrepp");
        }

        if(allaFiltreradeReads[i].hittadRespirator.length > 0){
            var andStöd = allaFiltreradeReads[i].hittadRespirator;
            addScore(i, 3, "Har fått andningsstöd under vårdtillfället");
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
                if(allaFiltreradeReads[index].infDebut > åtgärdDatum)
                    fannSambandUnderVtfKod = true;

                if(hittadeKoder[i].Datum > åtgärdDatum && hittadeKoder[i].Datum > allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum)
                    fannSambandEfterVtfKod = true;

            }
        }
    }

    var infText = allaFiltreradeReads[index].infekteradeTexter;

    if (infText.length > 0) {
        for (var j = 0; j < infText.length; j++) {
            if(sökord.test(infText[j].Fritext)){

                if(allaFiltreradeReads[index].infDebut > åtgärdDatum)
                    fannSambandUnderVtfText = true;

                if(infText[j].Datum > åtgärdDatum && infText[j].Datum > allaFiltreradeReads[index].Vårdtillfälle.Utskrivningsdatum)
                    fannSambandEfterVtfText = true;

            }
        }
    }

    if(fannSambandUnderVtfKod){
        addScore(index, 5, "Diagnoskod tyder på infektion i samband med " + åtgärd);
    } else {
        if(fannSambandUnderVtfKodText)
            addScore(index, 6, "Journaltext tyder på infektion i samband med " + åtgärd);
    }
    
    if(fannSambandEfterVtfKod){
        addScore(index, 4, "Diagnoskod tyder samband mellan " + åtgärd + " och infektion efter utskrivning");
    } else {
        if(fannSambandEfterVtfText)
            addScore(index, 25, "Journaltext tyder samband mellan " + åtgärd + " och infektion efter utskrivning");
    }


}
