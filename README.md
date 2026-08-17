# Farsi learning game

A web-based Persian (Farsi) learning game with top-down word-missile interception and fully destructible Scorched Earth-style terrain. Match incoming Persian missiles with English words from your ammunition bank before they excavate the ground.

## Game modes

- **Beginner:** phonetic pronunciation, Latin-letter spelling, and Persian script; 4-word bank.
- **Medium:** Latin-letter spelling and Persian script; 8-word bank.
- **Hard:** Persian script only; 20-word bank.

Correct answers launch an interceptor, build a score multiplier, and destroy the incoming word. Incoming missiles converge on and permanently excavate the terrain above the word bank; the blasted rock fragments are Matter.js rigid bodies with gravity, rotation, collision, bounce, and settling. The bank is safe while that cover remains. Once repeated impacts open a deep enough crater, the bank becomes exposed and the next missile through ends the run.

The deformable earth uses Poly Haven's CC0 Rock Ground PBR texture pack, and the sky uses a web-optimized CC0 Poly Haven panorama. Source details are listed in [third-party notices](THIRD_PARTY_NOTICES.md).

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
