import { UNITS } from "./units.js";
import { $, UB, pts, ptsRound, sgn, FL, TN } from "./helpers.js";
import { state } from "./state.js";
import { isAdm } from "./auth.js";
import { renderAR, renderAL, renderAS } from "./admin.js";

// HEADER
export function UH() {
  const el = $("us"), btn = $("nav-adm");
  const adm = state.ME && isAdm(state.ME.email);
  if (btn) { btn.style.display = adm ? "inline-block" : "none"; btn.classList.toggle("show", adm); }
  if (state.ME) {
    const p = pts(state.PRD, state.RES);
    const pill = adm ? `<span class="admin-pill">ADMIN</span>` : "";
    const ub = UB(state.MU);
    el.innerHTML = `<span class="user-tag" onclick="GT('conta')">${state.ME.photoURL || "⚽"} ${state.ME.displayName || "Você"}${pill}</span>${ub}<span class="points-tag">${p} pts</span>`;
    if (adm) { renderAR(); renderAL(); renderAS(); }
  } else { el.innerHTML = `<button class="btn btn--sm" onclick="GT('conta')">Entrar</button>`; }
}

// CONTA
export function renderConta() {
  const el = $("cc"); if (!el) return;
  if (state.ME) {
    if (!state.MU) {
      el.innerHTML = `<div class="section-title">👤 Completar Perfil</div><div class="card" style="max-width:460px"><div id="aa"></div><div class="alert alert--info" style="margin-bottom:12px;font-size:.76rem">🏆 Olá! Para começar a palpitar, selecione sua unidade e seu avatar.</div><div class="form-group"><label>Nome de exibição</label><input id="cp-name" type="text" placeholder="Seu nome" value="${state.ME.displayName || ""}"></div><div style="display:flex;gap:12px;margin-bottom:12px"><div class="form-group" style="flex:1;margin-bottom:0"><label>Unidade</label><select id="cp-unit"><option value="">Selecione sua unidade</option>${Object.entries(UNITS).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([k, u]) => `<option value="${k}">${u.label}</option>`).join("")}</select></div><div class="form-group" style="width:125px;margin-bottom:0"><label>Avatar (emoji)</label><select id="cp-emoji"><option>⚽</option><option>🏆</option><option>🎯</option><option>🔥</option><option>💪</option><option>🦁</option><option>🦅</option><option>🐉</option><option>⚡</option><option>🌟</option><option>🐺</option><option>🦊</option><option>🇧🇷</option><option>🇦🇷</option><option>🏴󠁧󠁢󠁥󠁮󠁧󠁿</option><option>🇫🇷</option></select></div></div><button class="btn" style="width:100%" onclick="doCompleteProfile()">Salvar e Começar 🚀</button><div style="text-align:center;margin-top:11px"><button class="btn--danger" style="width:100%" onclick="doLogout()">Cancelar / Sair</button></div></div>`;
      return;
    }
    const p = pts(state.PRD, state.RES), u = UNITS[state.MU];
    el.innerHTML = `<div class="section-title">👤 Meu Perfil</div><div class="card" style="max-width:460px"><div style="display:flex;align-items:center;gap:13px;margin-bottom:16px"><div class="leaderboard__avatar" style="width:52px;height:52px;font-size:1.7rem">${state.ME.photoURL || "⚽"}</div><div><div style="font-size:1.1rem;font-weight:700">${state.ME.displayName || "Você"}</div><div style="color:var(--muted);font-size:.76rem">${state.ME.email}</div>${u ? `<div style="margin-top:4px">${UB(state.MU)}</div>` : ""}</div><div style="margin-left:auto;text-align:right"><div class="leaderboard__points">${p}</div><div class="leaderboard__points-label">pontos</div></div></div><div class="divider"></div><div style="display:flex;gap:7px;flex-wrap:wrap;margin-top:13px"><button class="btn btn--outline btn--sm" onclick="showEditProfile()">✏️ Editar Perfil</button><button class="btn btn--outline btn--sm" onclick="GT('palpites')">🎯 Meus palpites</button><button class="btn--danger" onclick="doLogout()">Sair</button></div></div>`;
  } else { renderLogin(); }
}

window.showEditProfile = () => {
  const el = $("cc"); if (!el) return;
  const currentName = state.ME.displayName || "";
  const currentEmoji = state.ME.photoURL || "⚽";
  const currentUnit = state.MU || "";

  el.innerHTML = `<div class="section-title">👤 Editar Perfil</div><div class="card" style="max-width:460px"><div id="aa"></div><div class="form-group"><label>Nome de exibição</label><input id="cp-name" type="text" placeholder="Seu nome" value="${currentName}"></div><div style="display:flex;gap:12px;margin-bottom:12px"><div class="form-group" style="flex:1;margin-bottom:0"><label>Unidade</label><select id="cp-unit"><option value="">Selecione sua unidade</option>${Object.entries(UNITS).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([k, u]) => `<option value="${k}" ${currentUnit === k ? "selected" : ""}>${u.label}</option>`).join("")}</select></div><div class="form-group" style="width:125px;margin-bottom:0"><label>Avatar (emoji)</label><select id="cp-emoji">${["⚽", "🏆", "🎯", "🔥", "💪", "🦁", "🦅", "🐉", "⚡", "🌟", "🐺", "🦊", "🇧🇷", "🇦🇷", "🏴󠁧󠁢󠁥󠁮󠁧󠁿", "🇫🇷"].map(emoji => `<option ${currentEmoji === emoji ? "selected" : ""}>${emoji}</option>`).join("")}</select></div></div><button class="btn" style="width:100%" onclick="doCompleteProfile()">Salvar Alterações 🚀</button><div style="text-align:center;margin-top:11px"><button class="btn--danger" style="width:100%" onclick="renderConta()">Cancelar</button></div></div>`;
};

function getTE() {
  const p = new URLSearchParams(location.search).get("convite"); if (!p) return "";
  try { const pad = p.padEnd(p.length + (4 - p.length % 4) % 4, "="); const [e] = atob(pad).split("|"); return e || ""; } catch { return ""; }
}

export function renderLogin() {
  const te = getTE();
  $("cc").innerHTML = `<div class="section-title">Entrar no Bolão</div><div style="max-width:410px" id="aw"><div id="af"><div class="card"><div id="aa"></div><div class="form-group"><label>E-mail</label><input id="le" type="email" placeholder="seu@email.com"></div><div class="form-group"><label>Senha</label><input id="lp" type="password" placeholder="••••••"></div><button class="btn" style="width:100%" onclick="doLogin()">Entrar 🚀</button><div class="divider-text"><span>ou</span></div><button class="btn btn--microsoft" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="doSSOLogin()"><svg width="16" height="16" viewBox="0 0 23 23"><path fill="#f35325" d="M0 0h11v11H0z"/><path fill="#81bc06" d="M12 0h11v11H12z"/><path fill="#05a6f0" d="M0 12h11v11H0z"/><path fill="#ffba08" d="M12 12h11v11H12z"/></svg>Entrar com a Microsoft</button><div style="text-align:center;margin-top:11px"><a onclick="doReset()" style="color:var(--muted);font-size:.73rem;cursor:pointer;text-decoration:underline">Esqueci minha senha</a></div></div><div class="auth-toggle">Não tem conta? <a onclick="showReg()">Criar agora</a></div></div></div>`;
  if (te) window.showReg(te);
}

window.showReg = function (pre = "") {
  const te = pre || getTE();
  $("af").innerHTML = `<div class="card"><div id="aa"></div><div class="alert alert--info" style="margin-bottom:12px;font-size:.76rem">🏆 Bolão exclusivo para colaboradores Anytools.</div><div class="form-group"><label>Nome completo</label><input id="rn" type="text" placeholder="Seu nome"></div><div class="form-group"><label>E-mail</label><input id="re" type="email" placeholder="seu@email.com" value="${te}" ${te ? 'readonly style="opacity:.65"' : ""}>${te ? `<div style="font-size:.65rem;color:#4ade80;margin-top:3px">✅ E-mail confirmado pelo convite</div>` : ""}</div><div class="form-group"><label>Senha</label><input id="rp" type="password" placeholder="mínimo 6 caracteres"></div><div style="display:flex;gap:12px;margin-bottom:12px"><div class="form-group" style="flex:1;margin-bottom:0"><label>Unidade</label><select id="ru"><option value="">Selecione sua unidade</option>${Object.entries(UNITS).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([k, u]) => `<option value="${k}">${u.label}</option>`).join("")}</select></div><div class="form-group" style="width:125px;margin-bottom:0"><label>Avatar (emoji)</label><select id="rem"><option>⚽</option><option>🏆</option><option>🎯</option><option>🔥</option><option>💪</option><option>🦁</option><option>🦅</option><option>🐉</option><option>⚡</option><option>🌟</option><option>🐺</option><option>🦊</option><option>🇧🇷</option><option>🇦🇷</option><option>🏴󠁧󠁢󠁥󠁮󠁧󠁿</option><option>🇫🇷</option></select></div></div><button class="btn" style="width:100%" onclick="doReg()">Criar Conta 🎉</button><div class="divider-text"><span>ou</span></div><button class="btn btn--microsoft" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px;" onclick="doSSOLogin()"><svg width="16" height="16" viewBox="0 0 23 23"><path fill="#f35325" d="M0 0h11v11H0z"/><path fill="#81bc06" d="M12 0h11v11H12z"/><path fill="#05a6f0" d="M0 12h11v11H0z"/><path fill="#ffba08" d="M12 12h11v11H12z"/></svg>Entrar com a Microsoft</button><div style="font-size:.65rem;color:var(--muted);text-align:center;margin-top:10px;line-height:1.5">Dados usados exclusivamente para o bolão interno Anytools.</div></div><div class="auth-toggle">Já tem conta? <a onclick="renderLogin()">Entrar</a></div>`;
};
window.renderLogin = renderLogin;

// MODAL
export function SM(msg, onOk) {
  $("mm").innerHTML = msg; const ok = $("mok");
  if (onOk) { ok.style.display = "inline-block"; ok.onclick = () => { window.CM(); onOk(); }; }
  else ok.style.display = "none";
  $("modal").style.display = "flex";
}
window.CM = () => { $("modal").style.display = "none"; };
window.SM = SM;

// FAQ
window.SF = function (id, btn) {
  document.querySelectorAll(".fs").forEach(s => s.classList.remove("is-active"));
  document.querySelectorAll(".faq-categories__btn").forEach(b => b.classList.remove("is-active"));
  $("f" + id)?.classList.add("is-active"); btn.classList.add("is-active");
};
window.TF = function (el) {
  const a = el.nextElementSibling, op = a.style.display === "block";
  a.style.display = op ? "none" : "block"; el.querySelector(".fqi").textContent = op ? "+" : "−";
};

// JANELA DE PALPITES
export function renderJanela() {
  const el = document.getElementById("janela-banner"); if (!el) return;
  const now = new Date();
  const utcH = now.getUTCHours(), utcM = now.getUTCMinutes();
  const minUTC = utcH * 60 + utcM;
  const abre = 8 * 60, fecha = 15 * 60 + 30;
  const aberta = minUTC >= abre && minUTC < fecha;
  if (aberta) {
    el.innerHTML = '<div class="alert alert--success" style="display:flex;align-items:center;gap:10px;margin-bottom:0"><span style="font-size:1.1rem">🟢</span><div><strong>Janela de palpites ABERTA</strong> — até as 12:30h você pode palpitar e alterar livremente.<br><span style="font-size:.75rem;opacity:.8">💡 Dica: antecipe já os palpites da próxima rodada!</span></div></div>';
  } else {
    const proximaAbertura = minUTC >= fecha ? "amanhã às 05:00h" : "hoje às 05:00h";
    el.innerHTML = '<div class="alert alert--error" style="display:flex;align-items:center;gap:10px;margin-bottom:0"><span style="font-size:1.1rem">🔴</span><div><strong>Janela de palpites FECHADA</strong> — abre ' + proximaAbertura + '.<br><span style="font-size:.75rem;opacity:.8">Palpites são aceitos das 05:00h às 12:30h todos os dias.</span></div></div>';
  }
}

// HISTÓRICO
export function renderHistorico() {
  const el = $("hist-content"); if (!el) return;
  const { MX } = window.__modules;
  const testRounds = [...new Set(MX.filter(x => x.test).map(x => x.round))];
  let html = "";
  if (testRounds.length) {
    html += `<div class="section-title" style="color:#c49de8">🧪 Rodadas Teste — Não contam no ranking</div>`;
    for (const rnd of testRounds) {
      const games = MX.filter(x => x.round === rnd);
      html += `<div class="card" style="border-color:#6b3fa0;margin-bottom:14px"><div style="display:flex;align-items:center;gap:10px;margin-bottom:12px"><span style="font-family:'Unbounded',sans-serif;font-size:.75rem;font-weight:900;color:#c49de8">${rnd}</span><span class="admin-pill" style="background:#6b3fa0;font-size:.5rem">TESTE</span></div>`;
      html += `<div style="display:flex;flex-direction:column;gap:6px">`;
      for (const m of games) {
        const r = state.RES[m.id], done = r && r.home !== null;
        const pred = state.PRD[m.id];
        const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
        const sc = done ? `<strong style="color:var(--gold)">${r.home} × ${r.away}</strong>` : `<span style="color:var(--muted)">– × –</span>`;
        let badge = "";
        if (pred && done) {
          const st = pred.home === r.home && pred.away === r.away ? "e" : sgn(pred.home - pred.away) === sgn(r.home - r.away) ? "w" : "l";
          badge = st === "e" ? `<span class="bet-badge bet-badge--exact">🎯 +5</span>` : st === "w" ? `<span class="bet-badge bet-badge--win">✅ +3</span>` : `<span class="bet-badge bet-badge--loss">❌ 0</span>`;
        } else if (pred) { badge = `<span class="bet-badge bet-badge--pending">⏳ ${pred.home}×${pred.away}</span>`; }
        html += `<div style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:10px 13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:.83rem;font-weight:600;flex:1">${fh} ${nh} × ${na} ${fa}</span><span style="font-size:.8rem">${sc}</span>${badge}</div>`;
      }
      html += `</div>`;
      if (state.ME) {
        const rpts = ptsRound(state.PRD, rnd, state.RES);
        html += `<div style="margin-top:10px;text-align:right;font-size:.75rem;color:var(--muted)">Seus pontos nesta rodada: <strong style="color:#c49de8">${rpts} pts</strong> <span style="font-size:.62rem">(não somados ao ranking)</span></div>`;
      }
      html += `</div>`;
    }
  }
  const doneGames = MX.filter(x => !x.test && state.RES[x.id] && state.RES[x.id].home !== null);
  if (doneGames.length) {
    html += `<div class="section-title" style="margin-top:24px">⚽ Copa 2026 — Jogos Encerrados</div>`;
    html += `<div style="display:flex;flex-direction:column;gap:6px">`;
    for (const m of doneGames) {
      const r = state.RES[m.id];
      const pred = state.PRD[m.id];
      const fh = FL(m.h), fa = FL(m.a), nh = TN(m.h), na = TN(m.a);
      const sc = `<strong style="color:var(--gold)">${r.home} × ${r.away}</strong>`;
      let badge = "";
      if (pred) {
        const st = pred.home === r.home && pred.away === r.away ? "e" : sgn(pred.home - pred.away) === sgn(r.home - r.away) ? "w" : "l";
        badge = st === "e" ? `<span class="bet-badge bet-badge--exact">🎯 +5</span>` : st === "w" ? `<span class="bet-badge bet-badge--win">✅ +3</span>` : `<span class="bet-badge bet-badge--loss">❌ 0</span>`;
      } else { badge = `<span class="bet-badge" style="background:#1a1a1a;color:var(--muted)">Sem palpite</span>`; }
      html += `<div style="background:var(--card2);border:1px solid var(--border);border-radius:7px;padding:10px 13px;display:flex;align-items:center;gap:10px;flex-wrap:wrap"><span style="font-size:.83rem;font-weight:600;flex:1">${fh} ${nh} × ${na} ${fa}</span><span style="font-size:.7rem;color:var(--muted)">${m.d} · Gr.${m.g}</span><span style="font-size:.8rem">${sc}</span>${badge}</div>`;
    }
    html += `</div>`;
  }
  if (!testRounds.length && !doneGames.length) {
    html = `<div style="color:var(--muted);text-align:center;padding:36px">Nenhum jogo encerrado ainda.</div>`;
  }
  el.innerHTML = html;
}
