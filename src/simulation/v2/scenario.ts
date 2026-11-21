import type { ScenarioPack, WorldEvent } from './types.ts'

export const actors = {
  customs: 'Strait Customs Board',
  carriers: 'Orison Carriers Guild',
  cooperative: 'Harbour Exchange',
} as const

const events: WorldEvent[] = [
  {
    version: 1,
    id: 'second-manifest',
    fictional: true,
    source: 'customs',
    severity: 'strain',
    starts: 1,
    duration: 4,
    headline: 'A second stamp at the narrows.',
    dispatch:
      'Inspectors now require a second manifest before a vessel can cross. Importers on the Pacific route have little stock between ships.',
    queue: 7,
    effects: [{ corridor: 'pacific', imports: -2, fuel: 1 }],
  },
  {
    version: 1,
    id: 'bunker-surcharge',
    fictional: true,
    source: 'carriers',
    severity: 'strain',
    starts: 3,
    duration: 4,
    headline: 'The fuel bill comes ashore.',
    dispatch:
      'Ships are burning fuel while they wait. Carriers pass part of the bill to shops, even on routes with full warehouses.',
    queue: 2,
    effects: [
      { corridor: 'pacific', imports: 0, fuel: 3 },
      { corridor: 'atlantic', imports: 0, fuel: 2 },
    ],
  },
  {
    version: 1,
    id: 'diversion',
    fictional: true,
    source: 'carriers',
    severity: 'strain',
    starts: 5,
    duration: 3,
    headline: 'A convoy takes the long way.',
    dispatch:
      'Captains divert cargo towards Atlantic depots. One route gains deliveries while grocers on the other wait for the next sailing.',
    queue: 1,
    effects: [
      { corridor: 'atlantic', imports: 3, fuel: 1 },
      { corridor: 'pacific', imports: -2, fuel: 1 },
    ],
  },
  {
    version: 1,
    id: 'night-window',
    fictional: true,
    source: 'customs',
    severity: 'relief',
    starts: 8,
    duration: 4,
    headline: 'The night crossing opens.',
    dispatch:
      'An overnight clearance window allows ships to move again. Lower freight queues reach household prices gradually as stock is rebuilt.',
    queue: -7,
    effects: [{ corridor: 'pacific', imports: 3, fuel: 0 }],
  },
  {
    version: 1,
    id: 'shared-depot',
    fictional: true,
    source: 'cooperative',
    severity: 'relief',
    starts: 10,
    duration: 3,
    headline: 'Two depots share a loading dock.',
    dispatch:
      'The Harbour Exchange pools delivery space. Local shelves refill as the extra consignments reach their markets.',
    queue: 0,
    effects: [
      { corridor: 'atlantic', imports: 2, fuel: -1 },
      { corridor: 'pacific', imports: 1, fuel: -1 },
    ],
  },
  {
    version: 1,
    id: 'single-manifest',
    fictional: true,
    source: 'customs',
    severity: 'relief',
    starts: 12,
    duration: 3,
    headline: 'One manifest for both shores.',
    dispatch:
      'A single clearance paper replaces the temporary checks. Ships returning to regular sailings find some households still paying for the first week.',
    queue: -5,
    effects: [
      { corridor: 'pacific', imports: 2, fuel: -1 },
      { corridor: 'atlantic', imports: 1, fuel: -1 },
    ],
  },
]

export const orison: ScenarioPack = { id: 'orison-strait', revision: 1, days: 14, events }
