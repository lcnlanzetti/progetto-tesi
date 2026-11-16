/* =============================================================
   Il calcolo dei costi: è lo stesso di confronto_economico.py,
   ripetuto qui perché la pagina possa rifarlo ogni volta che
   si sposta un cursore.

   Scenario 1: un furgone medio visita da solo tutti i clienti.
   Scenario 2: due furgoni compatti si dividono i clienti, nel
               modo più corto trovato da enumerazione_percorsi.py.
   ============================================================= */

const SCENARIO_1 = DATI.scenario1;
const MIGLIORE_SCENARIO_2 = DATI.scenario2.ammissibili[0];

/** Consumo, usura e costo fisso del tipo di furgone indicato ("medio" o "compatto"). */
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
 * Quanto costa e quanto dura il giro di un singolo furgone.
 * fisso, carburante, altri (usura) e autista sono le quattro voci
 * di costo che compaiono nella tabella della pagina.
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

/** I valori che, nello scenario 2, si sommano tra i due furgoni. */
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
 * Calcola i costi dei due scenari con i valori indicati.
 * "durata" dice dopo quanto tempo tutte le consegne sono finite:
 * nello scenario 2 i due furgoni partono insieme, quindi si finisce
 * quando torna quello con il giro più lungo.
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
