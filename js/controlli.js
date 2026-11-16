  /* ---------- controlli ---------- */
  function buildControls() {
    const box = $("#controls");
    box.innerHTML = CONTROLLI.map(
      (g) => `
<div><p class="group-title">${g.gruppo}</p>
${g.items
  .map(
    (c) => `
  <div class="ctrl">
    <label for="c-${c.k}">${c.label}</label>
    <output id="o-${c.k}" for="c-${c.k}"></output>
    <input type="range" id="c-${c.k}" min="${c.min}" max="${c.max}" step="${c.step}" value="${P[c.k]}">
    ${c.src ? `<span class="src">${c.src}</span>` : ""}
  </div>`,
  )
  .join("")}
</div>`,
    ).join("");
    for (const c of Object.values(CTRL)) {
      $(`#c-${c.k}`).addEventListener("input", (e) => {
        P[c.k] = parseFloat(e.target.value);
        update();
      });
    }
    $("#reset").addEventListener("click", () => {
      P = { ...DEF };
      for (const c of Object.values(CTRL)) $(`#c-${c.k}`).value = P[c.k];
      update();
    });
  }
