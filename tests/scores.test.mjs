import test from "node:test";
import assert from "node:assert/strict";
import * as S from "../js/scores.js";

test("Cockcroft-Gault: homem 77a, 72 kg, Cr 1,1 ≈ 57", () => {
  assert.equal(Math.round(S.cockcroftGault({ age: 77, weightKg: 72, creatinine: 1.1, female: false })), 57);
  assert.equal(Math.round(S.cockcroftGault({ age: 77, weightKg: 72, creatinine: 1.1, female: true })), 49);
});
test("G8 pontos automáticos", () => {
  assert.deepEqual([S.g8AgePoints(79), S.g8AgePoints(80), S.g8AgePoints(85), S.g8AgePoints(86)], [2, 1, 1, 0]);
  assert.deepEqual([18.9, 19, 21, 23].map(S.bmiPoints), [0, 1, 2, 3]);
});
test("G8 ≤ 14 vulnerável", () => {
  assert.equal(S.g8({ A: 2, B: 3, C: 2, E: 2, F: 3, H: 1, P: 2, ageItem: 2 }).total, 17);
  assert.equal(S.g8({ A: 2, B: 2, C: 2, E: 2, F: 3, H: 0, P: 2, ageItem: 1 }).vulnerable, true);
  assert.equal(S.g8({ A: 2, B: 3, C: 2, E: 2, F: 3, H: 1, P: 0.5, ageItem: 2 }).total, 15.5);
});
test("MNA-SF faixas", () => {
  assert.equal(S.mnaSF({ A: 2, B: 3, C: 2, D: 2, E: 2, F: 3 }).status, "normal");
  assert.equal(S.mnaSF({ A: 1, B: 1, C: 2, D: 2, E: 2, F: 3 }).status, "risk");
  assert.equal(S.mnaSF({ A: 0, B: 0, C: 2, D: 0, E: 2, F: 3 }).status, "malnourished");
});
test("Psoas Hamaguchi", () => {
  const r = S.psoasIndex({ rightCm2: 8.1, leftCm2: 8.6, heightM: 1.7, female: false });
  assert.equal(r.pmi.toFixed(2), "5.78"); assert.equal(r.low, true);
  assert.equal(S.psoasIndex({ rightCm2: 6, leftCm2: 6, heightM: 1.6, female: true }).low, false);
});
test("AA-CCI sem contar o câncer de bexiga", () => {
  assert.deepEqual(S.ageAdjustedCharlson(77, ["mi", "copd", "dm"]), { total: 6, agePts: 3 });
  assert.equal(S.ageAdjustedCharlson(65, []).total, 2);
});
test("Cisplatina: Galsky", () => {
  assert.equal(S.cisplatinEligibility({ ecog: 1, crcl: 57 }).eligible, false);
  assert.equal(S.cisplatinEligibility({ ecog: 1, crcl: 60 }).eligible, true);
  assert.equal(S.cisplatinEligibility({ ecog: 2, crcl: 80 }).eligible, false);
});
test("CABEM faixas", () => {
  const base = { ecog: 1, asa: 2, aaCci: 2, age: 65, mnaSf: 12, nodePositive: false };
  assert.equal(S.cabem(base).band, "intestinal");
  assert.equal(S.cabem({ ...base, asa: 3, age: 77 }).band, "ureterostomy");
  assert.equal(S.cabem({ ...base, asa: 3, age: 77, aaCci: 6, ecog: 2 }).band, "avoid");
});
test("Sugestão de derivação", () => {
  const b = { cabemScore: 1, absoluteContra: false, relativeContra: false, neobladderReqsMet: true, urethraInvolved: false };
  assert.equal(S.diversionSuggestion(b).key, "neobladder");
  assert.equal(S.diversionSuggestion({ ...b, urethraInvolved: true }).key, "conduit");
  assert.equal(S.diversionSuggestion({ ...b, absoluteContra: true }).key, "conduit");
  assert.equal(S.diversionSuggestion({ ...b, neobladderReqsMet: false }).key, "conduit");
  assert.equal(S.diversionSuggestion({ ...b, cabemScore: 2 }).key, "ureterostomy");
  assert.equal(S.diversionSuggestion({ ...b, cabemScore: 4 }).key, "avoid");
});
test("Idade a partir da data de nascimento", () => {
  const ref = new Date(2026, 10, 26); // 26/11/2026
  assert.equal(S.ageFromBirthDate("1949-11-26", ref), 77); // aniversário hoje
  assert.equal(S.ageFromBirthDate("1949-11-27", ref), 76); // amanhã
  assert.equal(S.ageFromBirthDate("1952-02-29", ref), 74);
  assert.equal(S.ageFromBirthDate("2027-01-01", ref), null); // futuro
  assert.equal(S.ageFromBirthDate("1950-02-30", ref), null); // data inexistente
  assert.equal(S.ageFromBirthDate("", ref), null);
});
