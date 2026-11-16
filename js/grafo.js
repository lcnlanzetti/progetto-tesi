    /* ---------- grafo ---------- */
    let view = "s1";
    const W = 560,
      H = 600,
      PAD = 64;
    const pos = (() => {
      const lat0 = 46.18,
        cos = Math.cos((lat0 * Math.PI) / 180);
      const xs = DATI.nodi.map((n) => n.lon * cos),
        ys = DATI.nodi.map((n) => n.lat);
      const minX = Math.min(...xs),
        maxX = Math.max(...xs),
        minY = Math.min(...ys),
        maxY = Math.max(...ys);
      // scala verticale reale; la scala orizzontale può allargarsi fino a 1,8 volte per leggibilità
      const sy = (H - 2 * PAD) / (maxY - minY);
      const sx = Math.min((W - 2 * PAD) / (maxX - minX), sy * 1.8);
      const offX = (W - (maxX - minX) * sx) / 2,
        offY = (H - (maxY - minY) * sy) / 2;
      return DATI.nodi.map((n, i) => ({
        x: offX + (xs[i] - minX) * sx,
        y: offY + (maxY - ys[i]) * sy,
      }));
    })();
    // posizione delle etichette per evitare sovrapposizioni
    const LABEL = {
      0: [-16, 4, "end"],
      1: [6, 26, "start"],
      2: [-16, 4, "end"],
      3: [-14, -16, "end"],
      4: [-14, -24, "end"],
      5: [16, 4, "start"],
    };
    // posizione del numero di tappa rispetto al nodo
    const BADGE = {
      1: [12, -12],
      2: [13, -11],
      3: [13, -13],
      4: [13, 13],
      5: [-13, -13],
    };

    function routePath(seq, offset = 0) {
      const pts = [0, ...seq, 0].map((i) => pos[i]);
      let d = "";
      for (let i = 0; i < pts.length - 1; i++) {
        const a = pts[i],
          b = pts[i + 1];
        const dx = b.x - a.x,
          dy = b.y - a.y,
          L = Math.hypot(dx, dy);
        const nx = (-dy / L) * offset,
          ny = (dx / L) * offset;
        const r = 16; // non entrare nei cerchi
        const ax = a.x + (dx / L) * r + nx,
          ay = a.y + (dy / L) * r + ny;
        const bx = b.x - (dx / L) * r + nx,
          by = b.y - (dy / L) * r + ny;
        d += `M${ax.toFixed(1)},${ay.toFixed(1)} L${bx.toFixed(1)},${by.toFixed(1)} `;
      }
      return d;
    }
    function drawGraph() {
      const svg = $("#graph");
      const E = DATI.distanze;
      let html = `<defs>
  <marker id="arr-s1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--accent)"/></marker>
  <marker id="arr-v1" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--v1)"/></marker>
  <marker id="arr-v2" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" fill="var(--v2)"/></marker>
</defs>`;
      // archi
      for (let i = 0; i < 6; i++)
        for (let j = i + 1; j < 6; j++) {
          const a = pos[i],
            b = pos[j];
          html += `<line class="edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" opacity="${view === "all" ? 1 : 0.45}"/>`;
          if (view === "all") {
            const mx = (a.x + b.x) / 2,
              my = (a.y + b.y) / 2;
            html += `<text class="edge-label" x="${mx}" y="${my}" text-anchor="middle" dy="4">${fmtNum(E[i][j])}</text>`;
          }
        }
      // percorsi
      const drawRoute = (seq, color, marker, offset) => {
        html += `<path class="route" d="${routePath(seq, offset)}" stroke="${color}" marker-end="url(#${marker})"/>`;
      };
      if (view === "s1") drawRoute(S1.sequenza, "var(--accent)", "arr-s1", 0);
      if (view === "s2") {
        drawRoute(S2best.veicoli[0].sequenza, "var(--v1)", "arr-v1", 0);
        drawRoute(S2best.veicoli[1].sequenza, "var(--v2)", "arr-v2", 0);
      }
      // numeri di tappa
      const steps = [];
      if (view === "s1")
        S1.sequenza.forEach((c, k) =>
          steps.push([c, k + 1, "var(--accent)"]),
        );
      if (view === "s2")
        S2best.veicoli.forEach((v, vi) =>
          v.sequenza.forEach((c, k) =>
            steps.push([c, k + 1, vi ? "var(--v2)" : "var(--v1)"]),
          ),
        );
      // nodi
      DATI.nodi.forEach((n, i) => {
        const p = pos[i],
          dep = i === 0;
        html += `<circle class="node-circle ${dep ? "node-depot" : ""}" cx="${p.x}" cy="${p.y}" r="${dep ? 11 : 9}"/>`;
        if (dep)
          html += `<rect x="${p.x - 4}" y="${p.y - 4}" width="8" height="8" fill="var(--surface)" rx="1"/>`;
        const [dx, dy, anchor] = LABEL[i];
        html += `<text class="node-name" x="${p.x + dx}" y="${p.y + dy}" text-anchor="${anchor}">${n.nome}</text>`;
        html += `<text class="node-kg" x="${p.x + dx}" y="${p.y + dy + 14}" text-anchor="${anchor}">${dep ? "deposito" : n.domanda + " kg"}</text>`;
      });
      for (const [c, k, col] of steps) {
        const p = pos[c];
        const [bx, by] = BADGE[c];
        html += `<circle cx="${p.x + bx}" cy="${p.y + by}" r="8" fill="${col}"/><text class="step" x="${p.x + bx}" y="${p.y + by + 3.5}" text-anchor="middle">${k}</text>`;
      }
      svg.innerHTML = html;

      // legenda e schede percorso
      const leg = $("#legend"),
        rt = $("#routes");
      if (view === "s1") {
        leg.innerHTML = `<span><i style="background:var(--accent)"></i>Veicolo unico, 300 kg</span><span>I numeri indicano l'ordine delle consegne</span>`;
        rt.innerHTML = routeCard(
          "Veicolo unico",
          S1.sequenza,
          S1.km,
          250,
          DATI.capacita.s1,
          "var(--accent)",
        );
      } else if (view === "s2") {
        leg.innerHTML = `<span><i style="background:var(--v1)"></i>Veicolo 1 · zona nord</span><span><i style="background:var(--v2)"></i>Veicolo 2 · zona sud</span>`;
        rt.innerHTML = S2best.veicoli
          .map((v, i) =>
            routeCard(
              `Veicolo ${i + 1}`,
              v.sequenza,
              v.km,
              v.kg,
              DATI.capacita.s2,
              i ? "var(--v2)" : "var(--v1)",
            ),
          )
          .join("");
      } else {
        leg.innerHTML = `<span><i style="background:var(--edge)"></i>15 archi del grafo completo, con la distanza stradale in km</span>`;
        rt.innerHTML = "";
      }
    }
    function routeCard(t, seq, km, kg, cap, col) {
      return `<div class="route-card" style="border-left-color:${col}">
  <div class="r-title"><span>${t}</span><span>${fmtNum(km)} km · ${kg}/${cap} kg</span></div>
  <div class="r-path">${percorso(seq)}</div></div>`;
    }
    document.querySelectorAll(".seg button").forEach((b) =>
      b.addEventListener("click", () => {
        view = b.dataset.view;
        document
          .querySelectorAll(".seg button")
          .forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        drawGraph();
      }),
    );
