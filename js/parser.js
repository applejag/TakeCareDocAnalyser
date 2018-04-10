
(function() {
    var parser = {};
    window.parser = parser;
    parser.isParsed = false;
    parser.isCrashed = false;

    var input = document.getElementById("input");
    var output = document.getElementById("output");
    var reader_arg = document.getElementById("parse_argument");
    var reader_status = document.getElementById("output_status");
    var timer = null;
    var readerFunctions = {};
    var parsedDocumentIds = [];

    parser.addReader = function(category, func) {
        readerFunctions[category] = func;
    };

    function runReader(parsed) {
        var rereads = 0;

        for (var i = 0; i < parsed.length; i++) {
            var doc = parsed[i];
            // Already read?
            if (parsedDocumentIds.indexOf(doc.head.id) !== -1) {
                rereads++;
                continue;
            }

            var reader = readerFunctions[doc.head.category];
            if (reader) {
                reader(doc);
                // Stash the id, dont read it again
                parsedDocumentIds.push(doc.head.id);
            } else {
                console.log("Unknown document category, `"+doc.head.category+"`. Document data ignored.");
            }
        }

        if (rereads > 0)
            console.log("There were "+rereads+" documents that were already read!");

        return JSON.stringify(read, null, 4);
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
        var preParseCount = parsedDocumentIds.length;

        //-- WITHOUT TRY-CATCH
        // parsed = getParsedDocuments();
        // output.innerText = runReader(parsed);
        //-- WITH TRY-CATCH
        try {
            parsed = getParsedDocuments();

            try {
                var text = runReader(parsed);
                clearContent('output');
                output.innerText = text === "" ? " " : text;
            } catch (e) {
                setError("Error while reading data!", e);
            }
        } catch (e) {
            setError("Error while parsing documents!", e);
        }
        //-------------------

        var dt = Date.now() - start;
        if (parser.isCrashed)
        {
            reader_status.innerText = "(Parsing failed after " + dt + " ms)";
        }
        else
        {
            var readCount = parsedDocumentIds.length - preParseCount;

            reader_status.innerText = "(Found " + parsed.length + " documents, read "+readCount+" in " + dt + " ms. Read "+parsedDocumentIds.length+" documents in total)";
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
        reader_status.innerText = "(Parsing, please wait...)";
        setError(null, null);

        timer = setTimeout(parser.parseInput, 300);
    }

    // input.addEventListener("DOMNodeInserted", startParseTimer, false);
    // input.addEventListener("DOMNodeRemoved", startParseTimer, false);
    // input.addEventListener("DOMCharacterDataModified", startParseTimer, false);
})();
