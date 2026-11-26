// CystoRisk – lógica clínica pura (sem DOM). Cada função cita sua fonte.
// Todas as funções recebem números/booleanos e devolvem objetos simples.

/** IMC (kg/m²). */
export function bmi(weightKg, heightM) {
  if (!(weightKg > 0) || !(heightM > 0)) return null;
  return weightKg / (heightM * heightM);
}

/** Clearance de creatinina, Cockcroft DW, Gault MH. Nephron 1976;16:31–41. */
export function cockcroftGault({ age, weightKg, creatinine, female }) {
  if (!(age > 0) || !(weightKg > 0) || !(creatinine > 0)) return null;
  return ((140 - age) * weightKg) / (72 * creatinine) * (female ? 0.85 : 1);
}

/** Pontos automáticos do G8 a partir da idade e do IMC. Bellera CA et al. Ann Oncol 2012;23:2166–72. */
/** Idade em anos completos a partir da data de nascimento ("AAAA-MM-DD"). Retorna null se inválida ou futura. */
export function ageFromBirthDate(birth, today = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birth || "");
  if (!m) return null;
  const y = +m[1], mo = +m[2], d = +m[3];
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) return null;
  let age = today.getFullYear() - y;
  if (today.getMonth() < mo - 1 || (today.getMonth() === mo - 1 && today.getDate() < d)) age--;
  return age >= 0 && age <= 130 ? age : null;
}
export function g8AgePoints(age) { return age > 85 ? 0 : age >= 80 ? 1 : 2; }
export function bmiPoints(b) { return b == null ? null : b < 19 ? 0 : b < 21 ? 1 : b < 23 ? 2 : 3; }

/** G8: soma de 8 itens (0–17). ≤ 14 = vulnerável. */
export function g8({ A, B, C, E, F, H, P, ageItem }) {
  const total = A + B + C + E + F + H + P + ageItem;
  return { total, vulnerable: total <= 14 };
}

/** MNA-SF: Kaiser MJ et al. J Nutr Health Aging 2009;13:782–8. 12–14 normal, 8–11 risco, 0–7 desnutrido. */
export function mnaSF({ A, B, C, D, E, F }) {
  const total = A + B + C + D + E + F;
  return { total, status: total >= 12 ? "normal" : total >= 8 ? "risk" : "malnourished" };
}

/** Índice de massa do psoas em L3. Cortes padrão: Hamaguchi Y et al. Nutrition 2016;32:1200–5. */
export const PSOAS_CUTOFFS_HAMAGUCHI = { male: 6.36, female: 3.92 };
export function psoasIndex({ rightCm2, leftCm2, heightM, female, cutoffs = PSOAS_CUTOFFS_HAMAGUCHI }) {
  const area = (rightCm2 || 0) + (leftCm2 || 0);
  if (!(area > 0) || !(heightM > 0)) return null;
  const pmi = area / (heightM * heightM);
  const cutoff = female ? cutoffs.female : cutoffs.male;
  return { pmi, cutoff, low: pmi < cutoff };
}

/** Charlson ajustado por idade. Charlson ME et al. J Chronic Dis 1987;40:373–83; J Clin Epidemiol 1994;47:1245–51.
 *  O câncer de bexiga atual NÃO é contado (decisão clínica do autor do projeto). */
export const CHARLSON_ITEMS = [
  ["mi", 1], ["chf", 1], ["pvd", 1], ["cvd", 1], ["dementia", 1], ["copd", 1], ["ctd", 1], ["ulcer", 1],
  ["mildLiver", 1], ["dm", 1], ["hemiplegia", 2], ["renal", 2], ["dmEndOrgan", 2], ["otherTumor", 2],
  ["severeLiver", 3], ["metastatic", 6], ["aids", 6],
];
export function charlsonAgePoints(age) { return age >= 80 ? 4 : age >= 70 ? 3 : age >= 60 ? 2 : age >= 50 ? 1 : 0; }
export function ageAdjustedCharlson(age, present /* Set ou array de chaves */) {
  const set = new Set(present);
  const agePts = charlsonAgePoints(age);
  const total = agePts + CHARLSON_ITEMS.reduce((a, [k, p]) => a + (set.has(k) ? p : 0), 0);
  return { total, agePts };
}

/** Elegibilidade para cisplatina. Galsky MD et al. J Clin Oncol 2011;29:2432–8. */
export function cisplatinEligibility({ ecog, crcl, hearingLoss, neuropathy, heartFailure }) {
  const criteria = {
    ecog: ecog >= 2,
    crcl: crcl != null && crcl < 60,
    hearing: !!hearingLoss,
    neuropathy: !!neuropathy,
    heartFailure: !!heartFailure,
  };
  return { criteria, eligible: !Object.values(criteria).some(Boolean) };
}

/** CABEM Score. Korkes F et al. JCO Glob Oncol 2021;7:1547–55, Tabela 2.
 *  1 ponto por critério desfavorável. 0–1 derivação intestinal; 2–3 ureterostomia cutânea; 4–6 evitar cistectomia. */
export function cabem({ ecog, asa, aaCci, age, mnaSf, nodePositive }) {
  const criteria = {
    ecog: ecog >= 2,
    asa: asa >= 3,
    aaCci: aaCci >= 4,
    age: age >= 75,
    mna: mnaSf < 8,
    nodes: !!nodePositive,
  };
  const score = Object.values(criteria).filter(Boolean).length;
  const band = score <= 1 ? "intestinal" : score <= 3 ? "ureterostomy" : "avoid";
  return { criteria, score, band };
}

/** Sugestão integrada de derivação.
 *  Contraindicações à derivação continente: EAU MIBC; Hautmann RE et al. Eur Urol 2013;63:67–80.
 *  Requisitos de neobexiga: ICUD-EAU 2012. Acometimento de estroma prostático ou colo vesical bloqueia a neobexiga. */
export function diversionSuggestion({ cabemScore, absoluteContra, relativeContra, neobladderReqsMet, urethraInvolved }) {
  if (cabemScore >= 4) return { key: "avoid" };
  if (cabemScore >= 2) return { key: "ureterostomy" };
  if (absoluteContra) return { key: "conduit", reason: "absolute" };
  if (urethraInvolved) return { key: "conduit", reason: "urethra" };
  if (neobladderReqsMet) return { key: "neobladder", relative: !!relativeContra };
  return { key: "conduit", reason: "reqs" };
}
