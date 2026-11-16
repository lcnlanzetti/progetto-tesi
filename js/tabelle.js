/* =============================================================
   Tabelle che non dipendono dai cursori: vengono disegnate
   una sola volta all'apertura della pagina.
   ============================================================= */

const nomiClienti = (sequenza, separatore) =>
  sequenza.map((indice) => NOMI_NODI[indice]).join(separatore);

/** Scenario 2: tutte le suddivisioni ammissibili dei clienti tra i due veicoli. */
function disegnaTabellaScenario2() {
  const scenario2 = DATI.scenario2;

  $("#s2-summary").textContent =
    `${scenario2.suddivisioni} suddivisioni esaminate, ` +
    `${scenario2.scartate} scartate perché superano i ${DATI.capacita.s2} kg su un veicolo, ` +
    `${scenario2.ammissibili.length} ammissibili.`;

  const cellaVeicolo = (veicolo) => `
    <td>
      ${nomiClienti(veicolo.sequenza, ", ")}<br>
      <span class="hint">${formattaNumero(veicolo.km)} km · ${veicolo.kg} kg</span>
    </td>`;

  // la prima suddivisione è la migliore (le righe arrivano già ordinate per km)
  const righe = scenario2.ammissibili.map(
    (suddivisione, i) => `
    <tr class="${i === 0 ? "best" : ""}">
      <td>${i + 1}</td>
      ${suddivisione.veicoli.map(cellaVeicolo).join("")}
      <td class="num"><strong>${formattaNumero(suddivisione.km)}</strong></td>
    </tr>`,
  );

  $("#s2-table").innerHTML = `
    <thead>
      <tr><th>#</th><th>Veicolo 1</th><th>Veicolo 2</th><th class="num">Km</th></tr>
    </thead>
    <tbody>${righe.join("")}</tbody>`;
}

/** Scenario 1: le migliori sequenze di consegna con un solo veicolo. */
function disegnaTabellaScenario1() {
  $("#s1-summary").textContent =
    `${SCENARIO_1.esaminate} sequenze esaminate: ${SCENARIO_1.n_ottime} raggiungono ` +
    `lo stesso minimo di ${formattaNumero(SCENARIO_1.km)} km, perché i comuni si trovano ` +
    `lungo la stessa strada di fondovalle. Sono mostrate le prime ${SCENARIO_1.classifica.length}.`;

  // evidenzia tutte le sequenze che raggiungono il minimo
  const righe = SCENARIO_1.classifica.map(
    (sequenza, i) => `
    <tr class="${sequenza.km === SCENARIO_1.km ? "best" : ""}">
      <td>${i + 1}</td>
      <td>${nomiClienti(sequenza.sequenza, " → ")}</td>
      <td class="num">${formattaNumero(sequenza.km)}</td>
    </tr>`,
  );

  $("#s1-table").innerHTML = `
    <thead>
      <tr><th>#</th><th>Sequenza di consegna</th><th class="num">Km</th></tr>
    </thead>
    <tbody>${righe.join("")}</tbody>`;
}

/** Matrice delle distanze stradali tra ogni coppia di nodi. */
function disegnaMatriceDistanze() {
  const intestazione = NOMI_NODI.map((nome) => `<th class="num">${nome}</th>`);

  const righe = DATI.distanze.map((riga, i) => {
    // sulla diagonale (da un nodo a se stesso) la distanza è 0: si mostra un trattino
    const celle = riga.map(
      (km) => `<td class="num">${km ? formattaNumero(km) : "–"}</td>`,
    );
    return `<tr><td><strong>${NOMI_NODI[i]}</strong></td>${celle.join("")}</tr>`;
  });

  $("#matrix").innerHTML = `
    <thead><tr><th>Da / A</th>${intestazione.join("")}</tr></thead>
    <tbody>${righe.join("")}</tbody>`;
}

function disegnaTabelleStatiche() {
  disegnaTabellaScenario2();
  disegnaTabellaScenario1();
  disegnaMatriceDistanze();
}
