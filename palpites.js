import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { $, FL, TN, isOpen, lockLbl, pSt, pts, fmtDT, parseKoDate } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

let db;
let currentFilter = "todos";

export function initPalpites(dbInstance) {
  db = dbInstance;
  initTouchTooltip();
}

function initTouchTooltip() {
  // Cria o elemento de tooltip uma única vez
  const tip = document.createElement('div');
  tip.className = 'tooltip-popup';
  tip.id = 'touch-tooltip';
  document.body.appendChild(tip);

  let hideTimer = null;

  function showTip(text, x, y) {
    clearTimeout(hideTimer);
    tip.textContent = text;
    // Posiciona acima do ponto de toque/hover (centralizado)
    tip.style.left = Math.max(8, x - 60) + 'px';
    tip.style.top = (y - 42) + 'px';
    tip.classList.add('is-visible');
  }

  function hideTip(delay = 0) {
    clearTimeout(hideTimer);
    if (delay) {
      hideTimer = setTimeout(() => tip.classList.remove('is-visible'), delay);
    } else {
      tip.classList.remove('is-visible');
    }
  }

  // Touch (mobile)
  document.addEventListener('touchstart', (e) => {
    const el = e.target.closest('.match-card__name');
    if (el && el.title) {
      const touch = e.touches[0];
      showTip(el.title, touch.clientX, touch.clientY);
      hideTip(2500);
    } else {
      hideTip();
    }
  }, { passive: true });

  // Hover (desktop)
  document.addEventListener('mouseover', (e) => {
    const el = e.target.closest('.match-card__name');
    if (el && el.title) {
      const rect = el.getBoundingClientRect();
      showTip(el.title, rect.left + rect.width / 2, rect.top);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.match-card__name')) {
      hideTip();
    }
  });
}

export function cardUnifiedMatch(m) {
  const r = state.RES[m.id];
  const done = r && r.home !== null;
  const live = r?.live;
  const pred = state.PRD[m.id];
  const st = pSt(m.id, state.PRD, state.RES);
  const op = isOpen(m);
  const lk = lockLbl(m);
  const fh = FL(m.h);
  const fa = FL(m.a);
  const nh = TN(m.h);
  const na = TN(m.a);

  // Status Badge
  let statusBadge = "";
  if (live) {
    statusBadge = '<span style="color:var(--red);font-weight:700;display:flex;align-items:center;gap:4px"><span class="live-dot"></span>' + getTranslation("pred_live") + '</span>';
  } else if (done) {
    statusBadge = '<span style="color:var(--muted)">' + getTranslation("pred_ended") + '</span>';
  } else if (!op) {
    statusBadge = '<span style="color:var(--red)">' + getTranslation("pred_closed") + '</span>';
  } else if (lk) {
    statusBadge = '<span style="color:var(--gold);font-size:0.7rem">' + lk + '</span>';
  }

  // Official Score (shown if started)
  const hs = done ? r.home : "–";
  const as = done ? r.away : "–";
  const scoreHtml = `<span class="match-card__score">${hs} × ${as}</span>`;

  // Prediction HTML Block
  let predHtml = "";
  if (done) {
    const userPred = pred 
      ? `<strong>${pred.home} × ${pred.away}</strong>` 
      : `<span style="color:var(--muted)">${getTranslation("pred_none") || "Sem palpite"}</span>`;
    predHtml = `<div style="font-size:0.8rem;color:var(--muted)">` + 
      `${getTranslation("pred_your_label") || "Seu palpite: "}${userPred}` + 
      `</div>`;
  } else if (!state.ME) {
    if (op) {
      predHtml = `<div style="font-size:0.75rem;color:var(--muted)">🔒 <a data-onclick="GT" data-args='["conta"]' style="color:var(--gold);cursor:pointer;text-decoration:underline">${getTranslation("pred_login_link")}</a>${getTranslation("pred_login_text")}</div>`;
    } else {
      predHtml = `<div style="font-size:0.75rem;color:var(--red);font-weight:600">${getTranslation("pred_closed")}</div>`;
    }
  } else if (op) {
    const pv = pred ? pred.home : "";
    const pa2 = pred ? pred.away : "";
    const btnText = pred ? getTranslation("btn_update") : getTranslation("btn_save");
    predHtml = `<div class="score-input-row">` + 
      `${getTranslation("pred_label")} ` + 
      `<input class="score-input" type="number" min="0" max="20" id="ph${m.id}" value="${pv}" placeholder="0"> ` + 
      `<span style="color:var(--muted)">×</span> ` + 
      `<input class="score-input" type="number" min="0" max="20" id="pa${m.id}" value="${pa2}" placeholder="0"> ` + 
      `<button class="btn btn--sm" data-onclick="SP" data-args='[${m.id}]'>${btnText}</button>` + 
      `</div>`;
  } else {
    const userPred = pred 
      ? `<strong>${pred.home} × ${pred.away}</strong>` 
      : `<span style="color:var(--muted)">${getTranslation("pred_none") || "Sem palpite"}</span>`;
    predHtml = `<div style="font-size:0.75rem;color:var(--red);font-weight:600">${getTranslation("pred_closed")}</div>` + 
      `<div style="font-size:0.75rem;color:var(--muted);margin-top:2px">${getTranslation("pred_your_label") || "Seu palpite: "}${userPred}</div>`;
  }

  // Points Badge
  let pointsBadge = "";
  if (done && pred) {
    if (st === "e") {
      pointsBadge = `<span class="bet-badge bet-badge--exact">+5 pts</span>`;
    } else if (st === "w") {
      pointsBadge = `<span class="bet-badge bet-badge--win">+3 pts</span>`;
    } else if (st === "l") {
      pointsBadge = `<span class="bet-badge bet-badge--loss">0 pts</span>`;
    }
  }

  const groupLabel = m.test ? "TESTE" : `Grupo ${m.g}`;
  const roundLabel = m.test ? m.round : (m.rod === "R1" ? getTranslation("pred_r1") : m.rod === "R2" ? getTranslation("pred_r2") : getTranslation("pred_r3"));

  return `
    <div class="match-card--unified">
      <div class="match-card__header">
        <span class="match-card__tag">${groupLabel} · ${roundLabel}</span>
        <span class="match-card__status">${statusBadge}</span>
      </div>
      <div class="match-card__main">
        <div class="match-card__team match-card__team--home">
          <span class="match-card__name" title="${nh}">${nh}</span>
          <span class="match-card__flag">${fh}</span>
        </div>
        <div class="match-card__vs">
          ${scoreHtml}
        </div>
        <div class="match-card__team match-card__team--away">
          <span class="match-card__flag">${fa}</span>
          <span class="match-card__name" title="${na}">${na}</span>
        </div>
      </div>
      <div class="match-card__prediction">
        ${predHtml}
      </div>
      <div class="match-card__footer">
        <span class="match-card__meta">${fmtDT(m.ko).d} · ${fmtDT(m.ko).t}</span>
        <span class="match-card__points">${pointsBadge}</span>
      </div>
    </div>
  `;
}

export function renderUnifiedMatches(filter = "todos") {
  const el = $("ml"); if (!el) return;
  
  let list = [...state.MX];
  if (filter === "teste") {
    list = list.filter(m => m.test).sort((a, b) => parseKoDate(a.ko) - parseKoDate(b.ko));
  } else {
    list = list.filter(m => !m.test);
    if (filter !== "todos") {
      list = list.filter(m => m.rod === filter);
    }
    list.sort((a, b) => parseKoDate(a.ko) - parseKoDate(b.ko));
  }

  let html = "";
  if (state.ME) {
    const p = pts(state.PRD, state.RES);
    html += '<div class="alert alert--info alert--full-width" style="margin-bottom:16px">' + getTranslation("pred_your_pts") + '<strong style="color:var(--gold);font-size:1rem"> ' + p + ' pts</strong>' + getTranslation("pred_your_pts_end") + '</div>';
  } else {
    html += '<div class="alert alert--info alert--full-width" style="margin-bottom:16px">' + getTranslation("pred_not_logged") + '<a data-onclick="GT" data-args=\'["conta"]\' style="color:var(--gold);cursor:pointer;text-decoration:underline">' + getTranslation("pred_login_account_link") + '</a>' + getTranslation("pred_not_logged_text") + '</div>';
  }

  if (list.length === 0) {
    html += '<div style="text-align:center;padding:24px;color:var(--muted)">Nenhum jogo encontrado para este filtro.</div>';
  } else {
    list.forEach(m => {
      html += cardUnifiedMatch(m);
    });
  }

  el.innerHTML = html;
}

// Backward compatible aliases
export function renderMatches() {
  renderUnifiedMatches(currentFilter);
}

export function renderPalpites() {
  renderUnifiedMatches(currentFilter);
}

// Global Filter Action
window.filterUnifiedMatches = function (filter, btn) {
  currentFilter = filter;
  document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("is-active"));
  if (btn) btn.classList.add("is-active");
  renderUnifiedMatches(filter);
};

// Save Prediction Action
window.SP = async (mid) => {
  if (!state.ME) { alert(getTranslation("alert_need_login")); return; }
  const m = state.MX.find(x => x.id === mid); if (m && !isOpen(m)) { alert(getTranslation("alert_pred_closed")); return; }
  const h = parseInt($(`ph${mid}`)?.value), a = parseInt($(`pa${mid}`)?.value);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { alert(getTranslation("alert_invalid_score")); return; }
  
  const btn = document.querySelector(`button[data-onclick="SP"][data-args='[${mid}]']`);
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  
  try {
    await setDoc(doc(db, "users", state.ME.uid, "predictions", String(mid)), { home: h, away: a });
    state.PRD[mid] = { home: h, away: a };
    const p = pts(state.PRD, state.RES);
    await setDoc(doc(db, "users", state.ME.uid), { pts: p }, { merge: true });
    window.UH();
    renderUnifiedMatches(currentFilter);
  } catch (err) {
    if (err.code === "permission-denied") {
      alert(getTranslation("alert_pred_closed") || "Palpite encerrado no servidor! Tempo limite esgotado.");
    } else {
      alert(getTranslation("alert_error_save") + err.message);
    }
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};
