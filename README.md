# Farsi learning game

A web-based Persian (Farsi) learning game with top-down word-missile interception and fully destructible Scorched Earth-style terrain. Match incoming Persian missiles with English words from your ammunition bank before they excavate the ground.

## Game modes

- **Beginner:** phonetic pronunciation, Latin-letter spelling, and Persian script; 4-word bank; essential conversational curriculum.
- **Medium:** Latin-letter spelling and Persian script; 8-word bank; adds everyday vocabulary.
- **Hard:** Persian script only; 20-word bank; adds broader high-frequency vocabulary.

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
- `npm run data:curriculum` regenerates the reviewed lesson curriculum from its frequency source.

## Dictionary

Scored lessons use a 415-word, three-level curriculum selected from a learner frequency dictionary and supplemented with reviewed conversational essentials. It is shuffled without replacement on every play. The much larger Apache-2.0 `generic-13` dataset remains available only as a reference and never supplies scored answers or distractors. See [the source assessment](docs/dictionary-sources.md) and [third-party notices](THIRD_PARTY_NOTICES.md) for provenance and licensing.

## Deployment

Pull requests and pushes to `main` run CI. Pushes to `main` also build the Vite app and deploy `dist/` to GitHub Pages through the official Pages Actions workflow.

## Online leaderboard (Supabase)

The game includes an arcade-style, three-character top-10 scoreboard. Without configuration it works locally in the browser. To share scores between players:

1. Create a Supabase project and run `supabase/migrations/20260819000000_create_leaderboard.sql` in the SQL editor.
2. Copy `.env.example` to `.env` and add the project URL and publishable/anon key.
3. Add the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` values to the deployment environment.

Only the public anon key belongs in the browser; never use a service-role key here.
