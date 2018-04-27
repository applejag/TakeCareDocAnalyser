
var antibiotika = [];

function analyseMedicinering() {
    for (var i = 0; i < allaFiltreradeReads.length; i++) {
        if(allaFiltreradeReads[i].hittadRiskMedicin.length > 0)
            addScore(i, 1, "Har ordinerats cytostatika, steroider, immunhämmande läkemedel eller antibiotika <90 dagar innan vårdtillfället");
    }
}

/*
* Kollar om antibiotia ordinerats efter en åtgärd vilket skulle tyda på infektion
* Kollar även om Clostridium, difficile påvisats i samband med kur => oundviklig VRI
*/
function antibiotikaAnalys() {
    
}
