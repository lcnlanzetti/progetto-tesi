  /* ---------- tabelle statiche ---------- */
  function drawStatic() {
    const s2 = DATI.scenario2;
    $("#s2-summary").textContent =
      `${s2.suddivisioni} suddivisioni esaminate, ${s2.scartate} scartate perché superano i ${DATI.capacita.s2} kg su un veicolo, ${s2.ammissibili.length} ammissibili.`;
    $("#s2-table").innerHTML =
      `<thead><tr><th>#</th><th>Veicolo 1</th><th>Veicolo 2</th><th class="num">Km</th></tr></thead><tbody>
${s2.ammissibili
  .map(
    (s, i) => `<tr class="${i === 0 ? "best" : ""}"><td>${i + 1}</td>
  ${s.veicoli.map((v) => `<td>${v.sequenza.map((c) => nomi[c]).join(", ")}<br><span class="hint">${fmtNum(v.km)} km · ${v.kg} kg</span></td>`).join("")}
  <td class="num"><strong>${fmtNum(s.km)}</strong></td></tr>`,
  )
  .join("")}</tbody>`;
    const nMin = S1.n_ottime;
    $("#s1-summary").textContent =
      `${S1.esaminate} sequenze esaminate: ${nMin} raggiungono lo stesso minimo di ${fmtNum(S1.km)} km, perché i comuni si trovano lungo la stessa strada di fondovalle. Sono mostrate le prime ${S1.classifica.length}.`;
    $("#s1-table").innerHTML =
      `<thead><tr><th>#</th><th>Sequenza di consegna</th><th class="num">Km</th></tr></thead><tbody>
${S1.classifica.map((s, i) => `<tr class="${s.km === S1.km ? "best" : ""}"><td>${i + 1}</td><td>${s.sequenza.map((c) => nomi[c]).join(" → ")}</td><td class="num">${fmtNum(s.km)}</td></tr>`).join("")}</tbody>`;
    const E = DATI.distanze;
    $("#matrix").innerHTML =
      `<thead><tr><th>Da / A</th>${nomi.map((n) => `<th class="num">${n}</th>`).join("")}</tr></thead><tbody>
${E.map((r, i) => `<tr><td><strong>${nomi[i]}</strong></td>${r.map((v) => `<td class="num">${v ? fmtNum(v) : "–"}</td>`).join("")}</tr>`).join("")}</tbody>`;
  }
