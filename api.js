import { doc, setDoc, getDoc, getDocs, collection, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { TN, parseKoDate, pts } from "./helpers.js";
import { state } from "./state.js";

const APIKEY = "f94a4cd5d9aa247a17505718db07f559";

let ftimer = null;

export async function recalculateStandings(db) {
  try {
    console.log("Recalculating standings...");
    const resultsSnap = await getDocs(collection(db, "results"));
    const latestResults = {};
    resultsSnap.forEach(d => {
      latestResults[d.id] = d.data();
    });

    const usersSnap = await getDocs(collection(db, "users"));
    
    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const predictionsSnap = await getDocs(collection(db, "users", userId, "predictions"));
      const userPredictions = {};
      predictionsSnap.forEach(d => {
        userPredictions[d.id] = d.data();
      });
      
      const newPoints = pts(userPredictions, latestResults);
      await setDoc(doc(db, "users", userId), { pts: newPoints }, { merge: true });
    }
    console.log("Standings successfully recalculated!");
  } catch (error) {
    console.error("Error recalculating standings:", error);
  }
}

export async function fetchAPI(db) {
  if (!state.ME) return;
  try {
    const horaAtual = new Date().toISOString().slice(0, 13);
    const trava = await getDoc(doc(db, "system", "apifetch"));
    if (trava.exists() && trava.data().hora === horaAtual) {
      scheduleNext(db);
      return;
    }
    await setDoc(doc(db, "system", "apifetch"), { hora: horaAtual, who: state.ME.email, at: serverTimestamp() });
    const d = new Date().toISOString().slice(0, 10);
    const r = await fetch('https://v3.football.api-sports.io/fixtures?league=1&season=2026&date=' + d, { headers: { 'x-apisports-key': APIKEY } });
    const data = await r.json();
    let updatedAny = false;
    for (const fx of (data.response || [])) {
      const { home, away } = fx.goals; if (home === null || away === null) continue;
      const live = ["1H", "HT", "2H", "ET", "P"].includes(fx.fixture.status.short);
      const hn = fx.teams.home.name.toLowerCase().slice(0, 5);
      const an = fx.teams.away.name.toLowerCase().slice(0, 5);
      const m = state.MX.find(x => TN(x.h).toLowerCase().includes(hn) || TN(x.a).toLowerCase().includes(an));
      if (m) {
        const currentRes = state.RES[m.id];
        if (!currentRes || currentRes.home !== home || currentRes.away !== away || currentRes.live !== live) {
          await setDoc(doc(db, "results", String(m.id)), {
            home,
            away,
            live,
            kickoffTime: parseKoDate(m.ko),
            updatedAt: serverTimestamp()
          });
          updatedAny = true;
        }
      }
    }
    if (updatedAny) {
      await recalculateStandings(db);
    }
    console.log("API buscada às", horaAtual, "por", state.ME.email);
  } catch (e) { console.warn("API", e); }
  scheduleNext(db);
}

function scheduleNext(db) {
  const now = new Date();
  const msToNextHour = (60 - now.getMinutes()) * 60000 - now.getSeconds() * 1000;
  if (ftimer) clearTimeout(ftimer);
  ftimer = setTimeout(() => fetchAPI(db), Math.max(msToNextHour, 60000));
}
