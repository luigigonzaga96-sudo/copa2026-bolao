import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { ADMINS } from "./admins.js";
import { UNITS } from "./units.js";
import { $ } from "./helpers.js";
import { state } from "./state.js";

let auth, db;

export function initAuth(authInstance, dbInstance) {
  auth = authInstance;
  db = dbInstance;
}

export const isAdm = e => ADMINS.includes((e || "").toLowerCase());

function SA(msg, cls = "") {
  const el = $("aa");
  if (!el) return;
  el.innerHTML = msg ? `<div class="alert ${cls}">${msg}</div>` : "";
}

window.doLogin = async () => {
  const e = $("le")?.value.trim(), p = $("lp")?.value;
  SA("", "");
  if (!e || !p) { SA("Preencha e-mail e senha!", "ae"); return; }
  const btn = document.querySelector("#af button.btn");
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    await signInWithEmailAndPassword(auth, e, p);
    window.GT("ranking");
  } catch {
    SA("E-mail ou senha incorretos 😬", "ae");
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

window.doReg = async () => {
  const n = $("rn")?.value.trim(), e = $("re")?.value.trim(), p = $("rp")?.value, em = $("rem")?.value, un = $("ru")?.value;
  SA("");
  if (!n || !e || !p || !un) { SA("Preencha todos os campos!", "ae"); return; }
  const btn = document.querySelector("#af button.btn");
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    const inv = await getDoc(doc(db, "invites", e.toLowerCase()));
    if (!inv.exists()) {
      SA("🔒 Acesso por convite. E-mail não está na lista — fale com o organizador!", "ae");
      if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
      return;
    }
    const c = await createUserWithEmailAndPassword(auth, e, p);
    await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js").then(m => m.updateProfile(c.user, { displayName: n, photoURL: em || "⚽" }));
    await setDoc(doc(db, "users", c.user.uid), { name: n, email: e.toLowerCase(), emoji: em || "⚽", unit: un, pts: 0 });
    await setDoc(doc(db, "invites", e.toLowerCase()), { status: "joined", joinedAt: serverTimestamp() }, { merge: true });
    state.MU = un;
    window.GT("ranking");
  } catch (err) {
    SA(err.code === "auth/email-already-in-use" ? "E-mail já cadastrado!" : err.message, "ae");
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

window.doReset = async () => {
  const e = $("le")?.value.trim(); SA("");
  if (!e) { SA("Digite seu e-mail primeiro 👆", "ae"); return; }
  const btn = document.querySelector("#af button.btn");
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    await sendPasswordResetEmail(auth, e);
    SA("✅ Link enviado! Verifique sua caixa (e spam).", "ao");
  } catch {
    SA("E-mail não encontrado.", "ae");
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

window.doLogout = async () => {
  await signOut(auth);
  state.PRD = {};
  state.MU = "";
  window.GT("ranking");
};

window.doSSOLogin = async () => {
  SA("", "");
  const btn = document.querySelector("#af button.btn--microsoft");
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  const provider = new OAuthProvider('microsoft.com');
  provider.setCustomParameters({
    tenant: 'ea47001a-3428-40f3-8ea1-86bdb1a3bc84',
    prompt: 'select_account'
  });
  try {
    await signInWithPopup(auth, provider);
    window.GT("ranking");
  } catch (err) {
    console.error(err);
    if (err.code === "auth/popup-closed-by-user") {
      SA("Login cancelado 🧭", "ae");
    } else {
      SA("Erro no SSO: " + err.message, "ae");
    }
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

window.doCompleteProfile = async () => {
  const n = $("cp-name")?.value.trim();
  const un = $("cp-unit")?.value;
  const em = $("cp-emoji")?.value;
  SA("", "");
  if (!n || !un) {
    SA("Preencha o nome e selecione a unidade!", "ae");
    return;
  }
  const btn = document.querySelector("#cc button.btn");
  if (btn) { btn.classList.add("btn--loading"); btn.disabled = true; }
  try {
    const user = auth.currentUser;
    if (!user) return;
    const m = await import("https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js");
    await m.updateProfile(user, { displayName: n, photoURL: em || "⚽" });
    const localUser = state.USERS.find(u => u.uid === user.uid);
    const points = (localUser && localUser.pts !== undefined) ? localUser.pts : 0;
    await setDoc(doc(db, "users", user.uid), { name: n, emoji: em || "⚽", unit: un, pts: points }, { merge: true });
    state.MU = un;
    window.GT("ranking");
  } catch (err) {
    SA(err.message, "ae");
  } finally {
    if (btn) { btn.classList.remove("btn--loading"); btn.disabled = false; }
  }
};

