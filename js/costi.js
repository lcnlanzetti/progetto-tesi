/* =============================================================
   I quattro riquadri con i numeri principali in cima alla pagina,
   la tabella dei costi di un giorno e le barre colorate che
   mostrano di cosa è fatto il costo.
   ============================================================= */

/** Le quattro voci di costo, con il colore usato per ognuna nelle barre. */
const VOCI_DI_COSTO = [
  { chiave: "fisso", etichetta: "Costi fissi veicoli", colore: "#7D8B6A" },
  { chiave: "carburante", etichetta: "Carburante", colore: "#C9A227" },
  { chiave: "altri", etichetta: "Usura e manutenzione", colore: "#9C7B5B" },
  { chiave: "autista", etichetta: "Autisti", colore: "#4F7A94" },
];

/** Differenze più piccole di questa (meno di mezzo centesimo) contano come zero. */
const TOLLERANZA_DIFFERENZA = 0.004;

/**
 * Il colore della colonna "Differenza":
 * "pos" se lo scenario 2 costa di più, "neg" se costa di meno, nessuno se sono pari.
 */
function classeDifferenza(differenza) {
  if (differenza > TOLLERANZA_DIFFERENZA) return "pos";
  if (differenza < -TOLLERANZA_DIFFERENZA) return "neg";
  return "";
}

/* ---------- tabella ---------- */

/** Una riga della tabella: nome della voce, valore nei due scenari e differenza. */
function htmlRigaTabella(etichetta, valore1, valore2, formatta) {
  const differenza = valore2 - valore1;
  return `
    <tr>
      <td>${etichetta}</td>
      <td class="num">${formatta(valore1)}</td>
      <td class="num">${formatta(valore2)}</td>
      <td class="num ${classeDifferenza(differenza)}">${conSegno(differenza, formatta)}</td>
    </tr>`;
}

/** La tabella "Costo giornaliero per voce". */
function disegnaTabellaCosti({ scenario1, scenario2 }) {
  const formattaKm = (v) => formattaNumero(v) + " km";

  const righeVoci = [
    htmlRigaTabella("Km percorsi", scenario1.km, scenario2.km, formattaKm),
    htmlRigaTabella(
      "Ore di lavoro autisti",
      scenario1.ore,
      scenario2.ore,
      formattaDurata,
    ),
    ...VOCI_DI_COSTO.map((voce) =>
      htmlRigaTabella(
        voce.etichetta,
        scenario1[voce.chiave],
        scenario2[voce.chiave],
        formattaEuro,
      ),
    ),
  ];

  // nella riga del totale si colora anche una differenza piccolissima
  const differenzaTotale = scenario2.totale - scenario1.totale;
  const rigaTotale = `
    <tr class="total">
      <td>Totale giornaliero</td>
      <td class="num">${formattaEuro(scenario1.totale)}</td>
      <td class="num">${formattaEuro(scenario2.totale)}</td>
      <td class="num ${differenzaTotale > 0 ? "pos" : "neg"}">${conSegno(differenzaTotale, formattaEuro)}</td>
    </tr>`;

  // la durata non è colorata: finire prima non è un costo
  const rigaDurata = `
    <tr>
      <td>Consegne completate dopo</td>
      <td class="num">${formattaDurata(scenario1.durata)}</td>
      <td class="num">${formattaDurata(scenario2.durata)}</td>
      <td class="num">${conSegno(scenario2.durata - scenario1.durata, formattaDurata)}</td>
    </tr>`;

  $("#cost-table").innerHTML = `
    <thead>
      <tr>
        <th>Voce</th>
        <th class="num">Scenario 1</th>
        <th class="num">Scenario 2</th>
        <th class="num">Differenza</th>
      </tr>
    </thead>
    <tbody>${righeVoci.join("")}${rigaTotale}${rigaDurata}</tbody>`;
}

/* ---------- barre ---------- */

/**
 * Una barra orizzontale divisa in pezzi colorati, uno per voce di costo.
 * "massimo" è l'importo che corrisponde alla barra piena.
 */
function htmlBarra(scenario, titolo, massimo) {
  const segmenti = VOCI_DI_COSTO.map((voce) => {
    const larghezza = (scenario[voce.chiave] / massimo) * 100;
    const descrizione = `${voce.etichetta}: ${formattaEuro(scenario[voce.chiave])}`;
    return `<div style="width:${larghezza}%;background:${voce.colore}" title="${descrizione}"></div>`;
  });
  return `
    <div class="bar-row">
      <div class="bar-label"><span>${titolo}</span><strong>${formattaEuro(scenario.totale)}</strong></div>
      <div class="bar">${segmenti.join("")}</div>
    </div>`;
}

/** Le due barre (una per scenario) e la legenda dei colori. */
function disegnaBarre({ scenario1, scenario2 }) {
  // la barra più lunga arriva a circa il 96%, così resta un po' di spazio
  const massimo = Math.max(scenario1.totale, scenario2.totale) * 1.04;

  $("#bars").innerHTML =
    htmlBarra(scenario1, "Scenario 1 · un veicolo", massimo) +
    htmlBarra(scenario2, "Scenario 2 · due veicoli", massimo);

  $("#bar-legend").innerHTML = VOCI_DI_COSTO.map(
    (voce) => `<span><i style="background:${voce.colore}"></i>${voce.etichetta}</span>`,
  ).join("");
}

/* ---------- i quattro riquadri in cima ---------- */

/** Costo dei due scenari, differenza, e quale scenario conviene. */
function disegnaIndicatori({ scenario1, scenario2 }) {
  const differenza = scenario2.totale - scenario1.totale;
  const giorniAnno = PARAMETRI_DATI.giorni_anno;

  $("#k-s1").textContent = formattaEuro(scenario1.totale);
  $("#k-s1-sub").textContent =
    `${formattaNumero(scenario1.km)} km · consegne in ${formattaDurata(scenario1.durata)}`;

  $("#k-s2").textContent = formattaEuro(scenario2.totale);
  $("#k-s2-sub").textContent =
    `${formattaNumero(scenario2.km)} km · consegne in ${formattaDurata(scenario2.durata)}`;

  $("#k-diff").textContent = conSegno(differenza, formattaEuro);
  $("#k-diff-sub").textContent =
    `${conSegno(differenza * giorniAnno, formattaEuroIntero)} all'anno (${giorniAnno} giorni)`;

  // ultimo riquadro: quale scenario conviene (pari se la differenza è sotto il mezzo centesimo)
  if (Math.abs(differenza) < 0.005) {
    $("#k-verdict").textContent = "I due scenari si equivalgono";
    $("#k-verdict-sub").textContent = "Punto di pareggio raggiunto";
    return;
  }

  const convieneUnVeicolo = differenza > 0;
  $("#k-verdict").textContent = convieneUnVeicolo
    ? "Conviene un solo veicolo"
    : "Conviene usare due veicoli";

  const percentualeRisparmio =
    (Math.abs(differenza) / Math.max(scenario1.totale, scenario2.totale)) * 100;
  const anticipoDueVeicoli = Math.max(0, scenario1.durata - scenario2.durata);
  $("#k-verdict-sub").textContent =
    `Risparmio del ${formattaNumero(percentualeRisparmio)}% · ` +
    `i due furgoni finiscono ${formattaDurata(anticipoDueVeicoli)} prima`;
}
