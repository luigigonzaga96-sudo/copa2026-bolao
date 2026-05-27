import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, onAuthStateChanged, updateProfile, signOut } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, getDocs, collection, onSnapshot, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import { MX } from "./matches.js";
import { $ } from "./helpers.js";
import { state } from "./state.js";
import { initAuth, isAdm } from "./auth.js";
import { fetchAPI } from "./api.js";
import { renderLB, renderUnitFilters } from "./leaderboard.js";
import { initPalpites, renderMatches } from "./palpites.js";
import { initTournament, renderTorneio, renderGrupos } from "./tournament.js";
import { initAdmin, renderAR, renderAL, renderAS, loadMM } from "./admin.js";
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
window.__modules = { MX };

// Initialize modules that need db
initAuth(auth, db);
initPalpites(db);
initTournament(db);
initAdmin(db);

// ── Firestore Listeners ───────────────────────────────────────────────────────
let unsubResults = null, unsubUsers = null;

function startListeners() {
  if (unsubResults) unsubResults();
  if (unsubUsers) unsubUsers();

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
}

function stopListeners() {
  if (unsubResults) { unsubResults(); unsubResults = null; }
  if (unsubUsers) { unsubUsers(); unsubUsers = null; }
  state.RES = {};
  state.USERS = [];
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
  document.querySelectorAll("#nav .nav__btn").forEach(b => b.classList.remove("is-active"));
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
    const btn = document.querySelector(`#nav .nav__btn--${cls}`);
    if (btn) btn.classList.add("is-active");
  }
  
  const inDropdown = ["conta", "duvidas", "historico", "admin"].includes(name);
  if (inDropdown) {
    const moreBtn = document.getElementById("nav-more-btn");
    if (moreBtn) moreBtn.classList.add("is-active");
  }

  if (name === "jogos") renderMatches();
  if (name === "conta") renderConta();
  if (name === "admin" && state.ME && isAdm(state.ME.email)) { renderAR(); renderAL(); renderAS(); loadMM(); }
  if (name === "historico") renderHistorico();
};
window.UH = UH;

// ── Init ──────────────────────────────────────────────────────────────────────
applyTranslations();
renderUnitFilters();
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
