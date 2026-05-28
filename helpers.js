import { state, UNITS } from "./state.js";

import { getTranslation } from "./i18n.js";

// SCORING
export const sgn = n => n > 0 ? 1 : n < 0 ? -1 : 0;

export function pts(preds, RES, includeTest = false) {
  let p = 0;
  for (const [mid, pred] of Object.entries(preds || {})) {
    const r = RES[mid]; if (!r || r.home === null) continue;
    const m = state.MX.find(x => String(x.id) === String(mid));
    if (m?.test && !includeTest) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}

export function ptsRound(preds, roundName, RES) {
  let p = 0;
  const mids = state.MX.filter(x => x.round === roundName).map(x => String(x.id));
  for (const mid of mids) {
    const pred = preds[mid], r = RES[mid]; if (!pred || !r || r.home === null) continue;
    if (pred.home === r.home && pred.away === r.away) { p += 5; continue; }
    if (sgn(pred.home - pred.away) === sgn(r.home - r.away)) p += 3;
  }
  return p;
}
export function parseKoDate(ko) {
  if (!ko) return new Date(NaN);
  if (ko instanceof Date) return ko;
  if (ko && typeof ko.toDate === "function") return ko.toDate();
  if (typeof ko === "string") {
    const sliceStart = ko.includes("T") ? ko.indexOf("T") : 10;
    const hasTz = /[Z+-]/.test(ko.slice(sliceStart));
    return new Date(hasTz ? ko : ko + "Z");
  }
  return new Date(ko);
}

export const isOpen = m => Date.now() < parseKoDate(m.ko).getTime() - 1800000;

export function lockLbl(m) {
  const d = parseKoDate(m.ko).getTime() - 1800000 - Date.now();
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
export function fmtName(name) {
  if (!name) return "";
  const parts = name.trim().split(/\s+/);
  return parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1]}` : name;
}

// FLAG MAP
export function TN(key) {
  return getTranslation(key) || key;
}

const _FM = {
  "mexico":"mx","south_africa":"za","south_korea":"kr","czech_rep":"cz",
  "canada":"ca","bosnia":"ba","qatar":"qa","switzerland":"ch",
  "brazil":"br","morocco":"ma","haiti":"ht","scotland":"gb-sct",
  "usa":"us","paraguay":"py","australia":"au","turkey":"tr",
  "germany":"de","curacao":"cw","ivory_coast":"ci","ecuador":"ec",
  "netherlands":"nl","japan":"jp","sweden":"se","tunisia":"tn",
  "belgium":"be","egypt":"eg","iran":"ir","new_zealand":"nz",
  "spain":"es","cape_verde":"cv","saudi_arabia":"sa","uruguay":"uy",
  "france":"fr","senegal":"sn","iraq":"iq","norway":"no",
  "argentina":"ar","algeria":"dz","austria":"at","jordan":"jo",
  "portugal":"pt","dr_congo":"cd","uzbekistan":"uz","colombia":"co",
  "england":"gb-eng","croatia":"hr","ghana":"gh","panama":"pa",
  // Mapas adicionais para compatibilidade com nomes normalizados diretamente da API
  "united_states_of_america":"us","united_states":"us","czech_republic":"cz","czechia":"cz",
  "bosnia_and_herzegovina":"ba","bosnia_herzegovina":"ba","korea_republic":"kr","cabo_verde":"cv","cape_verde_islands":"cv",
  "democratic_republic_of_the_congo":"cd","congo_dr":"cd",
  "cote_d_ivoire":"ci","cote_divoire":"ci","cote_d'ivoire":"ci",
  "turkiye":"tr","ir_iran":"ir"
};

export function FL(key) {
  const c = _FM[key];
  return c ? `<img src="https://flagcdn.com/w20/${c.replace('gb-sct','gb').replace('gb-eng','gb')}.png" width="20" height="14" style="border-radius:2px;vertical-align:middle;margin:0 2px">` : "";
}

export function UB(k) {
  const u = UNITS[k];
  if (!u) return "";
  return `<span class="unit-badge" style="background:${u.bg};color:${u.text};border-color:${u.color}">${u.label}</span>`;
}

export function fmtDT(ko) {
  const d = parseKoDate(ko);
  if (isNaN(d.getTime())) return { d: "", t: "" };

  const locale = navigator.language || "pt-BR";

  const dateStr = d.toLocaleDateString(locale, { day: "2-digit", month: "2-digit" });
  const timeStr = d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: false });

  // Append short timezone abbreviation so the user knows which timezone is displayed
  let tzLabel = "";
  try {
    const parts = new Intl.DateTimeFormat(locale, { timeZoneName: "short" }).formatToParts(d);
    const tzPart = parts.find(p => p.type === "timeZoneName");
    if (tzPart) tzLabel = ` (${tzPart.value})`;
  } catch (_) { /* ignore if not supported */ }

  return { d: dateStr, t: timeStr + tzLabel };
}

export const $ = id => document.getElementById(id);

export function escapeHTML(str) {
  if (!str) return "";
  return String(str).replace(/[&<>"']/g, m => {
    switch (m) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      case "'": return '&#39;';
      default: return m;
    }
  });
}

export function getEcosystemStyles(eco) {
  const e = (eco || "").toUpperCase().trim();
  if (e.includes("CHRISTIAN TECH")) {
    return {
      color: "#a855f7",
      bg: "rgba(168,85,247,.15)",
      text: "#c084fc",
    };
  }
  if (e.includes("TECHFIN")) {
    return {
      color: "#10b981",
      bg: "rgba(16,185,129,.15)",
      text: "#34d399",
    };
  }
  if (e.includes("DIGITAL TRANSFORMATION")) {
    return {
      color: "#3b82f6",
      bg: "rgba(59,130,246,.15)",
      text: "#60a5fa",
    };
  }
  if (e.includes("E-COMMERCE")) {
    return {
      color: "#f47c20",
      bg: "rgba(244,124,32,.15)",
      text: "#f9a55c",
    };
  }
  if (e.includes("HOLDING")) {
    return {
      color: "#06b6d4",
      bg: "rgba(6,182,212,.15)",
      text: "#67e8f9",
    };
  }
  if (e.includes("DB1 LABS")) {
    return {
      color: "#ec4899",
      bg: "rgba(236,72,153,.15)",
      text: "#f472b6",
    };
  }
  return {
    color: "#94a3b8",
    bg: "rgba(148,163,184,.15)",
    text: "#cbd5e1",
  };
}

