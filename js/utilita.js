/* =============================================================
   Piccoli strumenti usati da tutti gli altri file:
   trovare un elemento nella pagina e scrivere numeri, euro e
   orari nel formato italiano (virgola per i decimali, punto per
   le migliaia).
   ============================================================= */

/**
 * Trova un elemento della pagina. Esempio: $("#reset") restituisce
 * il pulsante che nel file HTML ha id="reset".
 */
const $ = (selettore) => document.querySelector(selettore);

/** Nomi dei paesi, nello stesso ordine dei dati: il numero 0 è il deposito di Monno. */
const NOMI_NODI = DATI.nodi.map((nodo) => nodo.nome);

/** 1234.5 → "1.234,50 €" */
function formattaEuro(valore) {
  return valore.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
}

/** 1234.5 → "1.235 €" (arrotondato all'euro, usato per i totali annui). */
function formattaEuroIntero(valore) {
  // la "regola" tra le barre / / inserisce un punto ogni tre cifre, partendo da destra
  const conPuntiDelleMigliaia = Math.round(valore)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return conPuntiDelleMigliaia + " €";
}

/** formattaNumero(3.14159, 2) → "3,14" */
function formattaNumero(valore, decimali = 1) {
  return valore.toLocaleString("it-IT", {
    minimumFractionDigits: decimali,
    maximumFractionDigits: decimali,
  });
}

/**
 * Scrive un valore con il segno + o − davanti, usando la funzione
 * di formattazione indicata. Lo zero resta senza segno.
 * Esempio: conSegno(-3, formattaEuro) → "−3,00 €"
 */
function conSegno(valore, formatta) {
  let segno = "";
  if (valore > 0) segno = "+";
  if (valore < 0) segno = "−";
  return segno + formatta(Math.abs(valore));
}

/** Scrive una durata in ore e minuti: 1.75 ore → "1h 45min", 0.5 ore → "30 min". */
function formattaDurata(oreDecimali) {
  let ore = Math.floor(oreDecimali);
  let minuti = Math.round((oreDecimali - ore) * 60);
  if (minuti === 60) {
    // es. 1.999 ore: l'arrotondamento dà 60 minuti, che diventano un'ora in più
    ore++;
    minuti = 0;
  }
  if (ore === 0) return `${minuti} min`;
  return `${ore}h ${String(minuti).padStart(2, "0")}min`;
}

/** Scrive un giro con i nomi dei paesi, partendo e tornando a Monno: "Monno → Edolo → Malonno → Monno". */
function descriviPercorso(sequenzaClienti) {
  const giroCompleto = [0, ...sequenzaClienti, 0];
  return giroCompleto.map((indice) => NOMI_NODI[indice]).join(" → ");
}
