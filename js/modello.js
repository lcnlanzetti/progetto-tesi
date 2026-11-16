/* =============================================================
   Modello di costo (lo stesso di confronto_economico.py).

   Scenario 1: un furgone medio fa un unico giro su tutti i clienti.
   Scenario 2: due furgoni compatti si dividono i clienti; si usa
               la suddivisione migliore trovata dall'enumerazione.
   ============================================================= */

const SCENARIO_1 = DATI.scenario1;
const MIGLIORE_SCENARIO_2 = DATI.scenario2.ammissibili[0];

/** Caratteristiche di costo di un tipo di veicolo, lette dai parametri correnti. */
function caratteristicheVeicolo(tipoVeicolo, parametri) {
  if (tipoVeicolo === "medio") {
    return {
      consumo: parametri.consumo_medio, // litri ogni 100 km
      usura: parametri.usura_medio, // € al km
      costoFisso: parametri.fisso_medio, // € al giorno
    };
  }
  return {
    consumo: parametri.consumo_comp,
    usura: parametri.usura_comp,
    costoFisso: parametri.fisso_comp,
  };
}

/**
 * Costo giornaliero di un singolo giro di consegna.
 * Le chiavi fisso, carburante, altri e autista sono le voci di costo
 * mostrate nella tabella (vedi VOCI_DI_COSTO in costi.js).
 */
function costoGiro(km, numeroClienti, tipoVeicolo, parametri) {
  const veicolo = caratteristicheVeicolo(tipoVeicolo, parametri);

  const oreDiGuida = km / parametri.velocita;
  const minutiDiSosta =
    numeroClienti * parametri.tempo_scarico + parametri.tempo_carico;
  const ore = oreDiGuida + minutiDiSosta / 60;

  const litriConsumati = (km * veicolo.consumo) / 100;
  const carburante = litriConsumati * parametri.prezzo_gasolio;
  const altri = km * veicolo.usura;
  const autista = ore * parametri.costo_orario;

  return {
    km,
    ore,
    fisso: veicolo.costoFisso,
    carburante,
    altri,
    autista,
    totale: veicolo.costoFisso + carburante + altri + autista,
  };
}

/** Valori che, nello scenario 2, si ottengono sommando i due veicoli. */
const VOCI_DA_SOMMARE = [
  "km",
  "ore",
  "fisso",
  "carburante",
  "altri",
  "autista",
  "totale",
];

/**
 * Calcola i costi dei due scenari con i parametri indicati.
 * "durata" è l'ora in cui finiscono le consegne: nello scenario 2 i due
 * furgoni lavorano in parallelo, quindi conta il giro più lungo.
 */
function valutaScenari(parametri) {
  const scenario1 = costoGiro(
    SCENARIO_1.km,
    SCENARIO_1.sequenza.length,
    "medio",
    parametri,
  );
  scenario1.durata = scenario1.ore;

  const giriScenario2 = MIGLIORE_SCENARIO_2.veicoli.map((veicolo) =>
    costoGiro(veicolo.km, veicolo.sequenza.length, "compatto", parametri),
  );
  const scenario2 = {};
  for (const voce of VOCI_DA_SOMMARE) {
    scenario2[voce] = giriScenario2.reduce((somma, g) => somma + g[voce], 0);
  }
  scenario2.durata = Math.max(...giriScenario2.map((g) => g.ore));

  return { scenario1, scenario2 };
}
