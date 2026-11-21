# SITREP engineering guide

SITREP is a text-first household simulation of fictional international crises. Inspect the current source, tests and save schema before changing an edition.

- Keep deterministic rules in `src/simulation/engine.ts`. Pass state and choices explicitly. Keep browser APIs, wall-clock time, randomness from the host and narration outside the rules.
- Treat a released save version as a replay contract. A rule change that alters historical results needs a versioned decoder or migration and a reference replay test.
- Derive displayed costs and receipts from the engine. Label fictional reporting throughout the game.
- Use Signal Print’s paper, ink and red palette, editorial headings, monospaced data and reduced-motion support. Keep controls labelled and reachable by keyboard.
- Use Node 24. Run the unit suite, production build and browser suite described in README.md. Report which commands ran successfully and any blocked checks.
