
var sample_patient_text = '"[ +125 ] Vårdtillfälle (H - AWFA WFN) 2017-01-01 14:22 → 2017-02-05 01:10\n'+
    ' +1 Some anledning, vad vet ""jag"" MED01\n'+
    ' -7 Lorem ipsum SJU77\n'+
    '"	JA	512\n'+
    '"[ +35 ] Vårdtillfälle (H - AWFA WFN) 2017-01-01 14:22 → 2017-02-05 01:10\n'+
    ' +99 Nalle puh sjukan ING01\n'+
    ' -0 Lika bra som +0 :) INF84\n'+
    '[ -18 ] Vårdtillfälle (H - AWFA WFN) 2017-01-01 14:22 → 2017-02-05 01:10\n'+
    ' +51 Plåster på foten FOT01\n'+
    '"	JA	512';

var _get_vtf_scores = (function() {
    /**
     * @param {String} input 
     * @param {RegExp} pattern 
     * @returns {RegExpExecArray[]}
     */
    function getAllMatches(input, pattern) {
        if (!pattern.global) return pattern.exec(input);
        
        var matches = [];
        var match;
        while ((match = pattern.exec(input)))
            matches.push(match);

        return matches;
    }

    /**
     * @typedef {Object} VTF
     * @prop {String} title
     * @prop {String[]} koder
     */

    /**
     * @param {text} text 
     * @returns {VTF[]}
     */
    function splitVTF(text) {
        var pattern = /^\[ [+-]\d+ \][^[]+$/gm;

        return getAllMatches(text, pattern).mapField(0).map(function(vtf) {
            var titlePattern = /^\[ [+-]\d+ ] (.*)$/m;
            var koderPattern = /^[  ]*[+-].*?([A-Z]{3}\d\d)$/gm;

            var title = titlePattern.exec(vtf)[1];
            console.log(vtf);
            var koder = getAllMatches(vtf, koderPattern).mapField(1);

            return {
                title: title,
                koder: koder
            };
        });
    }
    
    /**
     * @typedef {Object} Patient
     * @prop {Boolean} vri
     * @prop {Number} id
     * @prop {String} title
     * @prop {String[]} koder
     */

    /**
     * @param {String} input 
     * @returns {Patient[]}
     */
    function splitPatients(input) {
        var pattern = /^"((?:""|[^"])+)"\t(JA|NEJ)\t(\d+)$/gmi;
        /** @type {Patient[]} */
        var vtfList = [];

        getAllMatches(input, pattern).forEach(function (m_pat) {
            var text = m_pat[1];
            var vri = m_pat[2].toUpperCase() === "JA";
            var id = parseInt(m_pat[3], 10);

            splitVTF(text).forEach(function (vtf) {
                vtf.id = id;
                vtf.vri = vri;

                vtfList.push(vtf);
            });
        });

        // return vtfList.filter(function(vtf) {
        //     return vtf.koder.length > 0;
        // });
        return vtfList;
    }

    /**
     * @typedef {Object} CountedCode
     * @prop {String} kod
     * @prop {Number} vtfCount
     * @prop {Number} vriCount
     */

    /**
     * @param {Patient[]} patients 
     * @returns {CountedCode[]}
     */
    function countCodes(patients) {
        /** @type {Object<string, {vrf:Number, vri:Number}>} */
        var codes = {};

        // Start at 0
        for (var kod in scoreKoder) {
            if (scoreKoder.hasOwnProperty(kod)) {
                codes[kod] = {vtf:0, vri:0};
            }
        }

        // Count them
        patients.forEach(function(pat) {
            for (var i = 0; i < pat.koder.length; i++) {
                var kod = pat.koder[i];
                codes[kod].vtf++;
                if (pat.vri) codes[kod].vri++;
            }
        });

        var codesArr = [];
        for (var key in codes) {
            if (codes.hasOwnProperty(key)) {
                var count = codes[key];
                codesArr.push({kod:key,vtfCount:count.vtf,vriCount:count.vri});
            }
        }

        codesArr.sort(function(a,b) {
            return a.kod > b.kod;
        });

        return codesArr;
    }
    
    /**
     * @param {String} input
     * @returns {String}
     */
    function _get_vtf_scores(input) {
        /** @param {Patient} patient */
        function stringifyPatient(patient) {
            return '\t' + JSON.stringify(patient);
        }

        /** @param {CountedCode} code */
        function stringifyCode(code) {
            return code.kod + '\t' + code.vtfCount + '\t' + code.vriCount;
        }

        var patients = splitPatients(input);
        var patientsVRI = patients.filter(function(pat) {return pat.vri;});
        var patientsNoVRI = patients.filter(function(pat) {return !pat.vri;});

        var codes = countCodes(patients);

        var patientsVRIString = '# VRI VTF:\n[\n'+patientsVRI.map(stringifyPatient).join(",\n")+'\n]';
        var patientsNoVRIString = '# !VRI VTF:\n[\n'+patientsNoVRI.map(stringifyPatient).join(",\n")+'\n]';
        var codesString = '# Koder:\n' + codes.map(stringifyCode).join("\n");
        var vtfString = '# VTF: ' + patients.length;
        var vriString = '# VRI: ' + patients.filter(function(vtf) {return vtf.vri;}).length;

        return [
            patientsVRIString,
            patientsNoVRIString,
            vtfString,
            vriString,
            codesString
        ].join('\n\n');
    }
    
    return _get_vtf_scores;
})();
