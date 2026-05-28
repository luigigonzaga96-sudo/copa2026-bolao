const {onSchedule} = require("firebase-functions/v2/scheduler");
const {onRequest} = require("firebase-functions/v2/https");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {initializeApp} = require("firebase-admin/app");
const {getFirestore} = require("firebase-admin/firestore");
const {getAuth} = require("firebase-admin/auth");

// Inicializa o Firebase Admin SDK
initializeApp();
const db = getFirestore();
const auth = getAuth();

const bootstrapAdmins = [
  "luigi.gonzaga@db1.com.br",
  "bruno.rossmann@db1.com.br",
  "jocimar.huss@db1.com.br",
];

/**
 * Checks if email is in bootstrap list or admins collection.
 * @param {string} email User email.
 * @return {Promise<boolean>} Resolves to true if admin.
 */
async function isEmailAdmin(email) {
  if (!email) return false;
  const e = email.toLowerCase();
  if (bootstrapAdmins.includes(e)) return true;
  const docRef = db.collection("admins").doc(e);
  const docSnap = await docRef.get();
  return docSnap.exists;
}

// ID da Competição na API (Ex: WC para World Cup.
// Confirme o ID atualizado na API)
const COMPETITION_CODE = "WC";

/**
 * Normaliza o nome do país vindo da API para bater com o
 * padrão de chaves do frontend.
 * @param {string} name Nome original do time.
 * @return {string} Nome normalizado.
 */
function normalizeTeamName(name) {
  if (!name) return "";
  return name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "") // remove acentos
      .replace(/[.-]/g, " ") // substitui pontos/hifens por espaços
      .replace(/\s+/g, " ") // remove espaços extras
      .trim()
      .replace(/\s/g, "_");
}

/**
 * Recalcula a pontuação dos usuários com base nos palpites e resultados.
 * @param {object} dbInstance Instância do Firestore.
 */
async function recalculateStandings(dbInstance) {
  try {
    console.log("Recalculating standings on backend...");
    const resultsSnap = await dbInstance.collection("results").get();
    const latestResults = {};
    resultsSnap.forEach((d) => {
      latestResults[d.id] = d.data();
    });

    const matchesSnap = await dbInstance.collection("matches").get();
    const matchesList = [];
    matchesSnap.forEach((d) => {
      matchesList.push({id: Number(d.id), ...d.data()});
    });

    const sgn = (n) => n > 0 ? 1 : n < 0 ? -1 : 0;

    const pts = (preds, RES) => {
      let p = 0;
      for (const [mid, pred] of Object.entries(preds || {})) {
        const r = RES[mid];
        if (!r || r.home === null || r.home === undefined) continue;
        const m = matchesList.find((x) => String(x.id) === String(mid));
        if (m && m.test) continue;
        if (pred.home === r.home && pred.away === r.away) {
          p += 5;
          continue;
        }
        if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) {
          p += 3;
        }
      }
      return p;
    };

    const usersSnap = await dbInstance.collection("users").get();
    const batch = dbInstance.batch();

    for (const userDoc of usersSnap.docs) {
      const userId = userDoc.id;
      const predictionsSnap = await dbInstance.collection("users")
          .doc(userId).collection("predictions").get();
      const userPredictions = {};
      predictionsSnap.forEach((d) => {
        userPredictions[d.id] = d.data();
      });

      const newPoints = pts(userPredictions, latestResults);
      batch.update(dbInstance.collection("users").doc(userId), {
        pts: newPoints,
      });
    }

    await batch.commit();
    console.log("Standings successfully recalculated!");
  } catch (error) {
    console.error("Error recalculating standings:", error);
  }
}

/**
 * Cloud Function acionada quando um resultado é atualizado no Firestore.
 */
exports.onResultWritten = onDocumentWritten(
    "results/{matchId}",
    async (event) => {
      console.log(`Result for ${event.params.matchId} updated.`);
      await recalculateStandings(db);
    },
);

/**
 * Cloud Function agendada para rodar a cada 15 minutos.
 * Consome os resultados da API externa e atualiza o Firestore.
 */
exports.atualizarResultadosBolao = onSchedule("*/15 * * * *", async (event) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    console.error("FOOTBALL_DATA_API_KEY is not configured.");
    return;
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/` +
        `${COMPETITION_CODE}/matches`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    const apiMatches = data.matches || [];

    const finishedMatches = apiMatches.filter(
        (match) => match.status === "FINISHED",
    );

    if (finishedMatches.length === 0) {
      console.log("Nenhuma partida encerrada encontrada na resposta da API.");
      return;
    }

    const matchesSnap = await db.collection("matches").get();
    const dbMatches = [];
    matchesSnap.forEach((d) => {
      dbMatches.push({id: Number(d.id), ...d.data()});
    });

    const batch = db.batch();
    let updatesCount = 0;

    for (const match of finishedMatches) {
      const homeNorm = normalizeTeamName(match.homeTeam.name);
      const awayNorm = normalizeTeamName(match.awayTeam.name);

      const m = dbMatches.find((x) =>
        x.h === homeNorm || x.a === awayNorm,
      );

      if (m) {
        const resultRef = db.collection("results").doc(String(m.id));
        const resSnap = await resultRef.get();

        const golsHome = match.score.fullTime.home;
        const golsAway = match.score.fullTime.away;

        let shouldUpdate = false;
        if (!resSnap.exists) {
          shouldUpdate = true;
        } else {
          const rData = resSnap.data();
          if (rData.home !== golsHome || rData.away !== golsAway ||
              rData.live !== false) {
            shouldUpdate = true;
          }
        }

        if (shouldUpdate) {
          batch.set(resultRef, {
            home: golsHome,
            away: golsAway,
            live: false,
            kickoffTime: m.ko ? new Date(m.ko) : null,
            updatedAt: new Date(),
          }, {merge: true});
          updatesCount++;
        }
      }
    }

    if (updatesCount > 0) {
      await batch.commit();
      console.log(`Sucesso: ${updatesCount} resultados atualizados.`);
    } else {
      console.log("Todas as partidas finalizadas já estavam atualizadas.");
    }
  } catch (error) {
    console.error("Erro na atualização de resultados:", error);
  }
});

/**
 * Cloud Function acionada manualmente (HTTP/HTTPS) para importar as partidas.
 * Consome a API do football-data.org e popula/atualiza a coleção 'matches' no
 * Firestore.
 */
exports.popularMatchesManual = onRequest({cors: true}, async (req, res) => {
  // Autenticação e Autorização (apenas admins)
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({error: "Unauthorized: Missing or invalid token"});
    return;
  }
  const idToken = authHeader.split("Bearer ")[1];
  try {
    const decodedToken = await auth.verifyIdToken(idToken);
    const email = decodedToken.email || decodedToken.upn;
    const admin = await isEmailAdmin(email);
    if (!admin) {
      res.status(403).json({error: "Forbidden: Admin privileges required"});
      return;
    }
  } catch (error) {
    res.status(401).json({error: "Unauthorized: Invalid token"});
    return;
  }

  const apiKey = process.env.FOOTBALL_DATA_API_KEY;

  if (!apiKey) {
    res.status(500).json({
      error: "FOOTBALL_DATA_API_KEY is not configured.",
    });
    return;
  }

  const competitionCode = req.query.competition || COMPETITION_CODE;

  try {
    const url = `https://api.football-data.org/v4/competitions/` +
        `${competitionCode}/matches`;
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Auth-Token": apiKey,
      },
    });

    if (!response.ok) {
      throw new Error(
          `Erro na API: ${response.status} - ${response.statusText}`,
      );
    }

    const data = await response.json();
    const apiMatches = data.matches || [];

    // Filtra apenas as partidas da fase de grupos
    const groupMatches = apiMatches.filter((match) =>
      match.stage === "GROUP_STAGE" ||
      (match.group && match.group.startsWith("GROUP_")),
    );

    if (groupMatches.length === 0) {
      res.status(200).json({
        message: "Nenhuma partida da fase de grupos encontrada.",
        count: 0,
      });
      return;
    }

    const batch = db.batch();
    const importedMatches = [];

    for (const match of groupMatches) {
      const matchId = String(match.id);
      const matchRef = db.collection("matches").doc(matchId);

      const groupLetter = match.group ?
          match.group.replace("GROUP_", "").trim() : "";
      const roundStr = match.matchday ? `R${match.matchday}` : "";

      const matchData = {
        g: groupLetter,
        rod: roundStr,
        h: normalizeTeamName(match.homeTeam.name),
        a: normalizeTeamName(match.awayTeam.name),
        ko: match.utcDate,
      };

      batch.set(matchRef, matchData, {merge: true});
      importedMatches.push({id: match.id, ...matchData});
    }

    await batch.commit();

    res.status(200).json({
      success: true,
      message: `Sucesso: ${importedMatches.length} partidas ` +
          `importadas/atualizadas na coleção 'matches'.`,
      count: importedMatches.length,
      matches: importedMatches,
    });
  } catch (error) {
    console.error("Erro crítico ao popular a coleção de matches:", error);
    res.status(500).json({error: error.message});
  }
});
