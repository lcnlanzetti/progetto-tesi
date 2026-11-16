/* =============================================================
   Questo file avvia la pagina: è l'ultimo a essere caricato.

   La pagina carica i file in quest'ordine, e ognuno può usare
   quello che hanno preparato i precedenti:
     utilita.js     scrivere numeri, euro e orari
     parametri.js   i costi e l'elenco dei cursori
     modello.js     il calcolo dei costi dei due scenari
     controlli.js   il riquadro con i cursori
     grafo.js       il disegno con i giri dei furgoni
     costi.js       riquadri in cima, tabella dei costi e barre
     sensibilita.js il grafico "Sensibilità"
     tabelle.js     le tabelle in fondo alla pagina
     main.js        questo file
   ============================================================= */

/** Rifà i calcoli e aggiorna tutte le parti della pagina che dipendono dai cursori. */
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

/**
 * Colori chiari o scuri: all'inizio si usano quelli scelti sul computer
 * dell'utente, poi il pulsante con la luna in alto a destra li alterna.
 */
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

// avvio della pagina
inizializzaTema();
creaControlli();
creaSelettoreSensibilita();
collegaPulsantiVista();
disegnaTabelleStatiche();
disegnaGrafo();
aggiorna();
