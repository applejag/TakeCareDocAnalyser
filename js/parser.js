
(function() {
    var parser = {};
    window.parser = parser;
    parser.isParsed = false;
    parser.isCrashed = false;
    parser.isAnalysed = false;
    parser.lastParse = [];
    // read.ParsedDocuments = [];

    var input = document.getElementById("input");
    var output = document.getElementById("output");
    var reader_arg = document.getElementById("parse_argument");
    var reader_status = document.getElementById("output_status");
    var timer = null;
    var readerFunctions = [];

    parser.addReader = function(search, func) {
        readerFunctions.push({
            search: search,
            func: func
        });
    };

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
            // Already read?
            if (read.ParsedDocuments.indexOf(doc.head.id) !== -1) {
                rereads++;
                continue;
            }

            var reader = getReader(doc.head.category);
            if (reader) {
                reader.func(doc);
                // Stash the id, dont read it again
                read.ParsedDocuments.push(doc.head.id);
            } else if (unknownCategories.indexOf(doc.head.category) === -1) {
                unknownCategories.push(doc.head.category);
                console.log("Unknown document category, `"+doc.head.category+"`. Document data ignored.");
            }
        }

        if (rereads > 0)
            console.log("There were "+rereads+" documents that were already read!");
    }

    function setError(title, error)
    {
        var div = document.getElementById("output_error");
        var eTitle = document.getElementById("output_error_title");
        var ePara = document.getElementById("output_error_para");

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

    parser.exportJSON = function() {
        parser.isCrashed = false;
        output.innerText = JSON.stringify(read, null, 4);
    };

    parser.importJSON = function() {
        var start = Date.now();

        parser.isCrashed = false;
        var fieldCount = 0;
        var itemCount = 0;

        try {
            setError();
            var toParse = output.innerText.trim();
            if (toParse == "")
                throw new Error("Nothing to import!");

            var data = JSON.parse(toParse, function (key, value) {
                if (key.search(/datum/i) !== -1)
                    return parseDate(value);
                return value;
            });

            if (!(data instanceof Object))
                throw new Error("Parsed data is not valid object!");

            for (var dfield in data) {
                if (data.hasOwnProperty(dfield)) {
                    if (!(data[dfield] instanceof Array))
                        throw new Error("Parsed field `"+dfield+"` is invalid data type! Expected array.");

                    if (!(read[dfield] instanceof Array))
                        throw new Error("Unsupported field name `"+dfield+"`!");

                    read[dfield] = data[dfield];
                    fieldCount++;
                    itemCount += data[dfield].length;
                }
            }
            for (var rfield in read) {
                if (read.hasOwnProperty(rfield)) {
                    if (read[rfield] instanceof Array &&
                        !(data[rfield] instanceof Array))
                    {
                        read[rfield] = [];
                    }
                }
            }

            output.innerText = JSON.stringify(read, null, 4);
        } catch (e) {
            reader_status.innerText = "(Import failed after "+(Date.now() - start)+" ms)";
            setError("Error while importing data!", e);
        }

        reader_status.innerText = "(Imported "+fieldCount+" fields and a total of "+itemCount+" documents in "+(Date.now() - start)+" ms)";
    };

    parser.analyse = function() {
        var start = Date.now();
        parser.isAnalysed = false;
        parser.isCrashed = false;

        try {
            setError();
            analyseData();
        } catch (e) {
            reader_status.innerText = "(Analyse failed after " + (Date.now() - start) + " ms)";
            setError("Error while analysing data!", e);
        }

        reader_status.innerText = "(Analysed " + read.ParsedDocuments.length + " documents in " + (Date.now() - start) + " ms)";
        parser.isAnalysed = true;
    };

    parser.parseInput = function() {
        var start = Date.now();
        parser.isCrashed = false;
        var preParseCount = read.ParsedDocuments.length;
        var parsed;

        //-- WITHOUT TRY-CATCH
        // parsed = getParsedDocuments();
        // parser.lastParse = parsed;
        // runReader(parsed);
        //-- WITH TRY-CATCH
        try {
            setError();
            parsed = getParsedDocuments();
            parser.lastParse = parsed;

            try {
                runReader(parsed);
            } catch (e) {
                reader_status.innerText = "(Parsing failed after " + (Date.now() - start) + " ms)";
                setError("Error while reading data!", e);
            }
        } catch (e) {
            reader_status.innerText = "(Parsing failed after " + (Date.now() - start) + " ms)";
            setError("Error while parsing documents!", e);
        }
        //-------------------

        var readCount = read.ParsedDocuments.length - preParseCount;
        reader_status.innerText = "(Read "+readCount+" documents in " + (Date.now() - start) + " ms. Read "+read.ParsedDocuments.length+" documents in total)";

        parser.isParsed = true;
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

    function getDocHeader(doc) {
        var headList = doc.getElementsByClassName('header');
        if (headList.length == 0) return null;
        var head = headList[0];

        var spans = head.getElementsByTagName('span');

        var date = spans[3].innerText
            .replace('--:--', '00:00');

        return {
            id: [
                spans[0].innerText,
                spans[1].innerText,
                spans[2].innerText,
                date
            ].join('|'),
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

    function startParseTimer() {
        clearTimeout(timer);
        parser.isCrashed = false;
        parser.isParsed = false;
        reader_status.innerText = "(Parsing, please wait...)";
        setError(null, null);

        timer = setTimeout(parser.parseInput, 300);
    }

    // input.addEventListener("DOMNodeInserted", startParseTimer, false);
    // input.addEventListener("DOMNodeRemoved", startParseTimer, false);
    // input.addEventListener("DOMCharacterDataModified", startParseTimer, false);
})();
