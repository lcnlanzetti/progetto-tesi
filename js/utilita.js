/* ---------- utilità ---------- */
const $ = (s) => document.querySelector(s);
const nomi = DATI.nodi.map((n) => n.nome);
const fmtEur = (x) =>
  x.toLocaleString("it-IT", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 2,
  });
const fmtEur0 = (x) =>
  Math.round(x)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ".") + " €";
const fmtNum = (x, d = 1) =>
  x.toLocaleString("it-IT", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  });
const signed = (x, f) =>
  (x > 0 ? "+" : x < 0 ? "−" : "") + f(Math.abs(x));
function hhmm(ore) {
  let h = Math.floor(ore),
    m = Math.round((ore - h) * 60);
  if (m === 60) {
    h++;
    m = 0;
  }
  return h ? `${h}h ${String(m).padStart(2, "0")}min` : `${m} min`;
}
const percorso = (seq) => [0, ...seq, 0].map((i) => nomi[i]).join(" → ");
