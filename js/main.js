/* ---------- aggiornamento ---------- */
function update() {
  for (const c of Object.values(CTRL))
    $(`#o-${c.k}`).textContent = c.f(P[c.k]);
  const r = valuta(P);
  drawKpis(r);
  drawCosts(r);
  drawChart();
}

/* ---------- tema ---------- */
(() => {
  const root = document.documentElement;
  let theme = matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  root.setAttribute("data-theme", theme);
  $("#theme").addEventListener("click", () => {
    theme = theme === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", theme);
  });
})();

buildControls();
buildSens();
drawStatic();
drawGraph();
update();
