import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { $, getEcosystemStyles } from "./helpers.js";
import { state, DEFAULT_MATCHES, UNITS } from "./state.js";
import { initAuth, isAdm } from "./auth.js";
import { fetchAPI } from "./api.js";
import { renderLB } from "./leaderboard.js";
import { initPalpites, renderMatches, renderPalpites } from "./palpites.js";
import { initTournament, renderTorneio, renderGrupos } from "./tournament.js";
import { initAdmin, renderAR, renderAL, renderAS, loadMM, renderAM, loadApiUrl, renderBusinessUnitsList } from "./admin.js";
import { UH, renderConta, renderLogin, SM, renderJanela, renderHistorico } from "./ui.js";
import { applyTranslations } from "./i18n.js";

// ── Firebase ──────────────────────────────────────────────────────────────────
const FB = {
  apiKey: "AIzaSyB_L5FN0Br845x2Wzv_hc0dG5LR4f38uKM",
  authDomain: "copa2026-bolao-d6e2a.firebaseapp.com",
  projectId: "copa2026-bolao-d6e2a",
  storageBucket: "copa2026-bolao-d6e2a.firebasestorage.app",
  messagingSenderId: "899241944443",
  appId: "1:899241944443:web:59316ebb6fe94552b389de"
};
const app = initializeApp(FB);
const auth = getAuth(app);
const db = getFirestore(app);

// Expose MX to ui.js (renderHistorico)
window.__modules = { MX: state.MX };

// Initialize modules that need db
initAuth(auth, db);
initPalpites(db);
initTournament(db);
initAdmin(db);

// ── Firestore Listeners ───────────────────────────────────────────────────────
let unsubResults = null, unsubUsers = null, unsubMatches = null, unsubBusinessUnits = null, unsubAdmins = null;

function startListeners() {
  if (unsubResults) unsubResults();
  if (unsubUsers) unsubUsers();
  if (unsubMatches) unsubMatches();
  if (unsubBusinessUnits) unsubBusinessUnits();
  if (unsubAdmins) unsubAdmins();

  if (state.ME) {
    unsubAdmins = onSnapshot(collection(db, "admins"), snap => {
      state.ADMINS = [];
      snap.forEach(d => {
        state.ADMINS.push(d.id.toLowerCase());
      });
      UH();
      if (isAdm(state.ME?.email)) {
        renderAL();
      }
    }, err => console.warn("Erro listener admins:", err));
  } else {
    state.ADMINS = [];
    UH();
  }

  unsubMatches = onSnapshot(collection(db, "matches"), snap => {
    const loadedMatches = [];
    snap.forEach(d => {
      const data = d.data();
      loadedMatches.push({
        id: Number(d.id),
        g: data.g || "",
        rod: data.rod || "",
        h: data.h || "",
        a: data.a || "",
        ko: data.ko || "",
        ...(data.test !== undefined ? { test: data.test } : {}),
        ...(data.round !== undefined ? { round: data.round } : {})
      });
    });

    if (loadedMatches.length === 0) {
      if (state.ME && isAdm(state.ME.email)) {
        console.log("A coleção 'matches' está vazia. Iniciando seed automático...");
        DEFAULT_MATCHES.forEach(async m => {
          const mData = {
            g: m.g || "",
            rod: m.rod || "",
            h: m.h || "",
            a: m.a || "",
            ko: m.ko || "",
          };
          if (m.test !== undefined) mData.test = m.test;
          if (m.round !== undefined) mData.round = m.round;
          try {
            await setDoc(doc(db, "matches", String(m.id)), mData);
          } catch (e) {
            console.error("Erro ao seedar jogo " + m.id, e);
          }
        });
      }
      return;
    }

    loadedMatches.sort((a, b) => a.id - b.id);
    state.MX.length = 0;
    state.MX.push(...loadedMatches);

    renderMatches();
    renderPalpites();
    renderLB();
    if (state.ME && isAdm(state.ME.email)) {
      renderAR();
      renderAS();
      renderAM();
    }
    if ($("t-grupos")?.classList.contains("tournament-section--active")) {
      renderGrupos();
    }
  }, err => console.warn("Erro listener matches:", err));

  unsubResults = onSnapshot(collection(db, "results"), snap => {
    state.RES = {};
    snap.forEach(d => { state.RES[d.id] = d.data(); });
    renderMatches();
    renderPalpites();
    renderLB();
    if (state.ME && isAdm(state.ME.email)) renderAR();
    if ($("t-grupos")?.classList.contains("tournament-section--active")) renderGrupos();
  }, err => console.warn("Erro listener results:", err));

  unsubUsers = onSnapshot(collection(db, "users"), snap => {
    state.USERS = [];
    snap.forEach(d => { state.USERS.push({ uid: d.id, ...d.data() }); });
    renderLB();
    if (state.ME && isAdm(state.ME.email)) renderAS();
  }, err => console.warn("Erro listener users:", err));

  unsubBusinessUnits = onSnapshot(collection(db, "businessUnits"), snap => {
    const loadedUnits = {};
    snap.forEach(d => {
      loadedUnits[d.id] = d.data();
    });

    // Coleção vazia: não faz nada (seed é feito via botão no painel admin)
    if (Object.keys(loadedUnits).length === 0) return;

    // Substitui UNITS mantendo a mesma referência de objeto (módulos já importaram)
    for (const key in UNITS) {
      delete UNITS[key];
    }
    for (const [id, bu] of Object.entries(loadedUnits)) {
      const styles = getEcosystemStyles(bu.ecossistema);
      UNITS[id] = {
        label: bu.nome,              // só o nome, sem repetir o ecossistema
        eco: bu.ecossistema,         // ecossistema separado para exibição contextual
        color: styles.color,
        bg: styles.bg,
        text: styles.text,
        cls: `unit-filters__btn--${id}`,
        nome: bu.nome,
        ecossistema: bu.ecossistema
      };
    }

    renderLB();
    renderConta();
    if (state.ME && isAdm(state.ME.email)) {
      renderAS();
      renderBusinessUnitsList();
    }
  }, err => console.warn("Erro listener businessUnits:", err));
}

function stopListeners() {
  if (unsubResults) { unsubResults(); unsubResults = null; }
  if (unsubUsers) { unsubUsers(); unsubUsers = null; }
  if (unsubMatches) { unsubMatches(); unsubMatches = null; }
  if (unsubBusinessUnits) { unsubBusinessUnits(); unsubBusinessUnits = null; }
  if (unsubAdmins) { unsubAdmins(); unsubAdmins = null; }
  state.RES = {};
  state.USERS = [];
  state.ADMINS = [];
  renderMatches();
  renderLB();
}

// ── Auth State ────────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async u => {
  state.ME = u;
  if (u) {
    const email = u.email ? u.email.toLowerCase() : "";
    const s = await getDoc(doc(db, "users", u.uid));
    
    state.MU = s.exists() ? (s.data().unit || "") : "";
    const sn = await getDocs(collection(db, "users", u.uid, "predictions"));
    state.PRD = {};
    sn.forEach(d => { state.PRD[d.id] = d.data(); });
    
    // Set initial user doc in Firestore (merging name/email/emoji, but NOT overwriting unit or pts)
    await setDoc(doc(db, "users", u.uid), {
      name: u.displayName || u.email,
      email: email,
      emoji: u.photoURL || "⚽"
    }, { merge: true });
  } else {
    state.MU = "";
    state.PRD = {};
  }
  startListeners();
  UH();
  renderConta();
  renderPalpites();
  if (state.ME) fetchAPI(db);
});

// ── Navigation ────────────────────────────────────────────────────────────────
window.GT = function (name) {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("tab--active"));
  document.querySelectorAll(".nav__btn, .bottom-nav__btn").forEach(b => b.classList.remove("is-active"));
  const tab = $("tab-" + name); if (tab) tab.classList.add("tab--active");
  
  const mapClass = {
    ranking: 'ranking',
    jogos: 'games',
    conta: 'account',
    duvidas: 'faq',
    historico: 'history',
    admin: 'admin'
  };
  const cls = mapClass[name];
  if (cls) {
    document.querySelectorAll(`.nav__btn--${cls}`).forEach(btn => btn.classList.add("is-active"));
  }
  
  const inDropdown = ["conta", "duvidas", "historico", "admin"].includes(name);
  const mobMenuBtn = document.getElementById("mobile-menu-btn");
  if (mobMenuBtn) mobMenuBtn.classList.remove("is-active");
  
  if (inDropdown) {
    const moreBtn = document.getElementById("nav-more-btn");
    if (moreBtn) moreBtn.classList.add("is-active");
    if (mobMenuBtn) mobMenuBtn.classList.add("is-active");
  }

  if (name === "jogos") renderMatches();
  if (name === "conta") renderConta();
  if (name === "admin" && state.ME && isAdm(state.ME.email)) {
    renderAR();
    renderAL();
    renderAS();
    loadMM();
    renderAM();
    loadApiUrl();
    renderBusinessUnitsList();
  }
  if (name === "historico") renderHistorico();
};

window.toggleMobileDrawer = function (open) {
  const drawer = document.getElementById("mobile-drawer");
  if (!drawer) return;
  if (open === undefined) {
    drawer.classList.toggle("is-open");
  } else if (open) {
    drawer.classList.add("is-open");
  } else {
    drawer.classList.remove("is-open");
  }
};

window.selectDrawerOption = function (name) {
  window.toggleMobileDrawer(false);
  window.GT(name);
};

window.UH = UH;

// ── Init ──────────────────────────────────────────────────────────────────────
applyTranslations();
renderMatches();
renderJanela();
setInterval(renderJanela, 60000);
const teParam = new URLSearchParams(location.search).get("convite");
if (teParam) window.GT("conta");

// ── Dropdown Toggle ──────────────────────────────────────────────────────────
const moreBtn = document.getElementById("nav-more-btn");
const moreDropdown = document.getElementById("nav-more-dropdown");
if (moreBtn && moreDropdown) {
  moreBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    moreDropdown.classList.toggle("is-open");
  });
  document.addEventListener("click", () => {
    moreDropdown.classList.remove("is-open");
  });
}

// ── Event Delegation Engine (OWASP CSP Compliant) ─────────────────────────────
document.body.addEventListener("click", (e) => {
  const target = e.target.closest("[data-onclick]");
  if (!target) return;
  
  const action = target.getAttribute("data-onclick");
  const argsStr = target.getAttribute("data-args");
  
  let args = [];
  if (argsStr) {
    try {
      args = JSON.parse(argsStr);
    } catch (err) {
      args = [argsStr];
    }
  }
  
  if (typeof window[action] === "function") {
    window[action](...args, target);
  } else {
    console.warn(`Action ${action} is not a function on window.`);
  }
});

document.body.addEventListener("change", (e) => {
  const target = e.target.closest("[data-onchange]");
  if (!target) return;
  
  const action = target.getAttribute("data-onchange");
  if (typeof window[action] === "function") {
    window[action](e.target.value, target);
  } else {
    console.warn(`Action ${action} is not a function on window.`);
  }
});

