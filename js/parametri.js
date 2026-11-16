/* ---------- parametri ---------- */
const P0 = DATI.parametri;
const DEF = {
  prezzo_gasolio: P0.prezzo_gasolio,
  costo_orario: P0.costo_orario,
  velocita: P0.velocita,
  tempo_scarico: P0.tempo_scarico,
  tempo_carico: P0.tempo_carico,
  fisso_medio: P0.veicoli.furgone_medio.costo_fisso_giorno,
  consumo_medio: P0.veicoli.furgone_medio.consumo_l_100km,
  usura_medio: P0.veicoli.furgone_medio.altri_costi_km,
  fisso_comp: P0.veicoli.furgone_compatto.costo_fisso_giorno,
  consumo_comp: P0.veicoli.furgone_compatto.consumo_l_100km,
  usura_comp: P0.veicoli.furgone_compatto.altri_costi_km,
};
let P = { ...DEF };

const CONTROLLI = [
  {
    gruppo: "Carburante e lavoro",
    items: [
      {
        k: "prezzo_gasolio",
        label: "Prezzo gasolio (IVA esclusa)",
        min: 1.2,
        max: 2.6,
        step: 0.01,
        f: (v) => fmtNum(v, 2) + " €/l",
        src: "MIMIT, Lombardia, 13/10/2026: 2,247 €/l IVA inclusa",
      },
      {
        k: "costo_orario",
        label: "Costo orario autista",
        min: 18,
        max: 40,
        step: 0.5,
        f: (v) => fmtNum(v, 2) + " €/h",
        src: "Tabelle ministeriali 2026: 22,64–30,27 €/h",
      },
    ],
  },
  {
    gruppo: "Tempi operativi",
    items: [
      {
        k: "velocita",
        label: "Velocità media",
        min: 30,
        max: 70,
        step: 1,
        f: (v) => v + " km/h",
        src: "Percorsi su strada statale SS42",
      },
      {
        k: "tempo_scarico",
        label: "Scarico per cliente",
        min: 0,
        max: 30,
        step: 1,
        f: (v) => v + " min",
      },
      {
        k: "tempo_carico",
        label: "Carico al deposito per veicolo",
        min: 0,
        max: 45,
        step: 1,
        f: (v) => v + " min",
      },
    ],
  },
  {
    gruppo: "Furgone medio · scenario 1",
    items: [
      {
        k: "fisso_medio",
        label: "Costo fisso giornaliero",
        min: 10,
        max: 90,
        step: 1,
        f: (v) => fmtNum(v, 0) + " €/giorno",
      },
      {
        k: "consumo_medio",
        label: "Consumo",
        min: 5,
        max: 14,
        step: 0.1,
        f: (v) => fmtNum(v, 1) + " l/100 km",
      },
      {
        k: "usura_medio",
        label: "Usura e manutenzione",
        min: 0,
        max: 0.25,
        step: 0.01,
        f: (v) => fmtNum(v, 2) + " €/km",
      },
    ],
  },
  {
    gruppo: "Furgone compatto · scenario 2 (×2)",
    items: [
      {
        k: "fisso_comp",
        label: "Costo fisso giornaliero",
        min: 5,
        max: 70,
        step: 1,
        f: (v) => fmtNum(v, 0) + " €/giorno",
      },
      {
        k: "consumo_comp",
        label: "Consumo",
        min: 3,
        max: 12,
        step: 0.1,
        f: (v) => fmtNum(v, 1) + " l/100 km",
      },
      {
        k: "usura_comp",
        label: "Usura e manutenzione",
        min: 0,
        max: 0.25,
        step: 0.01,
        f: (v) => fmtNum(v, 2) + " €/km",
      },
    ],
  },
];
const CTRL = Object.fromEntries(
  CONTROLLI.flatMap((g) => g.items).map((c) => [c.k, c]),
);
