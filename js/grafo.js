/* =============================================================
   Il disegno con il deposito, i clienti e i giri dei furgoni.

   Con i pulsanti sopra il disegno si sceglie cosa mostrare:
     "s1"   il giro dell'unico furgone (scenario 1)
     "s2"   i giri dei due furgoni (scenario 2)
     "all"  tutti i collegamenti tra i paesi, con i km
   ============================================================= */

let vistaGrafo = "s1";

/* Misure del disegno, in pixel. Devono coincidere con quelle
   scritte nel file HTML (viewBox="0 0 560 600"). */
const LARGHEZZA_GRAFO = 560;
const ALTEZZA_GRAFO = 600;
const MARGINE_GRAFO = 64;

/** Le linee si fermano a questa distanza dal centro di un paese, per non coprirne il cerchio. */
const RAGGIO_INGOMBRO_NODO = 16;

/**
 * Trasforma la posizione reale di ogni paese (latitudine e longitudine)
 * in un punto del disegno. Le distanze nord-sud sono in scala reale;
 * quelle est-ovest possono essere allargate fino a 1,8 volte, perché
 * i paesi sono quasi in fila lungo la valle e il disegno verrebbe
 * troppo stretto per leggerlo.
 */
function calcolaPosizioniNodi() {
  // sulle Alpi un grado di longitudine è più corto di uno di latitudine: si corregge
  const LATITUDINE_RIFERIMENTO = 46.18;
  const correzioneLongitudine = Math.cos(
    (LATITUDINE_RIFERIMENTO * Math.PI) / 180,
  );

  const xs = DATI.nodi.map((nodo) => nodo.lon * correzioneLongitudine);
  const ys = DATI.nodi.map((nodo) => nodo.lat);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  const scalaY = (ALTEZZA_GRAFO - 2 * MARGINE_GRAFO) / (maxY - minY);
  const scalaX = Math.min(
    (LARGHEZZA_GRAFO - 2 * MARGINE_GRAFO) / (maxX - minX),
    scalaY * 1.8,
  );

  // centra il disegno nell'area disponibile
  const spostamentoX = (LARGHEZZA_GRAFO - (maxX - minX) * scalaX) / 2;
  const spostamentoY = (ALTEZZA_GRAFO - (maxY - minY) * scalaY) / 2;

  return DATI.nodi.map((_, i) => ({
    x: spostamentoX + (xs[i] - minX) * scalaX,
    // nel disegno i valori crescono verso il basso: si capovolge, così il nord resta in alto
    y: spostamentoY + (maxY - ys[i]) * scalaY,
  }));
}
const POSIZIONI_NODI = calcolaPosizioniNodi();

/*
  Dove scrivere nomi e numeri accanto a ogni paese, sistemato a mano
  perché le scritte non si sovrappongano. Il numero a sinistra è
  quello del paese (0 = Monno).
*/
// nome del paese: [spostamento a destra, spostamento in basso, allineamento del testo]
const POSIZIONE_ETICHETTA = {
  0: [-16, 4, "end"],
  1: [6, 26, "start"],
  2: [-16, 4, "end"],
  3: [-14, -16, "end"],
  4: [-14, -24, "end"],
  5: [16, 4, "start"],
};
// cerchietto con il numero della tappa: [spostamento a destra, spostamento in basso]
const POSIZIONE_NUMERO_TAPPA = {
  1: [12, -12],
  2: [13, -11],
  3: [13, -13],
  4: [13, 13],
  5: [-13, -13],
};

/** Kg totali da consegnare a tutti i clienti. */
const DOMANDA_TOTALE = DATI.nodi.reduce((somma, nodo) => somma + nodo.domanda, 0);

/**
 * I giri da disegnare, uno per furgone, con colore e dati da mostrare.
 * Nella vista "all" non si disegna nessun giro.
 */
function percorsiDellaVista(vista) {
  if (vista === "s1") {
    return [
      {
        titolo: "Veicolo unico",
        sequenza: SCENARIO_1.sequenza,
        km: SCENARIO_1.km,
        kg: DOMANDA_TOTALE,
        capacita: DATI.capacita.s1,
        colore: "var(--accent)",
        freccia: "arr-s1",
      },
    ];
  }
  if (vista === "s2") {
    return MIGLIORE_SCENARIO_2.veicoli.map((veicolo, i) => ({
      titolo: `Veicolo ${i + 1}`,
      sequenza: veicolo.sequenza,
      km: veicolo.km,
      kg: veicolo.kg,
      capacita: DATI.capacita.s2,
      colore: i === 0 ? "var(--v1)" : "var(--v2)",
      freccia: i === 0 ? "arr-v1" : "arr-v2",
    }));
  }
  return [];
}

/* ---------- i pezzi del disegno ----------
   Ogni funzione restituisce il codice di una parte del disegno
   (linee, cerchi, scritte), che poi viene messo insieme in disegnaGrafo(). */

/** Le punte di freccia alla fine dei giri, una per ogni colore. */
function htmlPunteDiFreccia() {
  const frecce = [
    ["arr-s1", "var(--accent)"],
    ["arr-v1", "var(--v1)"],
    ["arr-v2", "var(--v2)"],
  ];
  const marker = frecce.map(
    ([id, colore]) =>
      `<marker id="${id}" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">` +
      `<path d="M0,0 L10,5 L0,10 z" fill="${colore}"/></marker>`,
  );
  return `<defs>${marker.join("")}</defs>`;
}

/** Le linee grigie che collegano ogni paese a tutti gli altri; nella vista "all" anche con i km. */
function htmlArchi() {
  const mostraDistanze = vistaGrafo === "all";
  const numeroNodi = DATI.nodi.length;
  let html = "";
  for (let i = 0; i < numeroNodi; i++) {
    for (let j = i + 1; j < numeroNodi; j++) {
      const a = POSIZIONI_NODI[i];
      const b = POSIZIONI_NODI[j];
      html += `<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" opacity="${mostraDistanze ? 1 : 0.45}"/>`;
      if (mostraDistanze) {
        const centroX = (a.x + b.x) / 2;
        const centroY = (a.y + b.y) / 2;
        html += `<text class="edge-label" x="${centroX}" y="${centroY}" text-anchor="middle" dy="4">${formattaNumero(DATI.distanze[i][j])}</text>`;
      }
    }
  }
  return html;
}

/**
 * Le linee di un giro: Monno → clienti → Monno.
 * Ogni tratto è accorciato alle due estremità, così non entra nei cerchi dei paesi.
 * "M" vuol dire "spostati qui" e "L" "traccia una linea fin qui".
 */
function tracciatoGiro(sequenzaClienti) {
  const punti = [0, ...sequenzaClienti, 0].map((i) => POSIZIONI_NODI[i]);
  let tracciato = "";
  for (let i = 0; i < punti.length - 1; i++) {
    const da = punti[i];
    const a = punti[i + 1];
    const dx = a.x - da.x;
    const dy = a.y - da.y;
    const lunghezza = Math.hypot(dx, dy);
    // di quanto accorciare il tratto, in orizzontale e in verticale
    const rientroX = (dx / lunghezza) * RAGGIO_INGOMBRO_NODO;
    const rientroY = (dy / lunghezza) * RAGGIO_INGOMBRO_NODO;

    const inizioX = da.x + rientroX;
    const inizioY = da.y + rientroY;
    const fineX = a.x - rientroX;
    const fineY = a.y - rientroY;
    tracciato += `M${inizioX.toFixed(1)},${inizioY.toFixed(1)} L${fineX.toFixed(1)},${fineY.toFixed(1)} `;
  }
  return tracciato;
}

/** I giri dei furgoni, ognuno nel suo colore e con la freccia finale. */
function htmlPercorsi(percorsi) {
  return percorsi
    .map(
      (p) =>
        `<path class="route" d="${tracciatoGiro(p.sequenza)}" stroke="${p.colore}" marker-end="url(#${p.freccia})"/>`,
    )
    .join("");
}

/** Un cerchio per ogni paese, con nome e kg da consegnare (il deposito ha un quadratino al centro). */
function htmlNodi() {
  let html = "";
  DATI.nodi.forEach((nodo, i) => {
    const p = POSIZIONI_NODI[i];
    const eDeposito = i === 0;

    html += `<circle class="node-circle ${eDeposito ? "node-depot" : ""}" cx="${p.x}" cy="${p.y}" r="${eDeposito ? 11 : 9}"/>`;
    if (eDeposito) {
      html += `<rect x="${p.x - 4}" y="${p.y - 4}" width="8" height="8" fill="var(--surface)" rx="1"/>`;
    }

    const [dx, dy, allineamento] = POSIZIONE_ETICHETTA[i];
    const x = p.x + dx;
    const y = p.y + dy;
    const sottotitolo = eDeposito ? "deposito" : nodo.domanda + " kg";
    html += `<text class="node-name" x="${x}" y="${y}" text-anchor="${allineamento}">${nodo.nome}</text>`;
    html += `<text class="node-kg" x="${x}" y="${y + 14}" text-anchor="${allineamento}">${sottotitolo}</text>`;
  });
  return html;
}

/** Accanto a ogni cliente, il numero che dice in che ordine viene servito, nel colore del suo furgone. */
function htmlNumeriTappa(percorsi) {
  let html = "";
  for (const percorso of percorsi) {
    percorso.sequenza.forEach((cliente, posizione) => {
      const p = POSIZIONI_NODI[cliente];
      const [dx, dy] = POSIZIONE_NUMERO_TAPPA[cliente];
      const x = p.x + dx;
      const y = p.y + dy;
      html += `<circle cx="${x}" cy="${y}" r="8" fill="${percorso.colore}"/>`;
      html += `<text class="step" x="${x}" y="${y + 3.5}" text-anchor="middle">${posizione + 1}</text>`;
    });
  }
  return html;
}

/* ---------- legenda e riquadri sotto il disegno ---------- */

/** Il riquadro con km, carico e paesi visitati da un furgone. */
function htmlSchedaPercorso(percorso) {
  return `
    <div class="route-card" style="border-left-color:${percorso.colore}">
      <div class="r-title">
        <span>${percorso.titolo}</span>
        <span>${formattaNumero(percorso.km)} km · ${percorso.kg}/${percorso.capacita} kg</span>
      </div>
      <div class="r-path">${descriviPercorso(percorso.sequenza)}</div>
    </div>`;
}

/** La legenda sotto il disegno, che spiega i colori. */
function htmlLegenda() {
  const voce = (colore, testo) =>
    `<span><i style="background:${colore}"></i>${testo}</span>`;

  if (vistaGrafo === "s1") {
    return (
      voce("var(--accent)", `Veicolo unico, ${DATI.capacita.s1} kg`) +
      `<span>I numeri indicano l'ordine delle consegne</span>`
    );
  }
  if (vistaGrafo === "s2") {
    return (
      voce("var(--v1)", "Veicolo 1 · zona nord") +
      voce("var(--v2)", "Veicolo 2 · zona sud")
    );
  }
  const numeroArchi = (DATI.nodi.length * (DATI.nodi.length - 1)) / 2;
  return voce(
    "var(--edge)",
    `${numeroArchi} archi del grafo completo, con la distanza stradale in km`,
  );
}

/* ---------- il disegno completo ---------- */

/** Ridisegna tutto: disegno, legenda e riquadri dei furgoni. */
function disegnaGrafo() {
  const percorsi = percorsiDellaVista(vistaGrafo);

  // l'ordine conta: ogni pezzo viene disegnato sopra i precedenti
  $("#graph").innerHTML =
    htmlPunteDiFreccia() +
    htmlArchi() +
    htmlPercorsi(percorsi) +
    htmlNodi() +
    htmlNumeriTappa(percorsi);

  $("#legend").innerHTML = htmlLegenda();
  $("#routes").innerHTML = percorsi.map(htmlSchedaPercorso).join("");
}

/** Fa funzionare i pulsanti "Scenario 1", "Scenario 2" e "Tutti gli archi" sopra il disegno. */
function collegaPulsantiVista() {
  const pulsanti = document.querySelectorAll(".seg button");
  pulsanti.forEach((pulsante) =>
    pulsante.addEventListener("click", () => {
      vistaGrafo = pulsante.dataset.view;
      pulsanti.forEach((altro) =>
        altro.setAttribute("aria-pressed", String(altro === pulsante)),
      );
      disegnaGrafo();
    }),
  );
}
