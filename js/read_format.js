
/**
 * @typedef {Object} ReadDocuments
 * @prop {ReadVårdtillfälle[]} Vårdtillfällen
 * @prop {ReadÖppenVårdkontakt[]} ÖppenVårdkontakter
 * @prop {ReadMätvärde[]} Mätvärden
 * @prop {ReadJournaltext[]} Journaltexter
 * @prop {ReadMikrobiologiSvar[]} MikrobiologiSvar
 * @prop {ReadRöntgenSvar[]} RöntgenSvar
 * @prop {ReadKemlabSvar[]} KemlabSvar
 * @prop {ReadMultidisciplinärtSvar[]} MultidisciplinäraSvar
 * @prop {ReadLäkemedelsordination[]} Läkemedelsordinationer
 * 
 * @prop {Number[]} ParsedDocuments
 * @prop {Date} DatumMin
 * @prop {Date} DatumMax
 */

/**
 * @typedef {Object} ReadVårdtillfälle
 * @prop {String} Rubrik
 * @prop {Date} Inskrivningsdatum 
 * @prop {Date} Utskrivningsdatum 
 * @prop {String[]} Diagnoser
 * @prop {String[]} Åtgärder 
 */

/**
 * @typedef {Object} ReadÖppenVårdkontakt
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String[]} Diagnoser
 * @prop {String[]} Åtgärder 
 */

/**
 * @typedef {Object} ReadMätvärde
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} RegistreradAv
 * @prop {ReadMätvärdeVärde} Värden
 */
/**
 * @typedef {Object} ReadMätvärdeVärde
 * @prop {String|Number} [x]
 */

/**
 * @typedef {Object} ReadJournaltext
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Signeringsansvarig
 * @prop {String} Mall
 * @prop {String} Fritext
 */

/**
 * @typedef {Object} ReadMikrobiologiSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Remittent
 * @prop {String} Undersökning
 * @prop {String} Provmaterial
 * @prop {String} Svar
 */

/**
 * @typedef {Object} ReadRöntgenSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Remittent
 * @prop {String} Beställning
 * @prop {String} ÖnskadUndersökning
 * @prop {String} Frågeställning
 * @prop {String} Svar
 * @prop {String} Utlåtande
 */

/**
 * @typedef {Object} ReadKemlabSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Sjukhus
 * @prop {String} Remittent
 * @prop {Boolean} UtanförNågotIntervall
 * @prop {SvarVärde} Värden
 */

/**
 * @typedef {Object} ReadMultidisciplinärtSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Remittent
 * @prop {Boolean} UtanförNågotIntervall
 * @prop {SvarVärde} Värden
 */

/**
 * @typedef {Object} SvarVärde
 * @prop {String} Analysnamn
 * @prop {Number|String} Resultat
 * @prop {Boolean} UtanförIntervall
 * @prop {Number|null} ReferensLägre
 * @prop {Number|null} ReferensÖvre
 */

/**
 * @typedef {Object} ReadLäkemedelsordination
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {Date} Utsättningsdatum
 * @prop {String[]} Läkemedel
 */


/* -------------------------- */


/**
 * @typedef {Object} ParsedCell
 * @prop {String} text Text from cell content
 * @prop {String} html Cell content in raw HTML
 * @prop {Boolean} isItalic True if cell content is italic
 * @prop {Boolean} isBold True if cell content is bold
 */

/**
 * @typedef {Object} ParsedDocumentHead
 * @prop {String} category Document category, ex: "Mätvärde"
 * @prop {String} data1 First data column in header, ex: "Tillväxtkurva"
 * @prop {String} data2 Second data column in header (usually department), ex: "H - Barn"
 * @prop {String} datestring Raw string of document timestamp cell
 * @prop {Date} datetime Date object based of {@link datestring}
 */

/**
 * @typedef {Object} ParsedDocumentTable
 * @prop {ParsedCell[]} head Table header cells
 * @prop {ParsedDocumentTableRow[]} rows Table cells divided into rows
 * @prop {ParsedDocumentTableColumn} columns Table cells divided into columns
 */

/**
 * @typedef {Object} ParsedDocumentTableRow
 * @prop {ParsedCell[]} columns Cells in this row
 * @prop {ParsedCell} [_head_cell_text_] Cell dynamically indexed via text in header cell
 */
/**
 * @typedef {Object} ParsedDocumentTableColumn
 * @prop {ParsedCell[]} [_head_cell_text_] Cells in this column, dynamically indexed via text in header cell
 */

/**
 * @typedef {Object} ParsedDocumentTree
 * @prop {ParsedCell} title Title cell for this branch
 * @prop {ParsedCell} content Content cell for this branch
 * @prop {ParsedDocumentTree[]} children Inner trees for this branch
 */

/**
 * @typedef {Object} ParsedDocument
 * @prop {Number} id Hashed ID of the entire document
 * @prop {ParsedDocumentHead} head Document head (meta) data
 * @prop {ParsedCell[][]} body Jagged array of all cells in document
 * @prop {ParsedCell[]} notes Document notes (first starting rows with italic)
 * @prop {ParsedDocumentTable[]} tables Tables found in document
 * @prop {ParsedDocumentTree[]} trees Trees found in document
 */
