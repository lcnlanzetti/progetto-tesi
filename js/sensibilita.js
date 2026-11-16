/* ---------- sensibilità ---------- */
const SENS = [
  "costo_orario",
  "prezzo_gasolio",
  "fisso_medio",
  "fisso_comp",
  "velocita",
  "tempo_carico",
];
function buildSens() {
  $("#sens-var").innerHTML = SENS.map(
    (k) =>
      `<option value="${k}">${CTRL[k].label}${k.startsWith("fisso") ? (k === "fisso_medio" ? " (furgone medio)" : " (furgone compatto)") : ""}</option>`,
  ).join("");
  $("#sens-var").addEventListener("change", update);
}
function pareggio(k) {
  // ricerca del valore in cui le due curve si incontrano (le curve sono lineari o monotone)
  const c = CTRL[k],
    N = 400;
  const f = (v) => {
    const r = valuta({ ...P, [k]: v });
    return r.s2.totale - r.s1.totale;
  };
  let prev = f(c.min);
  for (let i = 1; i <= N; i++) {
    const v = c.min + ((c.max - c.min) * i) / N,
      cur = f(v);
    if (Math.sign(cur) !== Math.sign(prev)) {
      let lo = v - (c.max - c.min) / N,
        hi = v;
      for (let j = 0; j < 40; j++) {
        const m = (lo + hi) / 2;
        if (Math.sign(f(m)) === Math.sign(f(lo))) lo = m;
        else hi = m;
      }
      return (lo + hi) / 2;
    }
    prev = cur;
  }
  return null;
}
function drawChart() {
  const k = $("#sens-var").value,
    c = CTRL[k];
  const svg = $("#chart"),
    w = 520,
    h = 320,
    m = { l: 62, r: 16, t: 16, b: 46 };
  const N = 60,
    xs = Array.from(
      { length: N + 1 },
      (_, i) => c.min + ((c.max - c.min) * i) / N,
    );
  const a = xs.map((v) => valuta({ ...P, [k]: v }).s1.totale),
    b = xs.map((v) => valuta({ ...P, [k]: v }).s2.totale);
  let lo = Math.min(...a, ...b),
    hi = Math.max(...a, ...b);
  const pad = (hi - lo) * 0.08 || 5;
  lo = Math.max(0, lo - pad);
  hi += pad;
  const X = (v) =>
    m.l + ((v - c.min) / (c.max - c.min)) * (w - m.l - m.r);
  const Y = (v) => h - m.b - ((v - lo) / (hi - lo)) * (h - m.t - m.b);
  const line = (arr) =>
    arr
      .map(
        (v, i) =>
          `${i ? "L" : "M"}${X(xs[i]).toFixed(1)},${Y(v).toFixed(1)}`,
      )
      .join("");
  let g = "";
  for (let i = 0; i <= 4; i++) {
    const v = lo + ((hi - lo) * i) / 4;
    g += `<line class="grid" x1="${m.l}" x2="${w - m.r}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${m.l - 8}" y="${Y(v) + 4}" text-anchor="end">${fmtNum(v, 0)} €</text>`;
  }
  for (let i = 0; i <= 4; i++) {
    const v = c.min + ((c.max - c.min) * i) / 4;
    g += `<text x="${X(v)}" y="${h - m.b + 18}" text-anchor="${i === 0 ? "start" : i === 4 ? "end" : "middle"}">${c.f(v)}</text>`;
  }
  g += `<text x="${(m.l + w - m.r) / 2}" y="${h - 8}" text-anchor="middle">${c.label}</text>`;
  const be = pareggio(k);
  if (be !== null) {
    const yv = valuta({ ...P, [k]: be }).s1.totale;
    g += `<line x1="${X(be)}" x2="${X(be)}" y1="${m.t}" y2="${h - m.b}" stroke="var(--muted)" stroke-dasharray="4 4"/>
    <circle cx="${X(be)}" cy="${Y(yv)}" r="4.5" fill="var(--text)"/>
    <text x="${X(be) > w - 170 ? X(be) - 6 : X(be) + 6}" y="${m.t + 12}" text-anchor="${X(be) > w - 170 ? "end" : "start"}" fill="var(--text)" style="font-weight:600">pareggio ${c.f(be)}</text>`;
  }
  g += `<path d="${line(a)}" fill="none" stroke="var(--accent)" stroke-width="2.5"/>`;
  g += `<path d="${line(b)}" fill="none" stroke="var(--v2)" stroke-width="2.5" stroke-dasharray="7 4"/>`;
  const cur = P[k],
    r = valuta(P);
  g += `<line x1="${X(cur)}" x2="${X(cur)}" y1="${m.t}" y2="${h - m.b}" stroke="var(--border)"/>`;
  g += `<circle cx="${X(cur)}" cy="${Y(r.s1.totale)}" r="4" fill="var(--accent)"/><circle cx="${X(cur)}" cy="${Y(r.s2.totale)}" r="4" fill="var(--v2)"/>`;
  g += `<g transform="translate(${m.l + 10},${m.t + 6})"><rect width="150" height="40" rx="6" fill="var(--surface)" stroke="var(--border)"/>
  <line x1="10" x2="30" y1="14" y2="14" stroke="var(--accent)" stroke-width="2.5"/><text x="36" y="18" fill="var(--text)">Scenario 1</text>
  <line x1="10" x2="30" y1="29" y2="29" stroke="var(--v2)" stroke-width="2.5" stroke-dasharray="7 4"/><text x="36" y="33" fill="var(--text)">Scenario 2</text></g>`;
  svg.innerHTML = g;
  const d = r.s2.totale - r.s1.totale;
  if (be === null) {
    $("#sens-note").textContent =
      `In tutto l'intervallo lo scenario ${d > 0 ? "1 (un veicolo)" : "2 (due veicoli)"} resta il più economico: questa voce da sola non cambia la scelta.`;
  } else {
    const sopra = valuta({
      ...P,
      [k]: Math.min(c.max, be + (c.max - c.min) / 50),
    });
    const chi =
      sopra.s2.totale < sopra.s1.totale
        ? "convengono i due veicoli"
        : "conviene il veicolo unico";
    $("#sens-note").textContent =
      `Le curve si incrociano a ${c.f(be)}: oltre questo valore ${chi}. Valore attuale: ${c.f(cur)}.`;
  }
}
