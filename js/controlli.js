/* =============================================================
   Pannello "Parametri di costo": crea i cursori e li collega
   a parametriCorrenti.
   ============================================================= */

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

function htmlGruppoControlli(gruppo) {
  return `
    <div>
      <p class="group-title">${gruppo.titolo}</p>
      ${gruppo.controlli.map(htmlControllo).join("")}
    </div>`;
}

/** Riporta tutti i cursori ai valori iniziali. */
function ripristinaValoriIniziali() {
  parametriCorrenti = { ...VALORI_INIZIALI };
  for (const controllo of TUTTI_I_CONTROLLI) {
    $(`#c-${controllo.chiave}`).value = parametriCorrenti[controllo.chiave];
  }
  aggiorna();
}

function creaControlli() {
  $("#controls").innerHTML = GRUPPI_DI_CONTROLLI.map(htmlGruppoControlli).join(
    "",
  );

  // ogni spostamento di un cursore aggiorna il parametro e ricalcola la pagina
  for (const controllo of TUTTI_I_CONTROLLI) {
    $(`#c-${controllo.chiave}`).addEventListener("input", (evento) => {
      parametriCorrenti[controllo.chiave] = parseFloat(evento.target.value);
      aggiorna();
    });
  }

  $("#reset").addEventListener("click", ripristinaValoriIniziali);
}
