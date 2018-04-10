
/*
var read = {
    Vårdtillfällen: [
        [0..n]: {
            Rubrik: "" string,
            Inskrivningsdatum: Date,
            Utskrivningsdatum: Date,
            Diagnoser: [
                [0..n]: "" string
            ],
            Åtgärder: [
                [0..n]: "" string
            ]
        }
    ]

    ÖppnaVårdkontakter: [
        [0..n]: {
            Rubrik: "" string,
            Datum: Date,
            Diagnoser: [
                [0..n]: "" string
            ],
            Åtgärder: [
                [0..n]: "" string
            ]
        }
    ]
};
//*/

function analyseData() {
    console.log("[!] PATIANT DATA GET IN LINE FOR INSPECTION\n[!] THIS IS YOUR EVALUATION DAY");

    checkLongestVårdtillfälle();
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
