import { MX } from "./matches.js";
import { UNITS } from "./units.js";

import { getTranslation } from "./i18n.js";

// SCORING
export const sgn = n => n > 0 ? 1 : n < 0 ? -1 : 0;

export function pts(preds, RES, includeTest = false) {
  let p = 0;
  for (const [mid, pred] of Object.entries(preds || {})) {
    const r = RES[mid]; if (!r || r.home === null) continue;
    const m = MX.find(x => String(x.id) === String(mid));
    if (m?.test && !includeTest) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}

export function ptsRound(preds, roundName, RES) {
  let p = 0;
  const mids = MX.filter(x => x.round === roundName).map(x => String(x.id));
  for (const mid of mids) {
    const pred = preds[mid], r = RES[mid]; if (!pred || !r || r.home === null) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}

export const isOpen = m => Date.now() < new Date(m.ko).getTime() - 300000;

export function lockLbl(m) {
  const d = new Date(m.ko).getTime() - 300000 - Date.now();
  if (d <= 0) return null;
  const h = Math.floor(d / 3600000), mn = Math.floor((d % 3600000) / 60000);
  if (h > 24) return `${getTranslation("helper_closes_in")}${Math.floor(d / 86400000)}d`;
  if (h > 0) return `⚠️ ${h}h ${mn}min`;
  return mn > 0 ? `⚠️ ${mn}min!` : getTranslation("helper_closing");
}

export function pSt(mid, PRD, RES) {
  const p = PRD[mid], r = RES[mid];
  if (!p) return null;
  if (!r || r.home === null) return "pend";
  if (p.home === r.home && p.away === r.away) return "e";
  if (sgn(p.home - p.away) === sgn(r.home - r.away)) return "w";
  return "l";
}

export const RI = i => i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`;
export const RC = i => i === 0 ? "leaderboard__rank--gold" : i === 1 ? "leaderboard__rank--silver" : i === 2 ? "leaderboard__rank--bronze" : "";

// FLAG MAP
export function TN(s) {
  return s.replace(/[\u{1F1E6}-\u{1F1FF}]{2}|\uD83C\uDFF4[\uDB40\uDC00-\uDB40\uDC7F]+/gu, "").trim();
}

const _FM = {
  "México": "mx", "Africa do Sul": "za", "África do Sul": "za", "África Sul": "za",
  "Coreia do Sul": "kr", "Coreia Sul": "kr", "Tchéquia": "cz", "Canadá": "ca",
  "Bósnia": "ba", "Catar": "qa", "Suíça": "ch", "Brasil": "br", "Marrocos": "ma",
  "Haiti": "ht", "Escócia": "gb-sct", "EUA": "us", "Paraguai": "py", "Austrália": "au",
  "Turquia": "tr", "Alemanha": "de", "Curaçao": "cw", "Costa do Marfim": "ci",
  "C. Marfim": "ci", "Equador": "ec", "Holanda": "nl", "Japão": "jp", "Suécia": "se",
  "Tunísia": "tn", "Bélgica": "be", "Egito": "eg", "Irã": "ir", "Nova Zelândia": "nz",
  "N. Zelândia": "nz", "Espanha": "es", "Cabo Verde": "cv", "Arábia Saudita": "sa",
  "Ar. Saudita": "sa", "Uruguai": "uy", "França": "fr", "Senegal": "sn", "Iraque": "iq",
  "Noruega": "no", "Argentina": "ar", "Argélia": "dz", "Áustria": "at", "Jordânia": "jo",
  "Portugal": "pt", "Rep. Dem. Congo": "cd", "R.D. Congo": "cd", "Uzbequistão": "uz",
  "Colômbia": "co", "Inglaterra": "gb-eng", "Croácia": "hr", "Gana": "gh", "Panamá": "pa"
};

export function FL(s) {
  const n = TN(s).trim();
  const c = _FM[n] || Object.entries(_FM).find(([k]) => n.includes(k) || k.includes(n))?.[1];
  return c ? `<img src="https://flagcdn.com/w20/${c.replace('gb-sct', 'gb').replace('gb-eng', 'gb')}.png" width="20" height="14" style="border-radius:2px;vertical-align:middle;margin:0 2px">` : "";
}

export function UB(k) {
  const u = UNITS[k];
  if (!u) return "";
  return `<span class="unit-badge" style="background:${u.bg};color:${u.text};border-color:${u.color}">${u.label}</span>`;
}

export function fmtDT(ko) {
  const d = new Date(ko);
  if (isNaN(d.getTime())) return { d: "", t: "" };
  const pad = n => String(n).padStart(2, "0");
  const dateStr = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}`;
  const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  return { d: dateStr, t: timeStr };
}

export const $ = id => document.getElementById(id);

