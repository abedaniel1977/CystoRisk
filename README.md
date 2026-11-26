# CystoRisk

Preoperative decision support for radical cystectomy, for urologists and oncologists.
Apoio à decisão pré-operatória na cistectomia radical, para urologistas e oncologistas.

> **Not a medical device.** CystoRisk supports a shared decision and does not replace the multidisciplinary team's judgement.

## What it does

| Step | Tools | Source |
|---|---|---|
| Patient | Name and date of birth (optional; age is then calculated), age, sex, weight, height, creatinine, albumin, ECOG, ASA, cT/cN, histology, CIS, prostatic urethra/bladder neck, hydronephrosis, LVI. BMI and Cockcroft-Gault CrCl are calculated. | Cockcroft & Gault, *Nephron* 1976 |
| Frailty | G8 (≤ 14 vulnerable), MNA-SF, psoas muscle index at L3 | Bellera, *Ann Oncol* 2012 · Kaiser, *J Nutr Health Aging* 2009 · Hamaguchi, *Nutrition* 2016 |
| Cisplatin | Galsky ineligibility criteria (ECOG ≥ 2, CrCl < 60, hearing loss ≥ 2, neuropathy ≥ 2, NYHA ≥ III) | Galsky, *J Clin Oncol* 2011 · EAU · AUA/ASCO/ASTRO/SUO |
| Urinary diversion | CABEM score with age-adjusted Charlson (current bladder cancer not counted), contraindications to continent diversion, neobladder requirements, combined suggestion | Korkes, *JCO Glob Oncol* 2021 · Charlson 1987/1994 · EAU · Hautmann (ICUD-EAU), *Eur Urol* 2013 · NCCN |
| Surgical risk | Links to ACS-NSQIP and ePrognosis; results are entered by hand (their models are not public) | riskcalculator.facs.org · eprognosis.ucsf.edu |
| Summary | One-page text for the medical record or the tumour board, with a copy button | |

Languages: Português (Brasil), English, Español.
No patient data is stored or sent anywhere: everything, including the patient's name and date of birth, stays in memory in the browser tab and is cleared when the page is closed or reloaded. Only the chosen language is remembered.

## Run locally

It is a static site with no build step.

```sh
npm start        # serves on http://localhost:8000
npm test         # unit tests for every score and for the translations
```

## Publish

Enable **GitHub Pages** (Settings → Pages → Deploy from branch → `main` / root). The app is then installable on phones from the browser ("Add to Home screen") and works offline after the first visit.

## Structure

- `js/scores.js` – all clinical logic as pure functions, each citing its source. Tested in `tests/scores.test.mjs`.
- `js/i18n.js` – interface text in pt, en and es.
- `js/app.js` – interface.
- `sw.js`, `manifest.webmanifest`, `icons/` – installable app (PWA).

## Licensing notes

- MNA® is a trademark of Société des Produits Nestlé S.A. Permission for use in software should be requested at mna-elderly.com.
- CABEM was published under CC BY-NC-ND 4.0 (Korkes et al., 2021).
