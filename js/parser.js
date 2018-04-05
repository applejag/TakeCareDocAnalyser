
(function() {
    var parser = {};
    window.parser = parser;
    parser.isParsed = false;
    parser.isCrashed = false;

    var input = document.getElementById("input");
    var output = document.getElementById("output");
    var status = document.getElementById("output_status");
    var timer = null;
    var outputFunctions = [];

    parser.addOutput = function(name, id, func) {
        outputFunctions.push({
            name: name,
            id: id,
            func: func
        });

        var select = document.getElementById('output_type');
        var template = document.getElementById('output_type_template');

        var clone = template.cloneNode(true);
        clone.id = id;
        clone.disabled = false;
        clone.innerText = name;
        clone.value = id;
        select.appendChild(clone);

        if (outputFunctions.length === 0)
            select.value = clone.value;
    };

    function runOutput(parsed) {
        var selectElem = document.getElementById('output_type');
        var selectValue = selectElem.value;
        var selectFunc = outputFunctions.find(function(o) {
            return o.id == selectValue;
        });

        if (!selectFunc)
        {
            return "No output method selected!";
        }
        else
        {
            return selectFunc.func(parsed);
        }
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

    parser.parseInput = function() {
        var start = Date.now();
        var parsed;

        clearContent('output');

        //-- WITHOUT TRY-CATCH
        // parsed = getParsedDocuments();
        // output.innerText = runOutput(parsed);
        //-- WITH TRY-CATCH
        try {
            parsed = getParsedDocuments();

            try {
                output.innerText = runOutput(parsed);
            } catch (e) {
                setError("Error while assembling output!", e);
            }
        } catch (e) {
            setError("Error while parsing documents!", e);
        }
        //-------------------

        var dt = Date.now() - start;
        if (parser.isCrashed)
        {
            status.innerText = "(Parsing failed after " + dt + " ms)";
        }
        else
        {
            status.innerText = "(Parsed " + parsed.length + " documents in " + dt + " ms)";
            parser.isParsed = true;
        }
    };

    function getParsedDocuments() {
        var documentsData = [];

        var documents = input.getElementsByClassName("document");
        for(var i=0; i<documents.length; i++) {
            var doc = documents[i];

            var head = getDocHeader(doc);
            var body = getDocBody(doc);
            var tables = getDocBodyTables(body);

            var obj = {
                head: head,
                body: body,
                tables: tables
            };

            if (obj.header !== null && obj.body !== null)
                documentsData.push(obj);
        }

        return documentsData;
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
            datestring: date
        };
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
                var elem = cols[j];
                rowData.push({
                    text: elem.innerText,
                    html: elem.innerHTML,
                    isItalic: elem.getElementsByTagName('i').length > 0,
                    isBold: elem.getElementsByTagName('b').length > 0
                });
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

    function startParseTimer() {
        clearTimeout(timer);
        parser.isCrashed = false;
        parser.isParsed = false;
        status.innerText = "(Parsing, please wait...)";
        setError(null, null);

        timer = setTimeout(parser.parseInput, 300);
    }

    // input.addEventListener("DOMNodeInserted", startParseTimer, false);
    // input.addEventListener("DOMNodeRemoved", startParseTimer, false);
    // input.addEventListener("DOMCharacterDataModified", startParseTimer, false);
})();
