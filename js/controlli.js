/* =============================================================
   Il riquadro "Parametri di costo": crea i cursori e fa in modo
   che, quando se ne sposta uno, la pagina ricalcoli tutto.
   ============================================================= */

/** Il codice HTML di un cursore: titolo, valore attuale, barra e fonte. */

function htmlControllo(controllo) {
  const id = `c-${controllo.chiave}`;
  const fonte = controllo.fonte
    ? `<span class="src">${controllo.fonte}</span>`
    : "";
  return `
    <div class="ctrl">
      <label for="${id}">${controllo.etichetta}</label>
      <output id="o-${controllo.chiave}" for="${id}"></output>
      <input type="range" id="${id}"
             min="${controllo.min}" max="${controllo.max}" step="${controllo.passo}"
             value="${parametriCorrenti[controllo.chiave]}">
      ${fonte}
    </div>`;
}

/** Il codice HTML di un gruppo di cursori, con il suo titolo. */
function htmlGruppoControlli(gruppo) {
  return `
    <div>
      <p class="group-title">${gruppo.titolo}</p>
      ${gruppo.controlli.map(htmlControllo).join("")}
    </div>`;
}

/** Pulsante "Valori iniziali": riporta tutti i cursori ai valori di partenza. */
function ripristinaValoriIniziali() {
  parametriCorrenti = { ...VALORI_INIZIALI };
  for (const controllo of TUTTI_I_CONTROLLI) {
    $(`#c-${controllo.chiave}`).value = parametriCorrenti[controllo.chiave];
  }
  aggiorna();
}

/** Mette i cursori nella pagina e li collega ai calcoli. */
function creaControlli() {
  $("#controls").innerHTML = GRUPPI_DI_CONTROLLI.map(htmlGruppoControlli).join(
    "",
  );

  // quando si sposta un cursore: salva il nuovo valore e ricalcola la pagina
  for (const controllo of TUTTI_I_CONTROLLI) {
    $(`#c-${controllo.chiave}`).addEventListener("input", (evento) => {
      parametriCorrenti[controllo.chiave] = parseFloat(evento.target.value);
      aggiorna();
    });
  }

  $("#reset").addEventListener("click", ripristinaValoriIniziali);
}
