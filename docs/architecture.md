# Architecture

The application selects a decoder by save version. The sections below describe the first edition. See [Living World](living-world.md) for the second edition.

## One turn

The app loads a v1 save, replays its decisions, and renders either the morning report, its most recent evening receipt, or the closing edition. A decision moves the household forward exactly one turn. Reading the next dispatch only changes the view. Reloading the evening ledger never settles a day twice.

| Module | Responsibility |
| --- | --- |
| `simulation/engine.ts` | Pure initialisation, seeded world transitions, local terms, eligibility, household settlement and signed ledger entries |
| `simulation/dispatch.ts` | Authored fiction and education, with contextual copy selected from computed conditions |
| `save.ts` | V1 schema validation and deterministic replay |
| `storage.ts` | Shared transactional IndexedDB reads and compare-and-replace writes |
| `ui/` | Player dossier, fictional route chart, Daily SITREP, receipts and end-of-week archive |
| `main.tsx` | Async loading, transition guards, recovery, reset confirmation and focus management |

## Ruleset v1

The generator hashes the seed, game day and channel with integer multiplication. Negotiations evolve from the previous day. Fresh delays add to freight pressure while progress in talks offsets them. The engine bounds both indices. Pressure influences the price per portion in steps of twelve points. Each city adds a fixed exposure weight.

The engine prices the choice against the opening account. A pantry box buys four portions for the price of three. A shift adds cash according to occupation and opening energy. Shared delivery brings two portions and increases neighbourhood ties, which reduce future delivery fees. A cash shortfall on a pooled delivery costs extra effort.

At dinner, the household consumes stored portions, purchases any affordable shortfall, then recovers energy after a full meal or loses energy for missing portions. Cash and supplies stay nonnegative. Energy and ties stay between zero and ten. The ledger records the applied change after bounds, so each closing balance reconciles with its opening balance.

## Persistence

IndexedDB database `sitrep-issues` stores one JSON string in `desk/current`. The string contains schema version, seed, validated profile, ordered action IDs and evening-review flag. Replaying at most seven turns rebuilds world state, accounts and receipts. Version one rejects an unknown version, an unaffordable historical action or an invalid field.

A write reads and compares the previously loaded record in the same read/write transaction that replaces it. Stale tabs get a reload prompt. A failed commit leaves the displayed choice available to retry. An unreadable save remains intact until the player explicitly replaces it. If the initial read fails, the app labels the session temporary.

## Signal Print

Warm paper and near-black ink carry the reading hierarchy. Red marks the fictional edition, inspection anchorage and input focus. Serif headlines and monospaced issue data distinguish story from model values. The map is an original vector schematic of fictional waters. The desk stacks into one column on small screens. Reduced-motion preferences disable the edition transition.

## Verification boundaries

Reference values pin the v1 seven-day trajectory. A bounded path sweep checks every affordable decision sequence from one starting state for immutable inputs, legal account ranges and exact ledger reconciliation. Round-trip and rejection tests exercise the save contract. Browser tests cover keyboard onboarding, reload at settlement and completion, conflicting tabs, mobile layout, reset confirmation and damaged-save recovery.
