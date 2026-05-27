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
  "england":"gb-eng","croatia":"hr","ghana":"gh","panama":"pa"
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
  const d = new Date(ko);
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

