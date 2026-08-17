# Farsi learning game

A web-based Persian (Farsi) learning game that combines Missile Command's interception loop with a Scorched Earth-style artillery map. Match incoming Persian word-shells with English shells from your ammunition bank before they hit your position.

## Game modes

- **Beginner:** phonetic pronunciation and Persian script; 4-word bank.
- **Medium:** Persian script only; 8-word bank.
- **Hard:** Persian script only; 20-word bank.

Correct answers launch a ballistic shot, build a score multiplier, and destroy the incoming word. Misses and incoming rounds permanently excavate the terrain for that game; the blasted rock fragments are Matter.js rigid bodies with gravity, rotation, collision, bounce, and settling. Words that reach your position also cost one of three armor points.

The artillery and desert village use CC BY 4.0 models downloaded from Sketchfab. Full creator links and modification notes are listed in [third-party notices](THIRD_PARTY_NOTICES.md) and in the game's 3D asset credits.

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
