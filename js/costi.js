  /* ---------- tabella costi e barre ---------- */
  const VOCI = [
    ["fisso", "Costi fissi veicoli", "#7D8B6A"],
    ["carburante", "Carburante", "#C9A227"],
    ["altri", "Usura e manutenzione", "#9C7B5B"],
    ["autista", "Autisti", "#4F7A94"],
  ];
  function drawCosts(r) {
    const { s1, s2 } = r;
    const rows = [
      [
        "Km percorsi",
        s1.km,
        s2.km,
        (v) => fmtNum(v) + " km",
        (v) => signed(v, (x) => fmtNum(x) + " km"),
      ],
      [
        "Ore di lavoro autisti",
        s1.ore,
        s2.ore,
        hhmm,
        (v) => signed(v, hhmm),
      ],
      ...VOCI.map(([k, l]) => [
        l,
        s1[k],
        s2[k],
        fmtEur,
        (v) => signed(v, fmtEur),
      ]),
    ];
    const d = s2.totale - s1.totale;
    $("#cost-table").innerHTML =
      `<thead><tr><th>Voce</th><th class="num">Scenario 1</th><th class="num">Scenario 2</th><th class="num">Differenza</th></tr></thead><tbody>
${rows
  .map(([l, a, b, f, fd]) => {
    const x = b - a;
    return `<tr><td>${l}</td><td class="num">${f(a)}</td><td class="num">${f(b)}</td><td class="num ${x > 0.004 ? "pos" : x < -0.004 ? "neg" : ""}">${fd(x)}</td></tr>`;
  })
  .join("")}
<tr class="total"><td>Totale giornaliero</td><td class="num">${fmtEur(s1.totale)}</td><td class="num">${fmtEur(s2.totale)}</td><td class="num ${d > 0 ? "pos" : "neg"}">${signed(d, fmtEur)}</td></tr>
<tr><td>Consegne completate dopo</td><td class="num">${hhmm(s1.durata)}</td><td class="num">${hhmm(s2.durata)}</td><td class="num">${signed(s2.durata - s1.durata, hhmm)}</td></tr>
</tbody>`;
    const max = Math.max(s1.totale, s2.totale) * 1.04;
    const bar = (
      s,
      t,
    ) => `<div class="bar-row"><div class="bar-label"><span>${t}</span><strong>${fmtEur(s.totale)}</strong></div>
<div class="bar">${VOCI.map(([k, l, c]) => `<div style="width:${(s[k] / max) * 100}%;background:${c}" title="${l}: ${fmtEur(s[k])}"></div>`).join("")}</div></div>`;
    $("#bars").innerHTML =
      bar(s1, "Scenario 1 · un veicolo") +
      bar(s2, "Scenario 2 · due veicoli");
    $("#bar-legend").innerHTML = VOCI.map(
      ([, l, c]) => `<span><i style="background:${c}"></i>${l}</span>`,
    ).join("");
  }

  /* ---------- KPI ---------- */
  function drawKpis(r) {
    const { s1, s2 } = r,
      d = s2.totale - s1.totale,
      g = P0.giorni_anno;
    $("#k-s1").textContent = fmtEur(s1.totale);
    $("#k-s1-sub").textContent =
      `${fmtNum(s1.km)} km · consegne in ${hhmm(s1.durata)}`;
    $("#k-s2").textContent = fmtEur(s2.totale);
    $("#k-s2-sub").textContent =
      `${fmtNum(s2.km)} km · consegne in ${hhmm(s2.durata)}`;
    $("#k-diff").textContent = signed(d, fmtEur);
    $("#k-diff-sub").textContent =
      `${signed(d * g, fmtEur0)} all'anno (${g} giorni)`;
    if (Math.abs(d) < 0.005) {
      $("#k-verdict").textContent = "I due scenari si equivalgono";
      $("#k-verdict-sub").textContent = "Punto di pareggio raggiunto";
    } else {
      const one = d > 0;
      $("#k-verdict").textContent = one
        ? "Conviene un solo veicolo"
        : "Conviene usare due veicoli";
      const risp = (Math.abs(d) / Math.max(s1.totale, s2.totale)) * 100;
      $("#k-verdict-sub").textContent =
        `Risparmio del ${fmtNum(risp)}% · i due furgoni finiscono ${hhmm(Math.max(0, s1.durata - s2.durata))} prima`;
    }
  }
