import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { STRINGS } from "../js/i18n.js";

test("pt, en e es têm as mesmas chaves", () => {
  const pt = Object.keys(STRINGS.pt).sort();
  for (const l of ["en", "es"]) assert.deepEqual(Object.keys(STRINGS[l]).sort(), pt, l);
});
test("toda chave data-i18n do HTML existe", () => {
  const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
  for (const [, k] of html.matchAll(/data-i18n="([^"]+)"/g)) assert.ok(k in STRINGS.pt, k);
});
