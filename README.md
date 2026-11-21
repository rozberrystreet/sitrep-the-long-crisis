# SITREP: The Long Crisis

A personalised geopolitical life simulation.

A text-first React and TypeScript game about one household living through a fictional geopolitical crisis. In the first edition, rival customs offices delay shipping through the invented Orison Strait. Seven dispatches follow the consequences from the anchorage to the evening meal.

## Technology

- React
- TypeScript
- Vite

## Design

Signal Print — minimalist, text-first, accessible.

## Play

Choose a call sign, home city, occupation, household and cash reserve. Read a dispatch and its field note, then decide whether to buy supplies, take a shift or share a delivery. The evening ledger explains every change. At the end of day seven, open the decision archive to review the week.

Use the same seed to compare households under the same world conditions. Use the same profile, seed and choices to reproduce an entire run. The app saves after each decision and after advancing past its receipt.

## Development

OpenAI Codex is the primary development environment.

Use Node.js 24 with npm. From the repository root:

```sh
npm install
npm run dev
```

Vite prints the local URL. The production build writes static assets to `dist/`. To run all verification:

```sh
npx playwright install chromium
npm run verify
```

On Linux CI, install Chromium system dependencies using `npx playwright install --with-deps chromium`. Run `npm test` for engine and save tests, `npm run build` for the TypeScript check and Vite bundle, and `npm run test:ui` after the build for Playwright tests served from the production output. The PR workflow runs those checks on Ubuntu.

## First-edition limits

- One fictional maritime scenario, four home cities, three occupations and seven authored dispatches. All places of residence are real. Events, prices, exposure weights and game credits are invented.
- Decisions affect the household. Players experience the same seeded negotiations and freight conditions when comparing decisions. The model abstracts meals and daily discretionary cash from other living costs.
- One local save per browser origin, including the closing edition. Clearing site data erases it. Device storage failures can limit play to the current tab. The game uses local text and assets and requires no account or API key.
- Keyboard navigation, native controls and reduced motion are implemented. Desktop and mobile viewport tests target Chromium. Safari, Firefox and assistive-technology testing remain outstanding.

See [architecture notes](docs/architecture.md) for the replay contract and save lifecycle.
