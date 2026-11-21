# Orison Strait · Living World edition

## Replay boundary

The seven-day first edition is still the default on the setup form. Its simulation code, dispatches and saved decision vocabulary belong to v1. The compatibility fixture hashes the complete reference replay, including receipts, from merged commit `7260c17`. The new game selects save format 2, ruleset `living-world/1`, scenario `orison-strait`, revision 1. A future change to a formula or the event calendar needs a new ruleset or pack revision and a decoder that can still select the old one.

## From the strait to the kitchen

One daily tick takes a previous settled state, one decision and a scenario pack. Day zero holds the starting balances. `morning` projects the next briefing without advancing the saved game. `tick` computes that same opening and settles the decision. The state contains world conditions, four regional markets, the player's household, pending commitments and a dated history of active events, decisions and causal records.

1. The Strait Customs Board, Orison Carriers Guild and Harbour Exchange publish six authored fictional events across fourteen days. An event declares its version, source, severity, first day, duration, queue effect and route-specific changes in imports and fuel. Dates are inclusive through `starts + duration - 1`. More than one event can be active. Actors follow the authored calendar.
2. Ordinary clearance removes two queue points. Events and a seeded daily sailing window add or remove points. The queue stays in the range 0–50. A 32-bit FNV-style hash of the ruleset channel, day and seed supplies the sailing variation. Household decisions cannot perturb another market's random sequence.
3. Each depot starts with 20 stock units. In the Pacific corridor, Auckland has exposure 3 and Melbourne 2. In the Atlantic corridor, Halifax has exposure 2 and Bristol 1. Inventory carries forward with two net arrivals, event import adjustments and a loss of `floor(queue × exposure / 16)`, bounded to 0–30. These are invented exposure weights. The day-five diversion takes stock away from one corridor and sends it to the other.
4. A portion costs the city's base price plus the day's fuel charge plus `floor((30 − inventory) / 5)`. Local labour demand is `1 + floor(inventory / 6)`. Ordinary daily income equals the occupation's base allowance plus labour demand.
5. Scheduled commitments settle against that morning's market and household trust before ordinary pay and the player's decision. The evening meal uses the pantry first, then buys whole portions at the local price. An unmet portion is recorded and costs one energy. A full meal restores one energy.

Credits, portions and index points are integers. Cash and pantry stock cannot go negative. Energy and trust range from 0 to 10. Depot stock units represent regional availability and use a different scale from individual pantry portions. The model abstracts rent, taxes and the rest of a household budget.

| Decision | Today | Later |
| --- | --- | --- |
| Dock shift | Occupation-specific pay plus twice local labour demand, costs 2 energy | On day +2, demand of 3 or more pays 12 credits. Lower demand pays zero and produces a receipt. |
| Reserve a crate | Pay twice today's portion price. Requires cash on hand. | Six pantry portions arrive on day +2, even if spot prices change. |
| Food rota | Gain one portion and two trust, spend two energy | On day +3 receive four portions with trust of at least 4, otherwise one. |
| Recovery day | Restore up to three energy and keep ordinary pay | Can reopen a shift or rota option when energy was too low. |

Shift and rota work require at least two energy. The last days display the immediate-only terms for work. Crate reservations close when delivery would fall outside the campaign. The closing edition distinguishes food shortfalls, strong community ties, a cash reserve and a narrow finish, in that order. These endings describe household circumstances.

## Reading a receipt

Each fact and numerical posting has a stable day-local ID. Numerical postings record the metric, opening value, applied closing value and parent IDs. Carried quantities link to their previous posting. A maturing commitment also points to the original decision. For example, a pantry delivery on day three can be traced to the day-one reservation. A grocery debit links to the local portion price, the depot stock, the fuel charge and the originating events. The offline reader follows recorded edges. It has no write access and computes no balances.

## Save and recovery

Both editions share the existing IndexedDB database, object store and single current-issue slot. The new reader dispatches existing v1 records to their original decoder and writes nothing on load. There is no conversion of seven-day decisions into fourteen-day decisions. V2 persists only the versioned identity, seed, profile, ordered choices and receipt position. It checks those fields and replays costs, energy constraints and deadlines before accepting a write. Pending effects and ledgers are rebuilt. A failed transaction leaves the previous record available. Competing tabs compare and replace the exact raw record in one transaction. Unreadable or future revisions stay in storage until the player confirms replacement.

## Web and native boundaries

The TypeScript simulation under `src/simulation/v2` has no React, DOM, IndexedDB, clock, network or platform dependency. The production web build precaches its HTML, JavaScript and CSS after the first online visit. Once the service worker controls the page, a reload can resume offline on the same origin. Development mode uses the Vite server. Clearing site data or browser eviction can remove both saves and cached assets.

A future Capacitor shell can package the web build locally and reuse the engine. Keep the origin stable across app updates, or explicitly migrate the encoded record into a native store with atomic compare-and-replace semantics. An origin change or a new installation cannot discover another origin’s save automatically. Native release work includes real-device cold starts, interruption during a write, WebView eviction, VoiceOver/TalkBack, safe areas and large text on iOS and Android. This milestone ships a web client.

## Verification and limits

Run `npm ci`, `npm test`, `npm run build`, `npx playwright install chromium`, then `npm run test:ui` on Node 24. The suite covers the v1 reference, a pinned 14-day v2 route, 48 seeded campaign traversals, every posting and causal edge on those traversals, both conditional payout branches, save rejection and transactional recovery. Browser cases exercise the production build on desktop and mobile Chromium, including an offline reload, all fourteen decisions and the archive.

There is one playable v2 scenario. A synthetic 30-day fixture exercises the engine's pack length. The release loader recognises only shipped scenario revisions. The regional markets are stylised and the actors are fictional institutions. Further calibration would require playtesting across household profiles. Native packaging, cross-device saves and other browser engines remain unverified.
