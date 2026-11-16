/* =============================================================
   Le tabelle in fondo alla pagina. Non cambiano quando si spostano
   i cursori, perché mostrano i km e non i costi: vengono scritte
   una volta sola, quando si apre la pagina.
   ============================================================= */

/** I nomi dei clienti di un giro, separati dal segno indicato (es. ", " oppure " → "). */
const nomiClienti = (sequenza, separatore) =>
  sequenza.map((indice) => NOMI_NODI[indice]).join(separatore);

/** Scenario 2: tutti i modi validi di dividere i clienti tra i due furgoni. */
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

  // le divisioni arrivano già in ordine di km: la prima è la migliore e viene evidenziata
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

/** Scenario 1: gli ordini di visita più corti con un solo furgone. */
function disegnaTabellaScenario1() {
  $("#s1-summary").textContent =
    `${SCENARIO_1.esaminate} sequenze esaminate: ${SCENARIO_1.n_ottime} raggiungono ` +
    `lo stesso minimo di ${formattaNumero(SCENARIO_1.km)} km, perché i comuni si trovano ` +
    `lungo la stessa strada di fondovalle. Sono mostrate le prime ${SCENARIO_1.classifica.length}.`;

  // evidenzia tutti i giri lunghi quanto il migliore (possono essere più di uno)
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

/** La tabella con i km di strada tra ogni coppia di paesi. */
function disegnaMatriceDistanze() {
  const intestazione = NOMI_NODI.map((nome) => `<th class="num">${nome}</th>`);

  const righe = DATI.distanze.map((riga, i) => {
    // da un paese a se stesso la distanza è 0: si scrive un trattino
    const celle = riga.map(
      (km) => `<td class="num">${km ? formattaNumero(km) : "–"}</td>`,
    );
    return `<tr><td><strong>${NOMI_NODI[i]}</strong></td>${celle.join("")}</tr>`;
  });

  $("#matrix").innerHTML = `
    <thead><tr><th>Da / A</th>${intestazione.join("")}</tr></thead>
    <tbody>${righe.join("")}</tbody>`;
}

/** Scrive tutte e tre le tabelle. */
function disegnaTabelleStatiche() {
  disegnaTabellaScenario2();
  disegnaTabellaScenario1();
  disegnaMatriceDistanze();
}
