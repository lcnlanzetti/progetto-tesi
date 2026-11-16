/* ---------- modello di costo (stesso di confronto_economico.py) ---------- */
function giro(km, nClienti, tipo, p) {
  const v =
    tipo === "medio"
      ? {
          cons: p.consumo_medio,
          usura: p.usura_medio,
          fisso: p.fisso_medio,
        }
      : {
          cons: p.consumo_comp,
          usura: p.usura_comp,
          fisso: p.fisso_comp,
        };
  const ore =
    km / p.velocita + (nClienti * p.tempo_scarico + p.tempo_carico) / 60;
  const carburante = ((km * v.cons) / 100) * p.prezzo_gasolio;
  const altri = km * v.usura;
  const autista = ore * p.costo_orario;
  return {
    km,
    ore,
    fisso: v.fisso,
    carburante,
    altri,
    autista,
    totale: v.fisso + carburante + altri + autista,
  };
}
const S1 = DATI.scenario1;
const S2best = DATI.scenario2.ammissibili[0];
function valuta(p) {
  const a = giro(S1.km, S1.sequenza.length, "medio", p);
  a.durata = a.ore;
  const g = S2best.veicoli.map((v) =>
    giro(v.km, v.sequenza.length, "compatto", p),
  );
  const b = {};
  for (const k of [
    "km",
    "ore",
    "fisso",
    "carburante",
    "altri",
    "autista",
    "totale",
  ])
    b[k] = g[0][k] + g[1][k];
  b.durata = Math.max(g[0].ore, g[1].ore);
  return { s1: a, s2: b, giri2: g };
}
