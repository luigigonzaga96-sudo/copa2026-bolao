import { signOut, OAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { $ } from "./helpers.js";
import { state } from "./state.js";
import { getTranslation } from "./i18n.js";

let auth, db;

export function initAuth(authInstance, dbInstance) {
  auth = authInstance;
  db = dbInstance;
}

export const isAdm = e => {
  const email = (e || "").toLowerCase();
  const bootstrapAdmins = ['luigi.gonzaga@db1.com.br', 'bruno.rossmann@db1.com.br', 'jocimar.huss@db1.com.br'];
  return bootstrapAdmins.includes(email) || (state.ADMINS && state.ADMINS.includes(email));
};

function SA(msg, cls = "") {
  const el = $("aa");
  if (!el) return;
  el.innerHTML = msg ? `<div class="alert ${cls}">${msg}</div>` : "";
}


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
    console.error("Erro completo do Auth:", err);
    let errorMsg = err.message;
    if (err.customData) {
      console.error("customData do erro:", err.customData);
      if (err.customData.serverResponse) {
        try {
          const serverResp = typeof err.customData.serverResponse === 'string'
            ? JSON.parse(err.customData.serverResponse)
            : err.customData.serverResponse;
          errorMsg += " | Detalhes: " + JSON.stringify(serverResp);
        } catch (e) {
          errorMsg += " | Detalhes: " + err.customData.serverResponse;
        }
      }
    }
    if (err.code === "auth/popup-closed-by-user") {
      SA(getTranslation("auth_login_cancelled"), "ae");
    } else {
      SA(getTranslation("auth_sso_error") + errorMsg, "ae");
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
    SA(getTranslation("auth_complete_profile_validation"), "ae");
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

export async function getAuthToken() {
  return auth && auth.currentUser ? await auth.currentUser.getIdToken() : null;
}

