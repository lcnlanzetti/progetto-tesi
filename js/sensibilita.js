/* =============================================================
   Il grafico "Sensibilità": si sceglie un costo dal menu, lo si fa
   andare dal minimo al massimo del suo cursore (lasciando fermi
   tutti gli altri) e si guarda come cambia il costo dei due
   scenari. Dove le due linee si incrociano i due scenari costano
   uguale: è il "punto di pareggio".
   ============================================================= */

/** I costi che si possono scegliere nel menu "Fai variare". */
const PARAMETRI_SENSIBILITA = [
  "costo_orario",
  "prezzo_gasolio",
  "fisso_medio",
  "fisso_comp",
  "velocita",
  "tempo_carico",
];

/** Testo aggiunto nel menu, perché altrimenti queste due voci avrebbero lo stesso nome. */
const PRECISAZIONE_MENU = {
  fisso_medio: " (furgone medio)",
  fisso_comp: " (furgone compatto)",
};

/* Misure del grafico, in pixel. Devono coincidere con quelle
   scritte nel file HTML (viewBox="0 0 520 320"). I margini lasciano
   spazio alle scritte sugli assi. */
const LARGHEZZA_GRAFICO = 520;
const ALTEZZA_GRAFICO = 320;
const MARGINI_GRAFICO = { sinistra: 62, destra: 16, sopra: 16, sotto: 46 };

/** Riempie il menu "Fai variare" e ridisegna il grafico quando si cambia scelta. */
function creaSelettoreSensibilita() {
  const menu = $("#sens-var");
  menu.innerHTML = PARAMETRI_SENSIBILITA.map((chiave) => {
    const testo =
      CONTROLLO_PER_CHIAVE[chiave].etichetta + (PRECISAZIONE_MENU[chiave] || "");
    return `<option value="${chiave}">${testo}</option>`;
  }).join("");
  menu.addEventListener("change", aggiorna);
}

/** Calcola i due scenari cambiando un solo costo e lasciando gli altri come sono. */
function valutaConParametro(chiave, valore) {
  return valutaScenari({ ...parametriCorrenti, [chiave]: valore });
}

/** Divide l'intervallo da min a max in parti uguali. Esempio: (0, 10, 4) → [0; 2,5; 5; 7,5; 10]. */
function valoriEquidistanti(min, max, parti) {
  return Array.from(
    { length: parti + 1 },
    (_, i) => min + ((max - min) * i) / parti,
  );
}

/**
 * Cerca il valore del costo scelto per cui i due scenari costano uguale.
 * 1) Prova 400 valori dal minimo al massimo, finché lo scenario più
 *    conveniente cambia: il pareggio è tra l'ultimo valore e il precedente.
 * 2) Restringe la ricerca: guarda il punto a metà tra i due, tiene la metà
 *    in cui avviene il cambio, e ripete 40 volte fino a un valore preciso.
 * Restituisce null se le due linee non si incrociano mai.
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
      // lo scenario più conveniente è cambiato: il pareggio è tra il valore precedente e questo
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

/** Disegna il grafico per il costo scelto nel menu, e la frase di commento sotto. */
function disegnaGraficoSensibilita() {
  const chiave = $("#sens-var").value;
  const controllo = CONTROLLO_PER_CHIAVE[chiave];
  const W = LARGHEZZA_GRAFICO;
  const H = ALTEZZA_GRAFICO;
  const M = MARGINI_GRAFICO;

  // 1) calcola i costi per 61 valori, dal minimo al massimo del cursore
  const valoriX = valoriEquidistanti(controllo.min, controllo.max, 60);
  const risultati = valoriX.map((v) => valutaConParametro(chiave, v));
  const costi1 = risultati.map((r) => r.scenario1.totale);
  const costi2 = risultati.map((r) => r.scenario2.totale);

  // 2) da quanti euro a quanti euro va l'asse verticale, con un po' di spazio sopra e sotto
  let yMin = Math.min(...costi1, ...costi2);
  let yMax = Math.max(...costi1, ...costi2);
  const margineY = (yMax - yMin) * 0.08 || 5;
  yMin = Math.max(0, yMin - margineY);
  yMax += margineY;

  // 3) funzioni che dicono in che punto del disegno va un valore
  //    (xGrafico: posizione da sinistra; yGrafico: posizione dall'alto)
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

  // righe orizzontali di sfondo, con gli importi in euro a sinistra
  for (const costo of valoriEquidistanti(yMin, yMax, 4)) {
    const y = yGrafico(costo);
    svg += `<line class="grid" x1="${M.sinistra}" x2="${W - M.destra}" y1="${y}" y2="${y}"/>`;
    svg += `<text x="${M.sinistra - 8}" y="${y + 4}" text-anchor="end">${formattaNumero(costo, 0)} €</text>`;
  }

  // valori scritti sotto il grafico (il primo allineato a sinistra, l'ultimo a destra)
  valoriEquidistanti(controllo.min, controllo.max, 4).forEach((valore, i) => {
    let allineamento = "middle";
    if (i === 0) allineamento = "start";
    if (i === 4) allineamento = "end";
    svg += `<text x="${xGrafico(valore)}" y="${H - M.sotto + 18}" text-anchor="${allineamento}">${controllo.formatta(valore)}</text>`;
  });
  svg += `<text x="${(M.sinistra + W - M.destra) / 2}" y="${H - 8}" text-anchor="middle">${controllo.etichetta}</text>`;

  // punto di pareggio: linea verticale tratteggiata, pallino e scritta
  const pareggio = trovaPareggio(chiave);
  if (pareggio !== null) {
    const x = xGrafico(pareggio);
    const y = yGrafico(valutaConParametro(chiave, pareggio).scenario1.totale);
    // se la linea è vicina al bordo destro, la scritta va a sinistra per non uscire
    const etichettaASinistra = x > W - 170;
    svg += `<line x1="${x}" x2="${x}" y1="${M.sopra}" y2="${H - M.sotto}" stroke="var(--muted)" stroke-dasharray="4 4"/>`;
    svg += `<circle cx="${x}" cy="${y}" r="4.5" fill="var(--text)"/>`;
    svg += `<text x="${etichettaASinistra ? x - 6 : x + 6}" y="${M.sopra + 12}" text-anchor="${etichettaASinistra ? "end" : "start"}" fill="var(--text)" style="font-weight:600">pareggio ${controllo.formatta(pareggio)}</text>`;
  }

  // le due linee dei costi: continua = scenario 1, tratteggiata = scenario 2
  svg += `<path d="${tracciatoCurva(costi1)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
  svg += `<path d="${tracciatoCurva(costi2)}" fill="none" stroke="var(--v2)" stroke-width="2.5" stroke-dasharray="7 4"/>`;

  // linea verticale sottile e due pallini: dove si trova ora il cursore
  const valoreAttuale = parametriCorrenti[chiave];
  const attuale = valutaScenari(parametriCorrenti);
  const xAttuale = xGrafico(valoreAttuale);
  svg += `<line x1="${xAttuale}" x2="${xAttuale}" y1="${M.sopra}" y2="${H - M.sotto}" stroke="var(--border)"/>`;
  svg += `<circle cx="${xAttuale}" cy="${yGrafico(attuale.scenario1.totale)}" r="4" fill="var(--accent)"/>`;
  svg += `<circle cx="${xAttuale}" cy="${yGrafico(attuale.scenario2.totale)}" r="4" fill="var(--v2)"/>`;

  // riquadro in alto a sinistra che spiega le due linee
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

/** La frase sotto il grafico, che spiega in parole cosa mostra. */
function notaSensibilita(chiave, pareggio, attuale, valoreAttuale) {
  const controllo = CONTROLLO_PER_CHIAVE[chiave];

  if (pareggio === null) {
    const scenarioMigliore =
      attuale.scenario2.totale - attuale.scenario1.totale > 0
        ? "1 (un veicolo)"
        : "2 (due veicoli)";
    return `In tutto l'intervallo lo scenario ${scenarioMigliore} resta il più economico: questa voce da sola non cambia la scelta.`;
  }

  // guarda un po' dopo il pareggio, per capire quale scenario conviene da lì in poi
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
