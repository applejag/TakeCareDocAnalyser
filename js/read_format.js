/* jshint ignore:start */

var read = {
    Vårdtillfällen[0..n]: {
        Rubrik: "" String,
        Inskrivningsdatum: Date,
        Utskrivningsdatum: Date,
        Diagnoser[0..n]: "" String
        Åtgärder[0..n]: "" String
    }

    ÖppnaVårdkontakter[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        Diagnoser[0..n]: "" String
        Åtgärder[0..n]: "" String
    }

    Mätvärden[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        RegistreradAv: "" String,
        Värden: {
            ["värdenamn"]: String|Number
        }
    }

    Journaltexter[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        Signeringsansvarig: "" String,
        Fritext: "" String
    }

    MikrobiologiSvar[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        Remittent: "" String,
        Undersökning: "" String,
        Provmaterial: "" String,
        Svar: "" String
    },

    RöntgenSvar[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        Remittent: "" String,
        Beställning: "" String,
        ÖnskadUndersökning: "" String,
        Frågeställning: "" String,
        Svar: "" String,
        Utlåtande: "" String
    },

    KemlabSvar[0..n] {
        Rubrik: "" String,
        Datum: Date,
        Sjukhus: "" String,
        Remittent: "" String,
        UtanförNågotIntervall: true|false,
        Värden[1..n]: {
            Analysnamn: "" String,
            Resultat: Number|String,
            UtanförIntervall: true|false,
            ReferensLägre: Number|null,
            ReferensÖvre: Number|null,
        },
    },

    MultidisciplinäraSvar[0..n] {
        Rubrik: "" String,
        Datum: Date,
        Remittent: "" String,
        UtanförNågotIntervall: true|false,
        Värden[1..n]: {
            Analysnamn: "" String,
            Resultat: Number|String,
            UtanförIntervall: true|false,
            ReferensLägre: Number|null,
            ReferensÖvre: Number|null,
        },
    },

    Läkemedelsordinationer[0..n]: {
        Rubrik: "" String,
        Datum: Date,
        Utsättningsdatum: Date,
        Läkemedel[1..n]: "" String
    }
};
