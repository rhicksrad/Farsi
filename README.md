# Farsi learning game

A web-based Persian (Farsi) learning game inspired by classic artillery defense games. Match falling Persian words with English words from your ammunition bank before they reach the city.

## Game modes

- **Beginner:** phonetic pronunciation, English meaning, and Persian script; 4-word bank.
- **Medium:** English meaning and Persian script; 8-word bank.
- **Hard:** Persian script only; 20-word bank.

Correct answers launch a shot, build a score multiplier, and destroy the incoming word. Wrong answers cost points, and words that reach the ground cost one of three city lives.

## Local development

```bash
npm install
npm run dev
```

Useful commands:

- `npm run build` creates the production site in `dist/`.
- `npm run check` validates the generated dictionary and production build.
- `npm run data:import` regenerates the dictionary assets from the pinned upstream source.

## Dictionary

The starter dictionary contains English headwords and Persian translation variants derived from the Apache-2.0 `generic-13` data in EnglishToPersianDictionaries. See [the source assessment](docs/dictionary-sources.md) and [third-party notices](THIRD_PARTY_NOTICES.md) for provenance, licensing, and quality limitations.

## Deployment

Pull requests and pushes to `main` run CI. Pushes to `main` also build the Vite app and deploy `dist/` to GitHub Pages through the official Pages Actions workflow.
