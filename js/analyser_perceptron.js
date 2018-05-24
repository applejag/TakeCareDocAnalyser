/* global scoreKoder */

/**
 * @typedef {Object} VTF
 * @prop {String} title Occation title
 * @prop {String[]} koder List of codes, ex: ["ING01", "MED02"]
 * @prop {Number} id Patient folder ID
 * @prop {Boolean} vri True/false if is infected. Used in learning algo
 */

/** @type {ScoreKod[]} */
var koder = [];
for (var key in scoreKoder) {
    if (scoreKoder.hasOwnProperty(key)) {
        koder.push(scoreKoder[key]);
    }
}

/**
 * @param {VTF} vtf 
 * @returns {Number[]}
 */
function codesAsArray(vtf) {
    var array = [];
    
    for (var i = 0; i < koder.length; i++) {
        var kod = koder[i].scoreKod;
        array.push(vtf.koder.indexOf(kod) === -1 ? 0 : 1);
    }

    return array;
}

function percent(num) {
    return Math.floor(num * 10000) / 100 + "%";
}

/**
 * 
 * @param {VTF[]} vtf 
 */
function produceMatrix(vtf) {
    var header = [
        "Vårdtillfälle",
        "Patient",
        "VRI"
    ].concat(koder.mapField("scoreKod")).join('\t');

    var body = vtf.map(function(v) {
        return [
            v.title,
            v.id,
            v.vri ? 1 : 0
        ].concat(codesAsArray(v)).join('\t');
    });

    var excel = [
        header
    ].concat(body).join('\n');

    return excel;
}

/* ------------------------------------------------ */
function throttle(func, ms) {
    var lastTime = null;

    return function() {
        var now = +Date.now();
        if (!lastTime || (now - lastTime >= ms)) {
            func();
            lastTime = now;
        }
    };
}

/**
 * 
 * @param {VTF[]} vtf
 * @param {*} network 
 * @param {Number} [iterations]
 */
function vtfTrain(vtf, network, iterations) {
    iterations = iterations || 100;
    var start = +Date.now();
    var progress = 0;

    function formatTime(ms) {
        var sec = Math.floor(ms / 1000);
        if (sec >= 60) {
            var min = Math.floor(sec / 60);
            return min + " min, " + sec%60 + " sec";
        }
        return sec + " sec";
    }

    var loginfo = throttle(function() {
        var passed = Date.now() - start;
        var total = passed / progress;
        var remaining = total - passed;
        if (isFinite(remaining)) {
            console.log ("Training, " + percent(progress) + " complete! (Estimated time left: "+formatTime(remaining)+")");
        } else {
            console.log ("Training, " + percent(progress) + " complete!");
        }
    }, 3500);

    for (var r = 0; r < iterations; r++) {
        for (var i = 0; i < vtf.length; i++) {
            progress = ((r * vtf.length + i + 1) / vtf.length / iterations);
            loginfo();

            var input = codesAsArray(vtf[i]);
            var expected = vtf[i].vri ? 1 : 0;
            
            network.backward(input, [expected]);
        }
    }
    console.log ("Training on "+(vtf.length)+" items ("+iterations+" loops) finished in "+formatTime(Date.now() - start)+"!");
}

/**
 * @param {VTF[]} vtf
 * @param {Number} [iterations]
 */
function doVTFTrain(vtf, iterations) {
    var network = new Perceptron.Trainer(new Perceptron.Network([
        new Perceptron.Tensor(scoreKoder.length),
        new Perceptron.Tensor(Math.floor(scoreKoder.length * 1.6), "tanh"),
        new Perceptron.Tensor(Math.floor(scoreKoder.length * 1.3), "tanh"),
        new Perceptron.Tensor(Math.floor(scoreKoder.length * 0.6), "tanh"),
        new Perceptron.Tensor(1, "tanh")
    ]));

    vtfTrain(network, iterations);

    var correct = 0;
    var correctOnVRI = 0;
    var correctOnNonVRI = 0;
    var totalVRI = vtf.filter(function(x) {return x.vri;}).length;
    var results = [];

    for (var v = 0; v < vtf.length; v++) {
        var actual = network.forward(codesAsArray(vtf[v]))[0];
        var expected = vtf[v].vri;
        results.push({expected: expected, actual: actual});
        var bActual = actual > 0.5;

        if (bActual === expected) {
            correct++;
            if (bActual) correctOnVRI++;
            else correctOnNonVRI++;
        }
    }

    console.log("Got " + percent(correct / vtf.length) + " correct!\n"+
    "Correct VRI / #VRI: " + percent(correctOnVRI / totalVRI) + "\n"+
    "Correct !VRI / #!VRI: " + percent(correctOnNonVRI / (vtf.length - totalVRI)));

    return {results:results, network:network};
}

/* ------------------------------------------------ */