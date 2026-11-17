# olamdev_ana203

Offline quiz app for **ANA 203 - General Embryology** (Lead City University, Dept. of Anatomy).
Developed by Olamdev.

## Files
`index.html`, `app.js`, `questions.js`, `style.css`, `manifest.json`, `sw.js`, `README.md` - no build step, no npm, no backend.

## How to run
The app uses ES modules and a service worker, so browsers need it served over `http://` or `https://`
(Chrome blocks module scripts and service workers on `file://`).

- Quick local test: in this folder run `python3 -m http.server 8000`, then open `http://localhost:8000`.
- Phone use: upload the 7 files to any free static host (GitHub Pages, Netlify Drop, Cloudflare Pages), open the link once while online, then use "Add to Home Screen" / "Install app". After that it works fully offline.

## Features
- Home: Start Quiz, Topics, Progress, Settings
- 20 / 50 / 100 / All questions, optionally by topic; questions and options shuffled every time
- One question per page, A-D options, Next/Previous, timer, progress bar, question palette
- Instant feedback with explanation (or at the end - Settings)
- Result: score, percentage, pass/fail, full review with explanations
- Progress (attempts, best, average, history) in localStorage
- Light / Dark mode, optional time limit, adjustable pass mark (default 50%)

## Question bank
Over 600 MCQs in 17 topics covering the ANA 203 course outline, the Gametogenesis lecture slides and the tutorial questions
(germ cells, mitosis/meiosis, spermatogenesis, oogenesis, menstrual cycle, fertilization, cleavage, implantation, sex determination,
2nd week, gastrulation, neurulation, germ-layer derivatives, placenta and membranes, fetal period/twinning/parturition, teratology).

Format in `questions.js`:
`{ q, options: [A,B,C,D], answer: 0-3, explanation, topic }`

## Updating
If you change any file, bump `CACHE` in `sw.js` (e.g. `olamdev_ana203_v2`) so phones pick up the new version.
