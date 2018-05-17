
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
            var koderPattern = /^ *[+-].*?([A-Z]{3}\d\d)$/gm;

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

        return vtfList;
    }
    
    /**
     * @param {String} input
     * @returns {String}
     */
    function _get_vtf_scores(input) {
        function stringifyPatient(patient) {
            return '\t' + JSON.stringify(patient);
        }

        return '[\n'+splitPatients(input).map(stringifyPatient).join(",\n")+'\n]';
    }
    
    return _get_vtf_scores;
})();
