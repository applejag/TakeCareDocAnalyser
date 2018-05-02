
/**
 * @typedef {Object} ReadParsedDocuments
 * @prop {ParsedVårdtillfälle[]} Vårdtillfällen
 * @prop {ParsedÖppenVårdkontakt[]} ÖppenVårdkontakter
 * @prop {ParsedMätvärde[]} Mätvärden
 * @prop {ParsedJournaltext[]} Journaltexter
 * @prop {ParsedMikrobiologiSvar[]} MikrobiologiSvar
 * @prop {ParsedRöntgenSvar[]} RöntgenSvar
 * @prop {ParsedKemlabSvar[]} KemlabSvar
 * @prop {ParsedMultidisciplinärtSvar[]} MultidisciplinäraSvar
 * @prop {ParsedLäkemedelsordination[]} Läkemedelsordinationer
 * 
 * @prop {Number[]} ParsedDocuments
 * @prop {Date} DatumMin
 * @prop {Date} DatumMax
 */

/**
 * @typedef {Object} ParsedVårdtillfälle
 * @prop {String} Rubrik
 * @prop {Date} Inskrivningsdatum 
 * @prop {Date} Utskrivningsdatum 
 * @prop {String[]} Diagnoser
 * @prop {String[]} Åtgärder 
 */

/**
 * @typedef {Object} ParsedÖppenVårdkontakt
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String[]} Diagnoser
 * @prop {String[]} Åtgärder 
 */

/**
 * @typedef {Object} ParsedMätvärde
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} RegistreradAv
 * @prop {{x: string | number}} Värden
 */

/**
 * @typedef {Object} ParsedJournaltext
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Signeringsansvarig
 * @prop {String} Mall
 * @prop {String} Fritext
 */

/**
 * @typedef {Object} ParsedMikrobiologiSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Remittent
 * @prop {String} Undersökning
 * @prop {String} Provmaterial
 * @prop {String} Svar
 */

/**
 * @typedef {Object} ParsedRöntgenSvar
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
 * @typedef {Object} ParsedKemlabSvar
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {String} Sjukhus
 * @prop {String} Remittent
 * @prop {Boolean} UtanförNågotIntervall
 * @prop {SvarVärde} Värden
 */

/**
 * @typedef {Object} ParsedMultidisciplinärtSvar
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
 * @typedef {Object} ParsedLäkemedelsordination
 * @prop {String} Rubrik
 * @prop {Date} Datum
 * @prop {Date} Utsättningsdatum
 * @prop {String[]} Läkemedel
 */

