import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { MX } from "./matches.js";
import { $, FL, TN, isOpen, lockLbl, pSt, pts } from "./helpers.js";
import { state } from "./state.js";

let db;
export function initPalpites(dbInstance) { db = dbInstance; }

export function renderMatches() {
  const el = $("ml"); if (!el) return;
  const sorted = [...MX].filter(m => !m.test).sort((a, b) => {
    if (a.g < b.g) return -1; if (a.g > b.g) return 1;
    if (a.rod < b.rod) return -1; if (a.rod > b.rod) return 1;
    return 0;
  });
  let html = "", lastG = "";
  sorted.forEach(m => {
    if (m.g !== lastG) {
      if (lastG !== "") html += "</div>";
      html += '<div class="section-title" style="margin-top:18px">Grupo ' + m.g + '</div><div style="display:flex;flex-direction:column;gap:5px">';
      lastG = m.g;
    }
    const r = state.RES[m.id], done = r && r.home !== null, live = r?.live;
    const hs = done ? r.home : "–", as = done ? r.away : "–";
    const st = pSt(m.id, state.PRD, state.RES), pred = state.PRD[m.id];
    const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
    let badge = "";
    if (pred) {
      if (st === "e") badge = '<span class="bet-badge bet-badge--exact">🎯 Placar exato</span>';
      else if (st === "w") badge = '<span class="bet-badge bet-badge--win">✅ Acertou</span>';
      else if (st === "l") badge = '<span class="bet-badge bet-badge--loss">❌ Errou</span>';
      else badge = '<span class="bet-badge bet-badge--pending">⏳ ' + pred.home + '×' + pred.away + '</span>';
    }
    const rodLabel = m.rod === "R1" ? "Rodada 1" : m.rod === "R2" ? "Rodada 2" : "Rodada 3";
    html += '<div class="match-card">' +
      '<div class="match-card__team match-card__team--home"><span class="match-card__flag">' + fh + '</span> ' + nh + '</div>' +
      '<div class="match-card__score">' + (live ? '<span class="live-dot"></span>' : '') + hs + ' × ' + as + '</div>' +
      '<div class="match-card__team match-card__team--away">' + na + ' <span class="match-card__flag">' + fa + '</span></div>' +
      '<div class="match-card__info">' +
      '<div class="mst ' + (done && !live ? "done" : live ? "live" : "") + '">' + (live ? "🔴 AO VIVO" : done ? "✅ Encerrado" : rodLabel) + '</div>' +
      '<div>' + badge + '</div>' +
      '</div></div>';
  });
  if (lastG !== "") html += "</div>";
  el.innerHTML = html;
}

export function cardPalpite(m) {
  const r = state.RES[m.id], done = r && r.home !== null, pred = state.PRD[m.id], st = pSt(m.id, state.PRD, state.RES);
  const op = isOpen(m), lk = lockLbl(m);
  const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
  let badge = "";
  if (pred) {
    if (st === "e") badge = '<span class="bet-badge bet-badge--exact">🎯 +5 pts!</span>';
    else if (st === "w") badge = '<span class="bet-badge bet-badge--win">✅ +3 pts</span>';
    else if (st === "l") badge = '<span class="bet-badge bet-badge--loss">❌ 0 pts</span>';
    else badge = '<span class="bet-badge bet-badge--pending">⏳ Aguardando</span>';
  }
  let inp = "";
  if (done) {
    inp = '<div style="font-size:.78rem;color:var(--muted)">Resultado: <strong style="color:var(--text)">' + r.home + ' × ' + r.away + '</strong></div>';
  } else if (op) {
    const pv = pred ? pred.home : "", pa2 = pred ? pred.away : "";
    const btn = pred ? "✏️ Atualizar" : "💾 Salvar";
    const lks = lk ? '<span style="font-size:.65rem;color:var(--gold)">' + lk + '</span>' : "";
    inp = '<div class="score-input-row">Palpite: <input class="score-input" type="number" min="0" max="20" id="ph' + m.id + '" value="' + pv + '" placeholder="0"> <span style="color:var(--muted)">×</span> <input class="score-input" type="number" min="0" max="20" id="pa' + m.id + '" value="' + pa2 + '" placeholder="0"> <button class="btn btn--sm" onclick="SP(' + m.id + ')">' + btn + '</button>' + lks + '</div>';
  } else {
    const pp = pred ? '<div style="font-size:.7rem;color:var(--muted);margin-top:2px">Seu palpite: <strong>' + pred.home + ' × ' + pred.away + '</strong></div>' : "";
    inp = '<div style="font-size:.75rem;color:var(--red);font-weight:600">🔒 Palpite encerrado</div>' + pp;
  }
  const testBorder = m.test ? ";border-color:#6b3fa0" : "";
  const testBadge = m.test ? '<span class="admin-pill" style="background:#6b3fa0;font-size:.48rem;margin-left:5px">TESTE</span>' : "";
  return '<div class="card" style="padding:13px' + testBorder + '">' +
    '<div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:5px;margin-bottom:8px">' +
    '<div style="font-weight:700">' + fh + ' ' + nh + ' <span style="color:var(--muted)">×</span> ' + na + ' ' + fa + testBadge + '</div>' +
    '<div style="font-size:.7rem;color:var(--muted)">' + m.d + ' · ' + m.t + ' · ' + m.v + '</div></div>' +
    inp + '<div style="margin-top:6px">' + badge + '</div></div>';
}

export function renderPalpites() {
  const el = $("pc"); if (!el) return;
  if (!state.ME) { el.innerHTML = '<div class="alert alert--info">Entra na tua conta pra fazer palpites! <a onclick="GT(\'conta\')" style="color:var(--gold);cursor:pointer">→ Entrar</a></div>'; return; }
  const p = pts(state.PRD, state.RES);
  const mxTest = [...MX].filter(m => m.test).sort((a, b) => new Date(a.ko) - new Date(b.ko));
  const mxCopa = [...MX].filter(m => !m.test).sort((a, b) => new Date(a.ko) - new Date(b.ko));
  let html = '<div class="alert alert--info" style="margin-bottom:16px">Seus pontos: <strong style="color:var(--gold);font-size:1rem">' + p + ' pts</strong> — bora chutar! ⚽</div>';
  if (mxTest.length) {
    html += '<div class="section-title" style="color:#c49de8;margin-bottom:10px">🧪 Rodadas Teste <span style="font-size:.6rem;color:var(--muted);font-family:Inter,sans-serif;font-weight:400;text-transform:none;letter-spacing:0">— não contam no ranking geral</span></div>';
    html += '<div style="display:flex;flex-direction:column;gap:9px;margin-bottom:20px">';
    mxTest.forEach(m => { html += cardPalpite(m); });
    html += '</div>';
  }
  html += '<div class="section-title" style="margin-bottom:10px">⚽ Copa 2026</div>';
  html += '<div style="display:flex;flex-direction:column;gap:9px">';
  mxCopa.forEach(m => { html += cardPalpite(m); });
  html += '</div>';
  el.innerHTML = html;
}

window.SP = async (mid) => {
  const m = MX.find(x => x.id === mid); if (m && !isOpen(m)) { alert("⏱ Palpite encerrado!"); return; }
  const h = parseInt($(`ph${mid}`)?.value), a = parseInt($(`pa${mid}`)?.value);
  if (isNaN(h) || isNaN(a) || h < 0 || a < 0) { alert("Placar inválido!"); return; }
  const btn = document.querySelector(`button[onclick="SP(${mid})"]`);
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    await setDoc(doc(db, "users", state.ME.uid, "predictions", String(mid)), { home: h, away: a });
    state.PRD[mid] = { home: h, away: a };
    const p = pts(state.PRD, state.RES);
    await setDoc(doc(db, "users", state.ME.uid), { pts: p }, { merge: true });
    window.UH();
    renderPalpites();
  } catch (err) {
    alert("Erro ao salvar palpite: " + err.message);
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

