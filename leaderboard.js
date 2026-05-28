import { UNITS } from "./state.js";
import { $, RI, RC, fmtName } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

export function renderLB() { renderLBG(); renderLBU(); }

// ── Ranking Geral ─────────────────────────────────────────────────────────────
export function renderLBG() {
  const el = $("lb-g"); if (!el) return;
  if (!state.USERS.length) {
    el.innerHTML = `<div style="color:var(--muted);text-align:center;padding:36px">${getTranslation("lb_empty")}</div>`;
    return;
  }
  const s = [...state.USERS].sort((a, b) => (b.pts || 0) - (a.pts || 0));
  el.innerHTML = s.map((u, i) => {
    const me = state.ME && u.uid === state.ME.uid;
    const u2 = UNITS[u.unit];
    const youText = getTranslation("user_you").toLowerCase();
    return `<div class="leaderboard__row${me ? " leaderboard__row--me" : ""}">
      <div class="leaderboard__rank ${RC(i)}">${RI(i)}</div>
      <div class="leaderboard__avatar">${u.emoji || "⚽"}</div>
      <div class="leaderboard__info">
        <div class="leaderboard__name" title="${u.name}">${fmtName(u.name)}${me ? ` <span style="color:var(--gold);font-size:.68rem">(${youText})</span>` : ""}</div>
        ${u2 ? `<div class="leaderboard__unit-tag" style="background:${u2.bg};color:${u2.text}">${u2.label}</div>` : ""}
      </div>
      <div class="leaderboard__points-col">
        <div class="leaderboard__points">${u.pts || 0}</div>
        <div class="leaderboard__points-label">${getTranslation("pts_label")}</div>
      </div>
    </div>`;
  }).join("");
}

// ── Ranking por Unidade (Sanfona / Accordion) ─────────────────────────────────
export function renderLBU() {
  const el = $("lb-u"); if (!el) return;

  // Agrupa usuários por unidade
  const map = {};
  for (const u of state.USERS) {
    const k = u.unit || "?";
    if (!map[k]) map[k] = { total: 0, count: 0, users: [] };
    map[k].total += (u.pts || 0);
    map[k].count++;
    map[k].users.push(u);
  }

  const arr = Object.entries(map)
    .map(([k, v]) => ({
      k,
      u: UNITS[k],
      avg: v.count ? v.total / v.count : 0,
      total: v.total,
      count: v.count,
      users: v.users.sort((a, b) => (b.pts || 0) - (a.pts || 0)),
    }))
    .sort((a, b) => b.avg - a.avg);

  if (!arr.length) {
    el.innerHTML = `<div style="color:var(--muted);padding:18px;text-align:center">${getTranslation("lb_units_empty")}</div>`;
    return;
  }

  const mx = arr[0].avg || 1;

  el.innerHTML = arr.map((x, i) => {
    const bw = Math.round((x.avg / mx) * 100);
    const personWord = x.count === 1 ? getTranslation("lb_person") : getTranslation("lb_people");
    const accordionId = `lbu-acc-${i}`;

    const ecoTag = x.u?.eco
      ? `<span style="font-size:.55rem;font-weight:700;letter-spacing:.03em;color:${x.u.text};background:${x.u.bg};border:1px solid ${x.u.color}33;padding:1px 6px;border-radius:3px;margin-left:6px;vertical-align:middle;white-space:nowrap">${x.u.eco}</span>`
      : "";

    // Colaboradores desta unidade (renderizados mas ocultos inicialmente)
    const membersHtml = x.users.map((u2, j) => {
      const me = state.ME && u2.uid === state.ME.uid;
      const youText = getTranslation("user_you").toLowerCase();
      return `<div class="leaderboard__row leaderboard__row--member${me ? " leaderboard__row--me" : ""}">
        <div class="leaderboard__rank ${RC(j)}">${RI(j)}</div>
        <div class="leaderboard__avatar" style="font-size:1rem">${u2.emoji || "⚽"}</div>
        <div class="leaderboard__info">
          <div class="leaderboard__name" title="${u2.name}" style="font-size:.82rem">${fmtName(u2.name)}${me ? ` <span style="color:var(--gold);font-size:.65rem">(${youText})</span>` : ""}</div>
        </div>
        <div class="leaderboard__points-col">
          <div class="leaderboard__points" style="font-size:1rem">${u2.pts || 0}</div>
          <div class="leaderboard__points-label">${getTranslation("pts_label")}</div>
        </div>
      </div>`;
    }).join("");

    return `<div class="leaderboard__unit-accordion" style="border-left:3px solid ${x.u?.color || "#888"};border-radius:6px;margin-bottom:2px;overflow:hidden">
      <button class="leaderboard__row leaderboard__unit-header" style="width:100%;background:none;border:none;cursor:pointer;text-align:left;padding:0"
        onclick="toggleUnitAccordion('${accordionId}')" aria-expanded="false" aria-controls="${accordionId}">
        <div class="leaderboard__rank ${RC(i)}">${RI(i)}</div>
        <div class="leaderboard__info" style="flex:1">
          <div style="font-weight:700;font-size:.88rem;margin-bottom:3px;display:flex;align-items:center;flex-wrap:wrap;gap:2px">
            ${x.u?.label || x.k}${ecoTag}
          </div>
          <div style="font-size:.65rem;color:var(--muted);margin-bottom:4px">${x.count} ${personWord}</div>
          <div class="leaderboard__bar-bg">
            <div class="leaderboard__bar" style="width:${bw}%;background:${x.u?.color || "#888"}"></div>
          </div>
        </div>
        <div class="leaderboard__points-col">
          <div class="leaderboard__points" style="font-size:1.3rem">${Math.round(x.avg)}</div>
          <div class="leaderboard__points-label">${getTranslation("lb_avg")}</div>
          <div style="font-size:.6rem;color:var(--muted);margin-top:1px">${x.total} ${getTranslation("lb_total_pts")}</div>
        </div>
        <div class="leaderboard__accordion-arrow" style="font-size:.75rem;color:var(--muted);margin-left:8px;transition:transform .25s">▼</div>
      </button>
      <div id="${accordionId}" class="leaderboard__members" style="display:none;padding:0 4px 4px">
        ${membersHtml}
      </div>
    </div>`;
  }).join("");
}

// ── Toggle de Sanfona ─────────────────────────────────────────────────────────
window.toggleUnitAccordion = function (id) {
  const panel = document.getElementById(id);
  const btn = panel?.previousElementSibling;
  if (!panel || !btn) return;

  const isOpen = panel.style.display !== "none";
  panel.style.display = isOpen ? "none" : "block";
  btn.setAttribute("aria-expanded", String(!isOpen));

  const arrow = btn.querySelector(".leaderboard__accordion-arrow");
  if (arrow) arrow.style.transform = isOpen ? "" : "rotate(180deg)";
};
