/* =============================================================
   Utilità comuni a tutti gli altri file:
   selezione degli elementi della pagina e formattazione dei valori.
   ============================================================= */

/** Restituisce il primo elemento della pagina che corrisponde al selettore CSS. */
const $ = (selettore) => document.querySelector(selettore);

/** Nomi dei nodi del grafo, nello stesso ordine di DATI.nodi (l'indice 0 è il deposito). */
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
 * Aggiunge il segno davanti a un valore già formattato.
 * conSegno(-3, formattaEuro) → "−3,00 €"   (zero resta senza segno)
 */
function conSegno(valore, formatta) {
  let segno = "";
  if (valore > 0) segno = "+";
  if (valore < 0) segno = "−";
  return segno + formatta(Math.abs(valore));
}

/** Converte ore decimali in testo: 1.75 → "1h 45min", 0.5 → "30 min". */
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

/** Descrive un giro completo, con partenza e ritorno al deposito: "Monno → A → B → Monno". */
function descriviPercorso(sequenzaClienti) {
  const giroCompleto = [0, ...sequenzaClienti, 0];
  return giroCompleto.map((indice) => NOMI_NODI[indice]).join(" → ");
}
