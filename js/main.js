/* =============================================================
   Punto di ingresso: avvia la pagina.

   I file sono caricati in quest'ordine da template_pagina.html,
   e ognuno usa ciò che è definito nei precedenti:
     utilita.js     formattazione dei valori
     parametri.js   parametri correnti e definizione dei cursori
     modello.js     calcolo dei costi dei due scenari
     controlli.js   pannello dei cursori
     grafo.js       grafo con i percorsi
     costi.js       KPI, tabella dei costi e barre
     sensibilita.js grafico di sensibilità
     tabelle.js     tabelle statiche
     main.js        (questo file)
   ============================================================= */

/** Ricalcola e ridisegna tutto ciò che dipende dai cursori. */
function aggiorna() {
  for (const controllo of TUTTI_I_CONTROLLI) {
    $(`#o-${controllo.chiave}`).textContent = controllo.formatta(
      parametriCorrenti[controllo.chiave],
    );
  }
  const risultati = valutaScenari(parametriCorrenti);
  disegnaIndicatori(risultati);
  disegnaTabellaCosti(risultati);
  disegnaBarre(risultati);
  disegnaGraficoSensibilita();
}

/** Tema chiaro/scuro: parte da quello del sistema operativo, poi il pulsante lo alterna. */
function inizializzaTema() {
  const radice = document.documentElement;
  const preferisceScuro = matchMedia("(prefers-color-scheme: dark)").matches;
  let tema = preferisceScuro ? "dark" : "light";
  radice.setAttribute("data-theme", tema);

  $("#theme").addEventListener("click", () => {
    tema = tema === "dark" ? "light" : "dark";
    radice.setAttribute("data-theme", tema);
  });
}

inizializzaTema();
creaControlli();
creaSelettoreSensibilita();
collegaPulsantiVista();
disegnaTabelleStatiche();
disegnaGrafo();
aggiorna();
