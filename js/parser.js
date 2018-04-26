
(function() {
    var parser = {};
    window.parser = parser;
    parser.isParsed = false;
    parser.isCrashed = false;
    parser.isAnalysed = false;
    parser.lastParse = [];

    var input = document.getElementById("input");
    var saved = document.getElementById("saved");
    var parse_status = document.getElementById("parse_status");
    var catch_checkbox = document.getElementById("parse_catch");
    var parse_time_min = document.getElementById("parse_time_min");
    var parse_time_max = document.getElementById("parse_time_max");
    var consolelog = document.getElementById("consolelog");
    var timer = null;
    var readerFunctions = [];

    parser.addReader = function(search, func) {
        readerFunctions.push({
            search: search,
            func: func
        });
    };

    function getTimespanMinMax() {
        function getTimespan(field, elem) {
            var value = Date.parse(elem.value);
            if (value) {
                read[field] = value;
                elem.removeAttribute('invalid');
            } else {
                elem.setAttribute('invalid', 'invalid');
            }
        }

        getTimespan('DatumMin', parse_time_min);
        getTimespan('DatumMax', parse_time_max);
    }

    function getReader(category) {
        for (var i = 0; i < readerFunctions.length; i++) {
            var reader = readerFunctions[i];

            if (isString(reader.search)) {
                if (category == reader.search) return reader;
            } else if (isRegExp(reader.search)) {
                if (reader.search.test(category)) return reader;
            } else {
                throw new Error("Invalid reader function search type!");
            }
        }
        return null;
    }

    function runReader(parsed) {
        var rereads = 0;
        var unknownCategories = [];

        for (var i = 0; i < parsed.length; i++) {
            var doc = parsed[i];

            // Already parsed before?
            if (read.ParsedDocuments.indexOf(doc.id) !== -1) {
                rereads++;
                continue;
            }

            var reader = getReader(doc.head.category);
            if (reader) {
                reader.func(doc);
                // Stash the id, dont read it again
                read.ParsedDocuments.push(doc.id);
            } else if (unknownCategories.indexOf(doc.head.category) === -1) {
                unknownCategories.push(doc.head.category);
                console.warn("Unknown document category, `"+JSON.stringify(doc.head.category)+"`. Document data ignored.");
            }
        }

        if (rereads > 0)
            console.warn("There were "+rereads+" documents that were already parsed, or was identical with a previously parsed document.");
    }

    function setError(title, error)
    {
        var div = document.getElementById("parse_error");
        var eTitle = document.getElementById("parse_error_title");
        var ePara = document.getElementById("parse_error_para");

        if (title && error) {
            div.style.display = "block";
            eTitle.innerText = title;
            ePara.innerText = error.toString();
            parser.isCrashed = true;
            throw error;
        } else {
            div.style.display = "none";
            eTitle.innerText = "";
            ePara.innerText = "";
            parser.isCrashed = false;
        }
    }

    function execFunc(verb, func) {
        var start = Date.now();
        parser.isCrashed = false;
        setError();

        var truelog = console.log;
        var oldLog = {};
        var logged = "";

        function captureLogger(logger) {
            if (oldLog[logger]) return;
            oldLog[logger] = console[logger];
            console[logger] = function() {
                var str = Array.from(arguments).join(' ');
                if (logged === "") logged = str;
                else logged += "\n" + str;
                oldLog[logger].apply(console, arguments);
            };
        }

        try {
            ['log', 'warn', 'error'].forEach(captureLogger);

            if (catch_checkbox.checked) {
                try {
                    var out = func(start);
                    if (out)
                        parse_status.innerText = out;
                    else
                        parse_status.innerText = "("+verb+" successfully finished after "+(Date.now() - start)+"ms)";

                } catch (e) {
                    parse_status.innerText = "("+verb+" failed after "+(Date.now() - start)+"ms)";
                    setError("Error while " + verb.toLowerCase() + "!", e);
                }
            } else {
                var success = false;
                try {
                    var out2 = func(start);
                    if (out2)
                        parse_status.innerText = out2;
                    else
                        parse_status.innerText = "("+verb+" successfully finished after "+(Date.now() - start)+"ms)";
                    success = true;
                } finally {
                   if (!success)
                       parse_status.innerText = "("+verb+" failed after "+(Date.now() - start)+"ms)";
                }
            }
        } finally {
            for (var logger in oldLog) {
                if (oldLog.hasOwnProperty(logger)) {
                    console[logger] = oldLog[logger];
                }
            }
            consolelog.innerText = logged;
        }
    }

    parser.refreshScore = function() {
        var container = document.getElementById("scoring_items");
        var none = document.getElementById("scoring_none");
        var template = document.getElementById("scoring_template");
        var item_template = document.getElementById("scoring_item_template");
        container.innerHTML = "";

        if (allaFiltreradeReads.length === 0) {
            none.style.display = "block";
            return;
        }
        none.style.display = "none";

        function _setScore(score) {
            return function(elem) {
                if (score >= 0) {
                    elem.classList.remove('score-neg');
                    elem.classList.add('score-pos');
                    elem.innerText = '+' + score.toString();
                } else {
                    elem.classList.remove('score-pos');
                    elem.classList.add('score-neg');
                    elem.innerText = score.toString();
                }
            };
        }

        function _setText(text) {
            return function(elem) {
                elem.innerText = text;
            };
        }

        function foreachElementByClass(elem, className, callback) {
            var children = elem.getElementsByClassName(className);
            for (var i = 0; i < children.length; i++) {
                callback(children[i]);
            }
        }

        for (var ri = 0; ri < allaFiltreradeReads.length; ri++) {
            var fread = allaFiltreradeReads[ri];

            var clone = template.cloneDeep();
            clone.removeAttribute('id');
            foreachElementByClass(clone, 'score-total', _setScore(fread.Score));
            foreachElementByClass(clone, 'score-date-min', _setText(formatDateTime(fread.Vårdtillfälle.Inskrivningsdatum)));
            foreachElementByClass(clone, 'score-date-max', _setText(formatDateTime(fread.Vårdtillfälle.Utskrivningsdatum)));
            foreachElementByClass(clone, 'score-rubrik', _setText(fread.Vårdtillfälle.Rubrik));
            container.appendChild(clone);

            var item_container = clone.getElementsByClassName('score-list')[0];
            item_container.innerHTML="";

            for (var si = 0; si < fread.ScoringHistory.length; si++) {
                var hist = fread.ScoringHistory[si];

                var item = item_template.cloneDeep();
                foreachElementByClass(item, 'score-delta', _setScore(hist.delta));
                foreachElementByClass(item, 'score-reason', _setText(hist.reason));
                item_container.appendChild(item);
            }
        }
    };

    parser.exportJSON = function() {
        execFunc("Export", function(start) {
            saved.innerText = JSON.stringify(read, null, 4);
        });
    };

    parser.importJSON = function() {
        execFunc("Import", function(start) {
            var fieldCount = 0;
            var itemCount = 0;

            var toParse = saved.innerText.trim();
            if (toParse == "") {
                console.warn("[!] Nothing to import!");
                return "(Nothing to import)";
            }

            // Read json
            var data = JSON.parse(toParse, function (key, value) {
                if (key.search(/datum/i) !== -1 && isString(value)) {
                    return tryParseDate(value) || value;
                }
                return value;
            });

            if (!(data instanceof Object)) {
                console.warn("[!] Parsed data is not valid object!");
                return "(Parsed data is not valid object)";
            }

            // Transfer data to read obj
            for (var dfield in data) {
                if (!data.hasOwnProperty(dfield)) continue;

                var expected = typeof2(read[dfield]);
                if (!expected) {
                    console.warn("[!] Unsupported field name `"+dfield+"`!");
                    return "(Unsupported field name `"+dfield+"`)";
                }

                var actual = typeof2(data[dfield]);
                if (actual !== expected) {
                    console.warn("[!] Parsed field `"+dfield+"` is invalid data type! Expected "+expected+", got "+actual+"!");
                    return "(Parsed field `"+dfield+"` is invalid data type! Expected "+expected+", got "+actual+")";
                }

                read[dfield] = data[dfield];
                fieldCount++;
                if (data[dfield].length) itemCount += data[dfield].length;
            }

            // Clear omitted fields
            for (var rfield in read) {
                if (!read.hasOwnProperty(rfield)) continue;

                if (!data[rfield])
                {
                    read[rfield] = read_default[rfield];
                }
            }

            // Update timespan fields
            parse_time_min.value = formatDate(read.DatumMin);
            parse_time_max.value = formatDate(read.DatumMax);

            return "(Imported "+fieldCount+" fields and a total of "+itemCount+" documents in "+(Date.now() - start)+" ms)";
        });
    };

    parser.analyse = function() {
        execFunc("Analyse", function(start) {
            parser.isAnalysed = false;
            var any = false;

            for (var field in read) {
                if (read.hasOwnProperty(field) && field !== "ParsedDocuments") {
                    if (read[field].length > 0)
                    {
                        any = true;
                        break;
                    }
                }
            }

            if (!any) {
                console.warn("[!] NO PATIENT DATA TO ANALYSE");
                parser.isAnalysed = true;
                return "(No data to analyse)";
            } else {
                analyseData();
                parser.isAnalysed = true;
                parser.refreshScore();
                return "(Analysed " + read.ParsedDocuments.length + " documents in " + (Date.now() - start) + " ms)";
            }
        });
    };

    parser.parseInput = function() {
        execFunc("Parsing documents", function(start) {
            var preParseCount = read.ParsedDocuments.length;
            var parsed;

            setError();
            parsed = getParsedDocuments();
            parser.lastParse = parsed;
            runReader(parsed);
            parser.isParsed = true;

            var readCount = read.ParsedDocuments.length - preParseCount;
            var log;
            if (readCount === 0) {
                log = parsed.length === 0 ?
                "No documents were found." :
                "No new data were found among " + parsed.length + " parsed documents.";
                console.warn("[!] " + log);
            } else {
                log = "Data read from "+readCount+" documents in " + (Date.now() - start) + " ms.";
                console.log("[!] " + log);
            }

            return "("+log+" Read "+read.ParsedDocuments.length+" documents in total)";
        });
    };

    function getParsedDocuments() {
        var documentsData = [];

        var documents = input.getElementsByClassName("document");
        for(var i=0; i<documents.length; i++) {
            var doc = documents[i];

            var head = getDocHeader(doc);
            var body = getDocBody(doc);
            var notes = getDocNotes(doc);
            var tables, trees;

            if (body) {
                tables = getDocBodyTables(body);
                trees = getDocBodyTrees(body);
            }

            var obj = {
                id: getDocId(doc),
                head: head,
                body: body,
                notes: notes,
                tables: tables,
                trees: trees
            };

            if (obj.header !== null && obj.body !== null)
                documentsData.push(obj);
        }

        return documentsData;
    }

    function elemToCellObj(elem) {
        var firstChild = elem.children[0];
        var p = firstChild && firstChild.tagName == "P" ? firstChild : null;
        var padding = p ? p.style.paddingLeft : "";
        var indent = parseFloat(padding) * 2;

        return {
            text: elem.innerText.trim(),
            html: elem.innerHTML,
            isItalic: elem.getElementsByTagName('i').length > 0,
            isBold: elem.getElementsByTagName('b').length > 0,
            indentation: isNaN(indent) ? 0 : indent
        };
    }

    function getDocId(doc) {
        return doc.innerHTML.hashCode();
    }

    function getDocHeader(doc) {
        var headList = doc.getElementsByClassName('header');
        if (headList.length == 0) return null;
        var head = headList[0];

        var spans = head.getElementsByTagName('span');

        var date = spans[3].innerText
            .replace('--:--', '00:00');

        return {
            category: spans[0].innerText,
            data1: spans[1].innerText,
            data2: spans[2].innerText,
            datestring: date,
            datetime: parseDate(date)
        };
    }

    function getDocNotes(doc) {
        var dataList = doc.getElementsByClassName('data');
        if (dataList.length == 0) return null;
        var data = dataList[0];

        var notes = [];
        for (var i = 0; i < data.children.length; i++) {
            var child = data.children[i];
            if (child.tagName !== "P") break;
            notes.push(elemToCellObj(child));
        }

        return notes;
    }

    function getDocBody(doc) {
        var dataList = doc.getElementsByClassName('data');
        if (dataList.length == 0) return null;
        var tableList = dataList[0].getElementsByTagName('table');
        if (tableList.length == 0) return null;
        var table = tableList[0];

        var body = [];
        var rows = table.getElementsByTagName('tr');
        for (var i=0; i<rows.length; i++) {
            var rowData = [];
            var cols = rows[i].getElementsByTagName('td');
            for (var j=0; j<cols.length; j++) {
                rowData.push(elemToCellObj(cols[j]));
            }
            if (rowData.length > 0)
                body.push(rowData);
        }
        return body;
    }

    function getDocBodyTables(body) {
        var tables = [];

        var thead = null;
        var tbodyrows = null;
        var tbodycols = null;

        for (var i = 0; i < body.length; i++)
        {
            if (body[i][0].isItalic)
            {
                thead = body[i];
                tbodyrows = [];
                tbodycols = {};
                tables.push({ head: thead, rows: tbodyrows, columns: tbodycols });

                // Initialize columns
                for (var col = 0; col < thead.length; col++)
                {
                    if (thead[col].text !== "")
                        tbodycols[thead[col].text] = [];
                }
                continue;
            }

            // Any table?
            if (thead === null)
                continue;

            var trow = body[i];

            // End of table data?
            if (trow.length !== thead.length ||
                trow[0].isItalic)
            {
                // Reset
                thead = null;
                tbodyrows = null;
                tbodycols = null;
                i--;
                continue;
            }

            // Collect row data
            var rowobj = { columns: [] };
            tbodyrows.push(rowobj);

            // Loop columns for this row
            for (var c = 0; c < trow.length; c++)
            {
                var name = thead[c].text;
                var cell = trow[c];

                // Is named?
                if (name !== "") {
                    // Add named to row obj
                    rowobj[name] = cell;

                    // Add named to col obj
                    tbodycols[name].push(cell);
                }

                // Add indexed to row obj
                rowobj.columns.push(cell);
            }
        }

        return tables;
    }

    function getDocBodyTrees(body) {
        var trees = [];
        var i = 0;

        function getNextTree(indent) {
            var children = [];

            while (true) {
                if (i+1 >= body.length) break;

                var title = body[i+1][0];
                var content = body[i+1][1];

                if (title.indentation > indent)
                {
                    i++;
                    children.push({
                        title: title,
                        content: content,
                        children: getNextTree(indent+1)
                    });
                } else {
                    break;
                }

            }

            return children;
        }

        while (i < body.length) {
            if (!body[i][0].isBold) {
                i++;
                continue;
            }
            trees.push({
                title: body[i][0],
                content: body[i][1],
                children: getNextTree(0)
            });
            i++;
        }

        return trees;
    }

    function throttle(func, ms, onreset) {
        var timer;
        return function() {
            clearTimeout(timer);
            timer = setTimeout(func, ms);
            if (onreset) onreset();
        };
    }

    var startParseTimer = throttle(parser.parseInput, 300, function() {
        parser.isCrashed = false;
        parser.isParsed = false;
        parse_status.innerText = "(Parsing, please wait...)";
        setError(null, null);
    });

    var convertSavedToText = throttle(function() {
        if (saved.children.length > 0)
            saved.innerHTML = saved.innerText;
    }, 100);

    var convertLogToText = throttle(function() {
        if (consolelog.children.length > 0)
            consolelog.innerHTML = consolelog.innerText;
    }, 100);

    window.addEventListener('load', function() {
        parse_time_min.onchange = getTimespanMinMax;
        parse_time_max.onchange = getTimespanMinMax;
        getTimespanMinMax();
    });

    saved.addEventListener("DOMNodeInserted", convertSavedToText, false);
    saved.addEventListener("DOMNodeRemoved", convertSavedToText, false);
    saved.addEventListener("DOMCharacterDataModified", convertSavedToText, false);

    consolelog.addEventListener("DOMNodeInserted", convertLogToText, false);
    consolelog.addEventListener("DOMNodeRemoved", convertLogToText, false);
    consolelog.addEventListener("DOMCharacterDataModified", convertLogToText, false);

    // input.addEventListener("DOMNodeInserted", startParseTimer, false);
    // input.addEventListener("DOMNodeRemoved", startParseTimer, false);
    // input.addEventListener("DOMCharacterDataModified", startParseTimer, false);
})();
