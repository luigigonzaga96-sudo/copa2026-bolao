import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { $, TN, FL } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

let db;
export function initTournament(dbInstance) { db = dbInstance; }

export function calcGrupo(g) {
  const times = {};
  const jogos = state.MX.filter(m => m.g === g && !m.test);
  jogos.forEach(m => {
    [m.h, m.a].forEach(t => { if (!times[t]) times[t] = { t, j: 0, v: 0, e: 0, d: 0, gp: 0, gc: 0, sg: 0, pts: 0 }; });
  });
  jogos.forEach(m => {
    const r = state.RES[m.id]; if (!r || r.home === null) return;
    const h = times[m.h], a = times[m.a];
    h.j++; a.j++; h.gp += r.home; h.gc += r.away; a.gp += r.away; a.gc += r.home;
    h.sg = h.gp - h.gc; a.sg = a.gp - a.gc;
    if (r.home > r.away) { h.v++; h.pts += 3; a.d++; }
    else if (r.home < r.away) { a.v++; a.pts += 3; h.d++; }
    else { h.e++; a.e++; h.pts++; a.pts++; }
  });
  return Object.values(times).sort((a, b) => b.pts - a.pts || b.sg - a.sg || b.gp - a.gp);
}

export function renderGrupos() {
  const el = $("t-grupos"); if (!el) return;
  const grps = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L"];
  let html = '<div class="groups-grid">';
  grps.forEach(g => {
    const tab = calcGrupo(g);
    html += '<div class="card" style="padding:10px 8px"><div class="group-table__label">' + getTranslation("pred_group").toUpperCase() + g + '</div>';
    html += '<table class="group-table"><thead><tr><th>' + getTranslation("tournament_team") + '</th><th>J</th><th>V</th><th>E</th><th>D</th><th>GP</th><th>GC</th><th>SG</th><th>Pts</th></tr></thead><tbody>';
    tab.forEach((t, i) => {
      const cls = i < 2 ? 'style="color:#4ade80"' : i === 2 ? 'style="color:var(--gold)"' : '';
      const nm = TN(t.t), fl = FL(t.t);
      html += '<tr ' + cls + '><td>' + fl + ' ' + nm + '</td><td>' + t.j + '</td><td>' + t.v + '</td><td>' + t.e + '</td><td>' + t.d + '</td><td>' + t.gp + '</td><td>' + t.gc + '</td><td>' + (t.sg > 0 ? '+' : '') + t.sg + '</td><td style="font-weight:900">' + t.pts + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<div style="font-size:.55rem;color:var(--muted);margin-top:4px">' + getTranslation("tournament_legend") + '</div>';
    html += '</div>';
  });
  html += '</div>';
  el.innerHTML = html;
}

export function renderMM() {
  const el = $("t-matamata"); if (!el) return;
  getDoc(doc(db, "torneio", "matamata")).then(snap => {
    const mm = snap.exists() ? snap.data() : {};
    const fases = ["oitavas", "quartas", "semis", "final"];
    const slots = { "oitavas": 16, "quartas": 8, "semis": 4, "final": 2 };
    let html = "";
    fases.forEach(fase => {
      const jogos = mm[fase] || [];
      const total = slots[fase] / 2;
      const emoji = fase === "oitavas" ? "⚔️ " : fase === "quartas" ? "🏅 " : fase === "semis" ? "🥈 " : "🏆 ";
      const nomeFase = emoji + getTranslation(fase);
      html += '<div class="section-title" style="margin-top:20px">' + nomeFase + '</div>';
      html += '<div style="display:flex;flex-direction:column;gap:6px">';
      for (let i = 0; i < total; i++) {
        const jogo = jogos[i] || { h: "A definir", a: "A definir", gh: null, ga: null };
        const done = jogo.gh !== null && jogo.ga !== null;
        const sc = done ? jogo.gh + ' × ' + jogo.ga : '× ';
        const jh = jogo.h === "A definir" ? getTranslation("tournament_tbd") : jogo.h;
        const ja = jogo.a === "A definir" ? getTranslation("tournament_tbd") : jogo.a;
        html += '<div class="match-card">' +
          '<div class="match-card__team match-card__team--home">' + jh + '</div>' +
          '<div class="match-card__score" style="font-size:.9rem;min-width:50px">' + sc + '</div>' +
          '<div class="match-card__team match-card__team--away">' + ja + '</div>' +
          '<div class="match-card__info"><div class="mst ' + (done ? "done" : "") + '">' +
          (done ? getTranslation("pred_ended") : getTranslation("tournament_tbd")) + '</div></div></div>';
      }
      html += '</div>';
    });
    el.innerHTML = html;
  }).catch(() => { el.innerHTML = '<div style="color:var(--muted);padding:24px;text-align:center">' + getTranslation("tournament_not_available") + '</div>'; });
}

export function renderTorneio() {
  renderGrupos();
  $("t-grupos")?.classList.add("is-active");
  $("t-matamata")?.classList.remove("is-active");
  document.querySelectorAll("#tab-torneio .fcat")[0]?.classList.add("is-active");
  document.querySelectorAll("#tab-torneio .fcat")[1]?.classList.remove("is-active");
}

window.showTorneio = function (sec, btn) {
  document.querySelectorAll(".tournament-section").forEach(s => s.classList.remove("is-active"));
  document.querySelectorAll("#tab-torneio .fcat").forEach(b => b.classList.remove("is-active"));
  $("t-" + sec)?.classList.add("is-active");
  if (btn) btn.classList.add("is-active");
  if (sec === "grupos") renderGrupos();
  if (sec === "matamata") renderMM();
};
