/* =============================================================
   I costi usati nei calcoli (prezzo del gasolio, stipendio degli
   autisti, ...) e l'elenco dei cursori con cui si possono cambiare
   nella pagina.
   ============================================================= */

/** I costi di partenza, così come li ha scritti confronto_economico.py. */
const PARAMETRI_DATI = DATI.parametri;
const FURGONE_MEDIO = PARAMETRI_DATI.veicoli.furgone_medio;
const FURGONE_COMPATTO = PARAMETRI_DATI.veicoli.furgone_compatto;

/** Gli stessi valori di partenza, riorganizzati con un nome per ogni cursore. */
const VALORI_INIZIALI = {
  prezzo_gasolio: PARAMETRI_DATI.prezzo_gasolio,
  costo_orario: PARAMETRI_DATI.costo_orario,
  velocita: PARAMETRI_DATI.velocita,
  tempo_scarico: PARAMETRI_DATI.tempo_scarico,
  tempo_carico: PARAMETRI_DATI.tempo_carico,

  fisso_medio: FURGONE_MEDIO.costo_fisso_giorno,
  consumo_medio: FURGONE_MEDIO.consumo_l_100km,
  usura_medio: FURGONE_MEDIO.altri_costi_km,

  fisso_comp: FURGONE_COMPATTO.costo_fisso_giorno,
  consumo_comp: FURGONE_COMPATTO.consumo_l_100km,
  usura_comp: FURGONE_COMPATTO.altri_costi_km,
};

/** I valori scelti in questo momento con i cursori (all'inizio, quelli di partenza). */
let parametriCorrenti = { ...VALORI_INIZIALI };

/*
  Elenco dei cursori, divisi in gruppi. Per ognuno si indica:
    chiave           il nome del costo che il cursore modifica
    etichetta        il testo scritto sopra il cursore
    min, max, passo  valore minimo, massimo e di quanto si sposta ogni scatto
    formatta         come scrivere il valore, con l'unità di misura (€/l, km/h, ...)
    fonte            (non sempre presente) da dove viene il valore di partenza
*/
const GRUPPI_DI_CONTROLLI = [
  {
    titolo: "Carburante e lavoro",
    controlli: [
      {
        chiave: "prezzo_gasolio",
        etichetta: "Prezzo gasolio (IVA esclusa)",
        min: 1.2,
        max: 2.6,
        passo: 0.01,
        formatta: (v) => formattaNumero(v, 2) + " €/l",
        fonte: "MIMIT, Lombardia, 13/10/2026: 2,247 €/l IVA inclusa",
      },
      {
        chiave: "costo_orario",
        etichetta: "Costo orario autista",
        min: 18,
        max: 40,
        passo: 0.5,
        formatta: (v) => formattaNumero(v, 2) + " €/h",
        fonte: "Tabelle ministeriali 2026: 22,64–30,27 €/h",
      },
    ],
  },
  {
    titolo: "Tempi operativi",
    controlli: [
      {
        chiave: "velocita",
        etichetta: "Velocità media",
        min: 30,
        max: 70,
        passo: 1,
        formatta: (v) => v + " km/h",
        fonte: "Percorsi su strada statale SS42",
      },
      {
        chiave: "tempo_scarico",
        etichetta: "Scarico per cliente",
        min: 0,
        max: 30,
        passo: 1,
        formatta: (v) => v + " min",
      },
      {
        chiave: "tempo_carico",
        etichetta: "Carico al deposito per veicolo",
        min: 0,
        max: 45,
        passo: 1,
        formatta: (v) => v + " min",
      },
    ],
  },
  {
    titolo: "Furgone medio · scenario 1",
    controlli: [
      {
        chiave: "fisso_medio",
        etichetta: "Costo fisso giornaliero",
        min: 10,
        max: 90,
        passo: 1,
        formatta: (v) => formattaNumero(v, 0) + " €/giorno",
      },
      {
        chiave: "consumo_medio",
        etichetta: "Consumo",
        min: 5,
        max: 14,
        passo: 0.1,
        formatta: (v) => formattaNumero(v, 1) + " l/100 km",
      },
      {
        chiave: "usura_medio",
        etichetta: "Usura e manutenzione",
        min: 0,
        max: 0.25,
        passo: 0.01,
        formatta: (v) => formattaNumero(v, 2) + " €/km",
      },
    ],
  },
  {
    titolo: "Furgone compatto · scenario 2 (×2)",
    controlli: [
      {
        chiave: "fisso_comp",
        etichetta: "Costo fisso giornaliero",
        min: 5,
        max: 70,
        passo: 1,
        formatta: (v) => formattaNumero(v, 0) + " €/giorno",
      },
      {
        chiave: "consumo_comp",
        etichetta: "Consumo",
        min: 3,
        max: 12,
        passo: 0.1,
        formatta: (v) => formattaNumero(v, 1) + " l/100 km",
      },
      {
        chiave: "usura_comp",
        etichetta: "Usura e manutenzione",
        min: 0,
        max: 0.25,
        passo: 0.01,
        formatta: (v) => formattaNumero(v, 2) + " €/km",
      },
    ],
  },
];

/** Tutti i cursori in un'unica lista, senza dividerli in gruppi. */
const TUTTI_I_CONTROLLI = GRUPPI_DI_CONTROLLI.flatMap(
  (gruppo) => gruppo.controlli,
);

/** Per trovare subito un cursore dal suo nome, es. CONTROLLO_PER_CHIAVE.velocita */
const CONTROLLO_PER_CHIAVE = Object.fromEntries(
  TUTTI_I_CONTROLLI.map((controllo) => [controllo.chiave, controllo]),
);
