/* =============================================================
   Parametri del modello di costo e definizione dei cursori
   che permettono di modificarli.
   ============================================================= */

/** Parametri così come arrivano dagli script Python. */
const PARAMETRI_DATI = DATI.parametri;
const FURGONE_MEDIO = PARAMETRI_DATI.veicoli.furgone_medio;
const FURGONE_COMPATTO = PARAMETRI_DATI.veicoli.furgone_compatto;

/** Valori iniziali, in forma "piatta": una chiave per ogni cursore. */
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

/** Valori attualmente impostati dall'utente con i cursori. */
let parametriCorrenti = { ...VALORI_INIZIALI };

/*
  Ogni cursore è descritto da:
    chiave     nome del parametro in parametriCorrenti
    etichetta  testo mostrato all'utente
    min, max, passo  intervallo del cursore
    formatta   funzione che trasforma il valore in testo (con unità di misura)
    fonte      (facoltativa) da dove proviene il valore iniziale
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

/** Tutti i cursori in un'unica lista, senza la divisione in gruppi. */
const TUTTI_I_CONTROLLI = GRUPPI_DI_CONTROLLI.flatMap(
  (gruppo) => gruppo.controlli,
);

/** Accesso diretto a un cursore dalla sua chiave, es. CONTROLLO_PER_CHIAVE.velocita */
const CONTROLLO_PER_CHIAVE = Object.fromEntries(
  TUTTI_I_CONTROLLI.map((controllo) => [controllo.chiave, controllo]),
);
