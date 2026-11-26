// CystoRisk – interface. Toda a lógica clínica está em scores.js.
import * as S from "./scores.js";
import { LANGS, makeT } from "./i18n.js";

const $ = (id) => document.getElementById(id);
let lang = "pt";
let t = makeT(lang);
const num = (id) => { const v = parseFloat($(id).value); return Number.isFinite(v) ? v : null; };
const fmt = (n, d) => { const s = n.toFixed(d); return lang === "en" ? s : s.replace(".", ","); };
const dec = (id) => { const v = $(id).value; return v === "" ? "–" : (lang === "en" ? v : v.replace(".", ",")); };
function setPill(el, cls, txt) { el.className = "pill " + cls; el.textContent = txt; }
const optText = (id) => { const s = $(id); return s.options[s.selectedIndex].text; };

// ---------- Estrutura dinâmica ----------
const G8 = [
  { id: "A", opts: [0, 1, 2], d: 2 },
  { id: "B", opts: [0, 1, 2, 3], d: 2 },
  { id: "C", opts: [0, 1, 2], d: 2 },
  { id: "E", opts: [0, 1, 2], d: 2 },
  { id: "F", auto: true, labels: ["< 19", "19 – < 21", "21 – < 23", "≥ 23"], opts: [0, 1, 2, 3] },
  { id: "H", opts: [0, 1], d: 0, yesNo: true },
  { id: "P", opts: [0, 0.5, 1, 2], d: 2, keys: ["g8P0", "g8P1", "g8P2", "g8P3"] },
  { id: "Age", auto: true, labels: ["> 85", "80 – 85", "< 80"], opts: [0, 1, 2] },
];
function buildG8() {
  const box = $("g8q"); box.innerHTML = "";
  for (const it of G8) {
    const w = document.createElement("div"); w.className = "q";
    const lab = document.createElement("label"); lab.htmlFor = "g8-" + it.id;
    const letter = document.createElement("span"); letter.className = "letter"; letter.textContent = it.id === "Age" ? "" : it.id;
    const txt = document.createElement("span"); txt.textContent = t(it.id === "Age" ? "g8Age" : "g8" + it.id);
    lab.append(letter, txt);
    if (it.auto) { const a = document.createElement("span"); a.className = "auto"; a.textContent = " · " + t("auto"); lab.append(a); }
    const sel = document.createElement("select"); sel.id = "g8-" + it.id; if (it.auto) sel.disabled = true;
    it.opts.forEach((v, i) => {
      let label = it.labels ? it.labels[i] : it.keys ? t(it.keys[i]) : it.yesNo ? t(i === 0 ? "yes" : "no") : t(`g8${it.id}${v}`);
      const o = new Option(`${label} (${String(v).replace(".", lang === "en" ? "." : ",")})`, v);
      if (i === it.d) o.selected = true;
      sel.add(o);
    });
    w.append(lab, sel); box.append(w);
  }
}
function buildCCI() {
  const box = $("cciq"); box.innerHTML = "";
  for (const [k, p] of S.CHARLSON_ITEMS) {
    const l = document.createElement("label"); l.className = "note"; l.style.color = "var(--fg)";
    const cb = document.createElement("input"); cb.type = "checkbox"; cb.id = "cci-" + k;
    const s = document.createElement("span"); s.textContent = ` ${t("cci_" + k)} `;
    const pts = document.createElement("span"); pts.style.color = "var(--muted)"; pts.textContent = `(${p})`;
    l.append(cb, s, pts); box.append(l);
  }
}

// ---------- Paciente de exemplo ----------
const EXAMPLE = {
  age: 77, sex: "M", wt: 72, ht: 1.70, cr: 1.1, alb: 3.6, ecog: "1", asa: "3", ct: "cT3", cn: "0",
  hist: "pure", cis: "0", ureth: "0", hydro: "0", lvi: "na", "mna-d": "2", pr: 8.1, pl: 8.6,
  "rk-serious": 22.4, "rk-any": 38.0, "rk-death": 2.1, "rk-los": 8.5, "rk-epi": "Lee (4y)", "rk-epr": 27,
  checks: ["cci-mi", "cci-copd", "cci-dm"],
};
function loadPatient(p) {
  document.querySelectorAll("#p-pt input, #p-fr input, #p-risk input").forEach((e) => { if (e.id !== "cm" && e.id !== "cf") e.value = ""; });
  document.querySelectorAll("input[type=checkbox]").forEach((e) => { e.checked = false; });
  for (const [k, v] of Object.entries(p)) if (k !== "checks" && $(k)) $(k).value = v;
  (p.checks || []).forEach((id) => { if ($(id)) $(id).checked = true; });
  update();
}

// ---------- Tradução ----------
function applyLang(l) {
  lang = LANGS[l] ? l : "pt"; t = makeT(lang);
  document.documentElement.lang = lang === "pt" ? "pt-BR" : lang;
  const keep = {}; document.querySelectorAll("#g8q select, #cciq input").forEach((e) => { keep[e.id] = e.type === "checkbox" ? e.checked : e.value; });
  document.querySelectorAll("[data-i18n]").forEach((e) => { e.textContent = t(e.dataset.i18n); });
  buildG8(); buildCCI();
  for (const [id, v] of Object.entries(keep)) { const e = $(id); if (!e) continue; if (e.type === "checkbox") e.checked = v; else e.value = v; }
  try { localStorage.setItem("cystorisk.lang", lang); } catch (e) { /* sem armazenamento */ }
  update();
}

// ---------- Cálculo e renderização ----------
// Data de nascimento para exibição (en: ISO, sem ambiguidade; pt/es: dd/mm/aaaa).
const fmtDate = (iso) => { if (!iso) return ""; const [y, m, d] = iso.split("-"); return lang === "en" ? iso : `${d}/${m}/${y}`; };

function update() {
  // Idade automática pela data de nascimento (só na memória da aba; nada é salvo).
  const dobAge = S.ageFromBirthDate($("dob").value);
  $("age").readOnly = dobAge != null; $("ageAuto").hidden = dobAge == null;
  $("ageAuto").textContent = " · " + t("ageAuto");
  if (dobAge != null) $("age").value = dobAge;
  const pname = $("pname").value.trim(), dob = dobAge != null ? fmtDate($("dob").value) : "";
  const idTxt = [pname, dob && `${t("dobShort")} ${dob}`].filter(Boolean).join(", ");

  const age = num("age"), female = $("sex").value === "F", wt = num("wt"), ht = num("ht"), cr = num("cr");
  const ecog = +$("ecog").value, asa = +$("asa").value, cn = $("cn").value === "1";
  const histV = $("hist").value, ur = $("ureth").value, hy = +$("hydro").value, lvi = $("lvi").value;
  const b = S.bmi(wt, ht), cl = S.cockcroftGault({ age, weightKg: wt, creatinine: cr, female });
  $("bmi").textContent = b ? fmt(b, 1) : "–"; $("clcr").textContent = cl ? fmt(cl, 0) : "–";
  const asaR = ["", "I", "II", "III", "IV"][asa];
  $("qPt").textContent = `${pname ? pname + " · " : ""}${histV !== "pure" ? "⚠ " + t("variantFlag") + " · " : ""}${age ?? "–"} ${t("years")} · ${female ? "F" : "M"} · ${t("bmi")} ${b ? fmt(b, 1) : "–"} · ${t("crcl").split(" ")[0]} ${cl ? fmt(cl, 0) : "–"} · ECOG ${ecog} · ASA ${asaR} · ${$("ct").value}${cn ? "N+" : "N0"}`;

  // G8 automáticos
  if (b) $("g8-F").value = S.bmiPoints(b);
  if (age) $("g8-Age").value = S.g8AgePoints(age);
  const g = (id) => parseFloat($("g8-" + id).value);
  const g8 = S.g8({ A: g("A"), B: g("B"), C: g("C"), E: g("E"), F: g("F"), H: g("H"), P: g("P"), ageItem: g("Age") });
  const g8t = Number.isInteger(g8.total) ? String(g8.total) : fmt(g8.total, 1);
  $("g8tot").textContent = g8t + " / 17"; $("sumG8").textContent = g8t;
  [$("g8pill"), $("sumG8p")].forEach((e) => setPill(e, g8.vulnerable ? "bad" : "ok", t(g8.vulnerable ? "vulnerable" : "notVulnerable")));

  const mna = S.mnaSF({ A: g("A"), B: g("B"), C: g("C"), D: +$("mna-d").value, E: g("E"), F: g("F") });
  const mnaL = t({ normal: "mnaNormal", risk: "mnaRisk", malnourished: "mnaMal" }[mna.status]);
  $("mnaTot").textContent = mna.total + " / 14"; setPill($("mnaPill"), { normal: "ok", risk: "warn", malnourished: "bad" }[mna.status], mnaL);

  const custom = $("ref").value === "custom"; $("customRow").hidden = !custom;
  const ps = S.psoasIndex({ rightCm2: num("pr"), leftCm2: num("pl"), heightM: ht, female,
    cutoffs: custom ? { male: num("cm"), female: num("cf") } : S.PSOAS_CUTOFFS_HAMAGUCHI });
  const pmiL = ps ? t(ps.low ? "pmiLow" : "pmiOk", { x: fmt(ps.cutoff, 2) }) : t("fillIn");
  $("pmi").textContent = ps ? fmt(ps.pmi, 2) : "–"; $("sumPMI").textContent = ps ? fmt(ps.pmi, 2) : "–";
  [$("pmipill"), $("sumPMIp")].forEach((e) => setPill(e, !ps ? "na" : ps.low ? "bad" : "ok", pmiL));

  // Tumor
  const urBlocked = ur === "str" || ur === "neck";
  const urName = t(ur === "str" ? "uStr" : "uNeck").toLowerCase();
  const nbU = $("nb-ureth"); nbU.disabled = urBlocked; if (urBlocked) nbU.checked = false;
  $("nbUrethNote").textContent = urBlocked ? `(${t("nbBlocked", { x: urName })})` : ur === "muc" ? `(${t("nbMuc")})` : "";
  const notes = [];
  if (urBlocked) notes.push(t("noteUrethraBlock", { x: urName }));
  if (hy) notes.push(t("noteHydro"));
  if (histV !== "pure") notes.push(t("noteVariant"));
  $("tumorNote").textContent = notes.join(" ");

  // Cisplatina
  const ce = S.cisplatinEligibility({ ecog, crcl: cl, hearingLoss: $("cis-hear").checked, neuropathy: $("cis-neur").checked, heartFailure: $("cis-hf").checked });
  const cKeys = { ecog: "critEcog", crcl: "critCrcl", hearing: "critHearing", neuropathy: "critNeuro", heartFailure: "critHf" };
  $("cisItems").innerHTML = "";
  for (const [k, v] of Object.entries(ce.criteria)) { const s = document.createElement("span"); setPill(s, v ? "bad" : "ok", `${t(cKeys[k])}: ${t(v ? "yes" : "no")}`); $("cisItems").append(s); }
  const cisWhy = Object.entries(ce.criteria).filter(([, v]) => v).map(([k]) => t(cKeys[k])).join(", ");
  setPill($("cisPill"), ce.eligible ? "ok" : "bad", t(ce.eligible ? "eligible" : "ineligible") + (ce.eligible ? "" : " (Galsky)"));
  const cisKnown = cl != null || !ce.eligible;
  $("sumCis").textContent = cisKnown ? t(ce.eligible ? "yes" : "no") : "–";
  setPill($("sumCisp"), !cisKnown ? "na" : ce.eligible ? "ok" : "bad", !cisKnown ? t("fillIn") : t(ce.eligible ? "eligible" : "ineligible"));
  if (!cisKnown) setPill($("cisPill"), "na", t("fillIn"));
  $("cisHist").textContent = histV === "ne" ? t("cisNe") : histV !== "pure" ? t("cisVariant") : "";

  // AA-CCI e CABEM
  const present = S.CHARLSON_ITEMS.map(([k]) => k).filter((k) => $("cci-" + k).checked);
  const cci = S.ageAdjustedCharlson(age || 0, present);
  $("cciTot").textContent = cci.total; $("cciAge").textContent = t("cciAge", { x: cci.agePts });
  const cb = S.cabem({ ecog, asa, aaCci: cci.total, age: age || 0, mnaSf: mna.total, nodePositive: cn });
  const cbKeys = { ecog: "cbEcog", asa: "cbAsa", aaCci: "cbCci", age: "cbAge", mna: "cbMna", nodes: "cbNodes" };
  $("cbItems").innerHTML = "";
  for (const [k, v] of Object.entries(cb.criteria)) { const s = document.createElement("span"); setPill(s, v ? "bad" : "ok", `${t(cbKeys[k])}: ${v ? 1 : 0}`); $("cbItems").append(s); }
  const bandCls = { intestinal: "ok", ureterostomy: "warn", avoid: "bad" }[cb.band];
  const bandRange = { intestinal: "0–1", ureterostomy: "2–3", avoid: "4–6" }[cb.band];
  const bandTxt = t({ intestinal: "bandIntestinal", ureterostomy: "bandUreterostomy", avoid: "bandAvoid" }[cb.band]);
  $("cbTot").textContent = cb.score + " / 6"; $("cbRec").textContent = bandTxt; setPill($("cbPill"), bandCls, bandRange);
  $("sumCB").textContent = age ? cb.score : "–"; setPill($("sumCBp"), age ? bandCls : "na", age ? bandRange : t("fillIn"));

  // Derivação
  $("dv-renalHint").textContent = cl ? `(${t("crcl").split(" ")[0]} ${fmt(cl, 0)} mL/min)` : "";
  const abs = [...document.querySelectorAll(".dv-abs")].filter((e) => e.checked);
  const rel = [...document.querySelectorAll(".dv-rel")].filter((e) => e.checked);
  setPill($("dvPill"), abs.length ? "bad" : rel.length ? "warn" : "ok", t(abs.length ? "contraAbs" : rel.length ? "contraRel" : "contraNone"));
  const req = [...document.querySelectorAll(".nb-req")], reqOk = req.every((e) => e.checked), reqN = req.filter((e) => e.checked).length;
  setPill($("nbPill"), reqOk ? "ok" : "warn", reqOk ? t("reqsOk") : t("reqsN", { n: reqN, t: req.length }));
  const sg = S.diversionSuggestion({ cabemScore: cb.score, absoluteContra: abs.length > 0, relativeContra: rel.length > 0, neobladderReqsMet: reqOk, urethraInvolved: urBlocked });
  const sgMap = {
    avoid: ["bad", "sAvoid", "tAvoid"], ureterostomy: ["warn", "sUreterostomy", "tUreterostomy"], neobladder: ["ok", "sNeobladder", "tNeobladder"],
    conduit: ["ok", "sConduit", { absolute: "tConduitAbs", urethra: "tConduitUreth", reqs: "tConduitReqs" }[sg.reason]],
  }[sg.key];
  if (sg.key === "conduit" && sg.reason === "absolute") sgMap[0] = "warn";
  const sgLabel = t(sgMap[1]);
  setPill($("recPill"), sgMap[0], sgLabel); setPill($("qRec"), age ? sgMap[0] : "na", age ? sgLabel : t("fillIn"));
  $("recTxt").textContent = t(sgMap[2], { s: cb.score }) + (sg.relative ? t("tRelative") : "");

  // NSQIP
  $("sumNS").textContent = $("rk-serious").value ? dec("rk-serious") + "%" : "–";

  // Resumo
  const labelOf = (e) => e.parentElement.querySelector("[data-i18n]").textContent;
  const L = [
    `CystoRisk · ${t("tagline")}`, "",
    `${t("sumPatient")}: ${idTxt ? idTxt + " · " : ""}${age ?? "–"} ${t("years")}, ${t(female ? "female" : "male").toLowerCase()}, ${t("bmi")} ${b ? fmt(b, 1) : "–"} kg/m², ${$("ct").value}${cn ? "N+" : "N0"}`,
    `${t("sumTumor")}: ${optText("hist")} · CIS ${t($("cis").value === "1" ? "yes" : "no").toLowerCase()} · ${optText("ureth").toLowerCase()} · ${t("hydro").toLowerCase()} ${optText("hydro").toLowerCase()} · LVI ${optText("lvi").toLowerCase()}`,
    `ECOG ${ecog} · ASA ${asaR} · ${t("creatinine").replace(" (mg/dL)", "")} ${dec("cr")} mg/dL (${t("crcl").split(" ")[0]} ${cl ? fmt(cl, 0) : "–"} mL/min) · ${t("albumin").replace(" (g/dL)", "")} ${dec("alb")} g/dL`, "",
    t("sumFrailty"),
    `- G8: ${g8t}/17 (${t(g8.vulnerable ? "vulnerable" : "notVulnerable").toLowerCase()})`,
    `- MNA-SF: ${mna.total}/14 (${mnaL.toLowerCase()})`,
    `- Psoas (PMI L3): ${ps ? fmt(ps.pmi, 2) + " cm²/m² – " + pmiL.toLowerCase() : t("notMeasured")}`, "",
    `${t("sumCis")}: ${ce.eligible ? t("eligible").toLowerCase() : t("ineligible").toLowerCase() + " (" + cisWhy + ")"}`, "",
    t("sumDiv"),
    `- CABEM ${cb.score}/6${cb.score ? " (" + Object.entries(cb.criteria).filter(([, v]) => v).map(([k]) => t(cbKeys[k])).join(", ") + ")" : ""} · AA-CCI ${cci.total}`,
    `- ${t("contraTitle")}: ${abs.length ? abs.map(labelOf).join("; ") : t("none")}${rel.length ? " · " + t("relativeL") + ": " + rel.map(labelOf).join("; ") : ""}`,
    `- ${t("nbTitle")}: ${reqOk ? t("reqsOk").toLowerCase() : t("reqsN", { n: reqN, t: req.length })}`,
    `- ${t("divSuggested")}: ${sgLabel}`, "",
    `${t("sumRisk")} (ACS-NSQIP): ${t("rkSerious").replace(" (%)", "").toLowerCase()} ${dec("rk-serious")}%, ${t("rkAny").replace(" (%)", "").toLowerCase()} ${dec("rk-any")}%, ${t("rkDeath").replace(" (%)", "").toLowerCase()} ${dec("rk-death")}%, ${t("stay")} ${dec("rk-los")} ${t("days")}`,
    `${t("sumProg")} (ePrognosis – ${$("rk-epi").value || "–"}): ${t("mortality")} ${dec("rk-epr")}%`, "",
    `${t("sources")}: Bellera 2012 (G8); Kaiser 2009 (MNA-SF); Hamaguchi 2016 (psoas); Galsky 2011; Korkes 2021 (CABEM); Charlson 1987/1994; EAU MIBC; ICUD-EAU 2012; AUA/ASCO/ASTRO/SUO 2020; NCCN.`,
    t("disclaimer"),
  ];
  $("sumTxt").textContent = L.join("\n");
}

// ---------- Eventos ----------
document.addEventListener("input", (e) => { if (e.target.id !== "lang") update(); });
document.addEventListener("change", (e) => { if (e.target.id !== "lang") update(); });
document.querySelectorAll('[role="tab"]').forEach((b) => b.addEventListener("click", () => {
  document.querySelectorAll('[role="tab"]').forEach((x) => { x.setAttribute("aria-selected", x === b); $(x.dataset.p).hidden = x !== b; });
}));
$("copyBtn").addEventListener("click", () => {
  const sel = () => { const r = document.createRange(); r.selectNodeContents($("sumTxt")); const s = getSelection(); s.removeAllRanges(); s.addRange(r); $("copyMsg").textContent = t("selected"); };
  try { navigator.clipboard.writeText($("sumTxt").textContent).then(() => { $("copyMsg").textContent = t("copied"); }, sel); } catch (e) { sel(); }
});
$("resetBtn").addEventListener("click", () => loadPatient({ ecog: "0", asa: "1", ct: "cT2", cn: "0", hist: "pure", cis: "0", ureth: "0", hydro: "0", lvi: "na", "mna-d": "2" }));
const langSel = $("lang");
for (const [k, v] of Object.entries(LANGS)) langSel.add(new Option(v, k));
langSel.addEventListener("change", () => applyLang(langSel.value));

// ---------- Início ----------
let saved = null; try { saved = localStorage.getItem("cystorisk.lang"); } catch (e) { /* sem armazenamento */ }
const nav = (navigator.language || "pt").slice(0, 2);
const startLang = saved || (LANGS[nav] ? nav : "en");
langSel.value = startLang;
applyLang(startLang);
loadPatient(EXAMPLE);

if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
