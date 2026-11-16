/* =============================================================
   Grafico di sensibilità: fa variare un solo parametro lungo tutto
   l'intervallo del suo cursore (tenendo fermi gli altri) e mostra
   come cambia il costo dei due scenari e dove si incrociano.
   ============================================================= */

/** Parametri selezionabili nel menu "Fai variare". */
const PARAMETRI_SENSIBILITA = [
  "costo_orario",
  "prezzo_gasolio",
  "fisso_medio",
  "fisso_comp",
  "velocita",
  "tempo_carico",
];

/** Precisazione aggiunta nel menu, perché le due etichette sarebbero identiche. */
const PRECISAZIONE_MENU = {
  fisso_medio: " (furgone medio)",
  fisso_comp: " (furgone compatto)",
};

/* Dimensioni del grafico (devono corrispondere al viewBox dell'<svg id="chart">). */
const LARGHEZZA_GRAFICO = 520;
const ALTEZZA_GRAFICO = 320;
const MARGINI_GRAFICO = { sinistra: 62, destra: 16, sopra: 16, sotto: 46 };

function creaSelettoreSensibilita() {
  const menu = $("#sens-var");
  menu.innerHTML = PARAMETRI_SENSIBILITA.map((chiave) => {
    const testo =
      CONTROLLO_PER_CHIAVE[chiave].etichetta + (PRECISAZIONE_MENU[chiave] || "");
    return `<option value="${chiave}">${testo}</option>`;
  }).join("");
  menu.addEventListener("change", aggiorna);
}

/** Valuta i due scenari cambiando un solo parametro rispetto a quelli correnti. */
function valutaConParametro(chiave, valore) {
  return valutaScenari({ ...parametriCorrenti, [chiave]: valore });
}

/** Restituisce i valori equidistanti da min a max (estremi inclusi), divisi in "parti". */
function valoriEquidistanti(min, max, parti) {
  return Array.from(
    { length: parti + 1 },
    (_, i) => min + ((max - min) * i) / parti,
  );
}

/**
 * Cerca il valore del parametro per cui i due scenari costano uguale.
 * 1) scorre l'intervallo a piccoli passi finché la differenza cambia segno;
 * 2) affina il risultato dentro quel passo con il metodo di bisezione.
 * Restituisce null se le curve non si incrociano nell'intervallo.
 */
function trovaPareggio(chiave) {
  const { min, max } = CONTROLLO_PER_CHIAVE[chiave];
  const NUMERO_PASSI = 400;
  const ITERAZIONI_BISEZIONE = 40;

  const differenza = (valore) => {
    const r = valutaConParametro(chiave, valore);
    return r.scenario2.totale - r.scenario1.totale;
  };

  let differenzaPrecedente = differenza(min);
  for (let i = 1; i <= NUMERO_PASSI; i++) {
    const valore = min + ((max - min) * i) / NUMERO_PASSI;
    const differenzaAttuale = differenza(valore);

    if (Math.sign(differenzaAttuale) !== Math.sign(differenzaPrecedente)) {
      // il pareggio sta tra il passo precedente e questo
      let basso = valore - (max - min) / NUMERO_PASSI;
      let alto = valore;
      for (let j = 0; j < ITERAZIONI_BISEZIONE; j++) {
        const medio = (basso + alto) / 2;
        if (Math.sign(differenza(medio)) === Math.sign(differenza(basso))) {
          basso = medio;
        } else {
          alto = medio;
        }
      }
      return (basso + alto) / 2;
    }
    differenzaPrecedente = differenzaAttuale;
  }
  return null;
}

/* ---------- disegno ---------- */

function disegnaGraficoSensibilita() {
  const chiave = $("#sens-var").value;
  const controllo = CONTROLLO_PER_CHIAVE[chiave];
  const W = LARGHEZZA_GRAFICO;
  const H = ALTEZZA_GRAFICO;
  const M = MARGINI_GRAFICO;

  // 1) campiona i costi lungo tutto l'intervallo del cursore
  const valoriX = valoriEquidistanti(controllo.min, controllo.max, 60);
  const risultati = valoriX.map((v) => valutaConParametro(chiave, v));
  const costi1 = risultati.map((r) => r.scenario1.totale);
  const costi2 = risultati.map((r) => r.scenario2.totale);

  // 2) intervallo dell'asse Y, con un po' di margine sopra e sotto
  let yMin = Math.min(...costi1, ...costi2);
  let yMax = Math.max(...costi1, ...costi2);
  const margineY = (yMax - yMin) * 0.08 || 5;
  yMin = Math.max(0, yMin - margineY);
  yMax += margineY;

  // 3) funzioni che convertono un valore in coordinata del disegno
  const xGrafico = (valore) =>
    M.sinistra +
    ((valore - controllo.min) / (controllo.max - controllo.min)) *
      (W - M.sinistra - M.destra);
  const yGrafico = (costo) =>
    H - M.sotto - ((costo - yMin) / (yMax - yMin)) * (H - M.sopra - M.sotto);
  const tracciatoCurva = (costi) =>
    costi
      .map((costo, i) => {
        const comando = i === 0 ? "M" : "L";
        return `${comando}${xGrafico(valoriX[i]).toFixed(1)},${yGrafico(costo).toFixed(1)}`;
      })
      .join("");

  let svg = "";

  // griglia orizzontale ed etichette in euro
  for (const costo of valoriEquidistanti(yMin, yMax, 4)) {
    const y = yGrafico(costo);
    svg += `<line class="grid" x1="${M.sinistra}" x2="${W - M.destra}" y1="${y}" y2="${y}"/>`;
    svg += `<text x="${M.sinistra - 8}" y="${y + 4}" text-anchor="end">${formattaNumero(costo, 0)} €</text>`;
  }

  // etichette dell'asse X (la prima allineata a sinistra, l'ultima a destra)
  valoriEquidistanti(controllo.min, controllo.max, 4).forEach((valore, i) => {
    let allineamento = "middle";
    if (i === 0) allineamento = "start";
    if (i === 4) allineamento = "end";
    svg += `<text x="${xGrafico(valore)}" y="${H - M.sotto + 18}" text-anchor="${allineamento}">${controllo.formatta(valore)}</text>`;
  });
  svg += `<text x="${(M.sinistra + W - M.destra) / 2}" y="${H - 8}" text-anchor="middle">${controllo.etichetta}</text>`;

  // linea tratteggiata e punto di pareggio
  const pareggio = trovaPareggio(chiave);
  if (pareggio !== null) {
    const x = xGrafico(pareggio);
    const y = yGrafico(valutaConParametro(chiave, pareggio).scenario1.totale);
    // vicino al bordo destro l'etichetta va a sinistra della linea
    const etichettaASinistra = x > W - 170;
    svg += `<line x1="${x}" x2="${x}" y1="${M.sopra}" y2="${H - M.sotto}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--text)"/>`;
    svg += `<text x="${etichettaASinistra ? x - 6 : x + 6}" y="${M.sopra + 12}" text-anchor="${etichettaASinistra ? "end" : "start"}" fill="var(--text)" style="font-weight:600">pareggio ${controllo.formatta(pareggio)}</text>`;
  }

  // le due curve: continua = scenario 1, tratteggiata = scenario 2
  svg += `<path d="${tracciatoCurva(costi1)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
  svg += `<path d="${tracciatoCurva(costi2)}" fill="none" stroke="var(--v2)" stroke-width="2.5" stroke-dasharray="7 4"/>`;

  // valore attuale del cursore
  const valoreAttuale = parametriCorrenti[chiave];
  const attuale = valutaScenari(parametriCorrenti);
  const xAttuale = xGrafico(valoreAttuale);
  svg += `<line x1="${xAttuale}" x2="${xAttuale}" y1="${M.sopra}" y2="${H - M.sotto}" stroke="var(--border)"/>`;
  svg += `<circle cx="${xAttuale}" cy="${yGrafico(attuale.scenario1.totale)}" r="4" fill="var(--accent)"/>`;
  svg += `<circle cx="${xAttuale}" cy="${yGrafico(attuale.scenario2.totale)}" r="4" fill="var(--v2)"/>`;

  // legenda in alto a sinistra
  svg += `
    <g transform="translate(${M.sinistra + 10},${M.sopra + 6})">
      <rect width="150" height="40" rx="6" fill="var(--surface)" stroke="var(--border)"/>
      <line x1="10" x2="30" y1="14" y2="14" stroke="var(--accent)" stroke-width="2.5"/>
      <text x="36" y="18" fill="var(--text)">Scenario 1</text>
      <line x1="10" x2="30" y1="29" y2="29" stroke="var(--v2)" stroke-width="2.5" stroke-dasharray="7 4"/>
      <text x="36" y="33" fill="var(--text)">Scenario 2</text>
    </g>`;

  $("#chart").innerHTML = svg;
  $("#sens-note").textContent = notaSensibilita(
    chiave,
    pareggio,
    attuale,
    valoreAttuale,
  );
}

/** Frase di commento sotto il grafico. */
function notaSensibilita(chiave, pareggio, attuale, valoreAttuale) {
  const controllo = CONTROLLO_PER_CHIAVE[chiave];

  if (pareggio === null) {
    const scenarioMigliore =
      attuale.scenario2.totale - attuale.scenario1.totale > 0
        ? "1 (un veicolo)"
        : "2 (due veicoli)";
    return `In tutto l'intervallo lo scenario ${scenarioMigliore} resta il più economico: questa voce da sola non cambia la scelta.`;
  }

  // guarda un po' oltre il pareggio per capire quale scenario vince da lì in poi
  const valoreOltre = Math.min(
    controllo.max,
    pareggio + (controllo.max - controllo.min) / 50,
  );
  const oltre = valutaConParametro(chiave, valoreOltre);
  const chiConviene =
    oltre.scenario2.totale < oltre.scenario1.totale
      ? "convengono i due veicoli"
      : "conviene il veicolo unico";
  return `Le curve si incrociano a ${controllo.formatta(pareggio)}: oltre questo valore ${chiConviene}. Valore attuale: ${controllo.formatta(valoreAttuale)}.`;
}
