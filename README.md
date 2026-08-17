# Farsi learning game

A web-based game for learning Persian (Farsi), currently at the project-foundation stage.

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
