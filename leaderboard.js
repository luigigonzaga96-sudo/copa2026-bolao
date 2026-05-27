import { UNITS } from "./units.js";
import { $, RI, RC } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

export function renderLB() { renderLBG(); renderLBU(); }

export function renderLBG() {
  const el = $("lb-g"); if (!el) return;
  if (!state.USERS.length) { el.innerHTML = `<div style="color:var(--muted);text-align:center;padding:36px">${getTranslation("lb_empty")}</div>`; return; }
  const s = [...state.USERS].sort((a, b) => (b.pts || 0) - (a.pts || 0));
  el.innerHTML = s.map((u, i) => {
    const me = state.ME && u.uid === state.ME.uid; const u2 = UNITS[u.unit];
    const youText = getTranslation("user_you").toLowerCase();
    return `<div class="leaderboard__row${me ? " leaderboard__row--me" : ""}"><div class="leaderboard__rank ${RC(i)}">${RI(i)}</div><div class="leaderboard__avatar">${u.emoji || "⚽"}</div><div class="leaderboard__info"><div class="leaderboard__name">${u.name}${me ? ` <span style="color:var(--gold);font-size:.68rem">(${youText})</span>` : ""}</div>${u2 ? `<div class="leaderboard__unit-tag" style="background:${u2.bg};color:${u2.text}">${u2.label}</div>` : ""}</div><div style="text-align:right"><div class="leaderboard__points">${u.pts || 0}</div><div class="leaderboard__points-label">${getTranslation("pts_label")}</div></div></div>`;
  }).join("");
}

export function renderLBU() {
  const el = $("lb-u"); if (!el) return;
  const map = {};
  for (const u of state.USERS) { const k = u.unit || "?"; if (!map[k]) map[k] = { total: 0, count: 0 }; map[k].total += (u.pts || 0); map[k].count++; }
  const arr = Object.entries(map).map(([k, v]) => ({ k, u: UNITS[k], avg: v.count ? v.total / v.count : 0, total: v.total, count: v.count })).sort((a, b) => b.avg - a.avg);
  if (!arr.length) { el.innerHTML = `<div style="color:var(--muted);padding:18px;text-align:center">${getTranslation("lb_units_empty")}</div>`; return; }
  const mx = arr[0].avg || 1;
  el.innerHTML = arr.map((x, i) => {
    const bw = Math.round((x.avg / mx) * 100);
    const personWord = x.count === 1 ? getTranslation("lb_person") : getTranslation("lb_people");
    return `<div class="leaderboard__row" style="border-left:3px solid ${x.u?.color || "#888"}"><div class="leaderboard__rank ${RC(i)}">${RI(i)}</div><div style="flex:1"><div style="font-weight:700;font-size:.88rem;margin-bottom:4px">${x.u?.label || x.k} <span style="font-size:.65rem;color:var(--muted)">${x.count} ${personWord}</span></div><div class="leaderboard__bar-bg"><div class="leaderboard__bar" style="width:${bw}%;background:${x.u?.color || "#888"}"></div></div></div><div style="text-align:right;margin-left:11px"><div class="leaderboard__points" style="font-size:1.3rem">${Math.round(x.avg)}</div><div class="leaderboard__points-label">${getTranslation("lb_avg")}</div><div style="font-size:.6rem;color:var(--muted);margin-top:1px">${x.total} ${getTranslation("lb_total_pts")}</div></div></div>`;
  }).join("");
}

window.showUR = function (k, btn) {
  document.querySelectorAll(".utb").forEach(b => b.classList.remove("is-active")); if (btn) btn.classList.add("is-active");
  const el = $("lb-ul"), t = $("lb-ut"), u = UNITS[k];
  if (t) t.textContent = `${getTranslation("lb_unit_rank_title")}${u?.label || k}`;
  const pl = [...state.USERS].filter(x => x.unit === k).sort((a, b) => (b.pts || 0) - (a.pts || 0));
  if (!pl.length) { el.innerHTML = `<div style="color:var(--muted);padding:18px">${getTranslation("lb_unit_empty")}</div>`; return; }
  el.innerHTML = pl.map((u2, i) => {
    const me = state.ME && u2.uid === state.ME.uid;
    const youText = getTranslation("user_you").toLowerCase();
    return `<div class="leaderboard__row${me ? " leaderboard__row--me" : ""}"><div class="leaderboard__rank ${RC(i)}">${RI(i)}</div><div class="leaderboard__avatar">${u2.emoji || "⚽"}</div><div class="leaderboard__info"><div class="leaderboard__name">${u2.name}${me ? ` <span style="color:var(--gold);font-size:.68rem">(${youText})</span>` : ""}</div></div><div style="text-align:right"><div class="leaderboard__points">${u2.pts || 0}</div><div class="leaderboard__points-label">${getTranslation("pts_label")}</div></div></div>`;
  }).join("");
};

export function renderUnitFilters() {
  const container = $("uts-container");
  if (!container) return;
  const sorted = Object.entries(UNITS).sort((a, b) => a[1].label.localeCompare(b[1].label));
  container.innerHTML = sorted.map(([k, u]) => {
    const txt = u.color === "#c8c8c8" ? "#111" : "#fff";
    return `<button class="unit-filters__btn" style="--unit-color:${u.color};--unit-text:${txt}" onclick="showUR('${k}',this)">${u.label}</button>`;
  }).join("");
}
