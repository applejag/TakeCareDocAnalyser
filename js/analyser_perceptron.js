/* global scoreKoderArray */

/**
 * @typedef {Object} VTF
 * @prop {String} title Occation title
 * @prop {String[]} koder List of codes, ex: ["ING01", "MED02"]
 * @prop {Number} id Patient folder ID
 * @prop {Boolean} vri True/false if is infected. Used in learning algo
 */

/**
 * @param {VTF} vtf 
 * @returns {Number[]}
 */
function codesAsArray(vtf) {
    var array = [];
    
    for (var i = 0; i < scoreKoderArray.length; i++) {
        var kod = scoreKoderArray[i].scoreKod;
        array.push(vtf.koder.indexOf(kod) === -1 ? 0 : 1);
    }

    return array;
}
/**
 * @param {Number} num
 * @returns {String}
 */
function percent(num) {
    return Math.floor(num * 10000) / 100 + "%";
}

/**
 * @param {Number} part 
 * @param {Number} all 
 * @returns {String}
 */
function percent2(part,all) {
    var p = all === 0 ? 0 : part / all;
    return Math.floor(p * 10000) / 100 + "% (" + part + "/" + all + ")";
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
    ].concat(scoreKoderArray.mapField("scoreKod")).join('\t');

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

    // Even out number of training cases a little
    var train_true = vtf.filter(function(x) {return x.vri;});
    var train_false = vtf.filter(function(x) {return !x.vri;});

    var case_true = train_true.slice();
    while (train_true.length < train_false.length + case_true.length) {
        train_true = train_true.concat(case_true);
    }

    var train = train_true.concat(train_false);
    train.shuffle();
    
    for (var r = 0; r < iterations; r++) {
        for (var i = 0; i < train.length; i++) {
            progress = ((r * train.length + i + 1) / train.length / iterations);
            loginfo();

            var input = codesAsArray(train[i]);
            var expected = train[i].vri ? 1 : 0;
            
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
        new Perceptron.Tensor(scoreKoderArray.length),
        new Perceptron.Tensor(Math.floor(scoreKoderArray.length * 1.6), "tanh"),
        new Perceptron.Tensor(Math.floor(scoreKoderArray.length * 1.3), "tanh"),
        new Perceptron.Tensor(Math.floor(scoreKoderArray.length * 0.6), "tanh"),
        new Perceptron.Tensor(1, "tanh")
    ]));

    vtfTrain(vtf, network, iterations);

    var results = {
        Trues: 0,
        Falses: 0,
        Count: 0,
        Positives: 0,
        Negatives: 0,
        TP: 0,
        TN: 0,
        FP: 0,
        FN: 0
    };

    for (var v = 0; v < vtf.length; v++) {
        var actual = network.forward(codesAsArray(vtf[v]))[0];
        var expected = vtf[v].vri;
        var bActual = actual > 0.5;
        results.Count++;

        if (expected) results.Positives++;
        else results.Negatives++;

        if (bActual === expected) {
            // Correct, true result
            results.Trues++;

            if (bActual) results.TP++;
            else results.TN++;
        } else {
            // Incorrect, false result
            results.Falses++;

            if (bActual) results.FP++;
            else results.FN++;
        }
    }

    console.log("Got " + percent2(results.Trues, results.Count) + " correct!\n"+
    "Correctly diagnosed VRI: " + percent2(results.TP, results.Positives) + "\n"+
    "Correctly diagnosed !VRI: " + percent2(results.TN, results.Negatives) + "\n"+
    "Incorrectly diagnosed VRI: " + percent2(results.FP, results.Negatives) + "\n"+
    "Incorrectly diagnosed !VRI: " + percent2(results.FN, results.Positives));

    return {results:results, network:network};
}

/* ------------------------------------------------ */