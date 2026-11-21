import { cities, terms } from './engine.ts'
import type { Action, State } from './engine.ts'

// Authored fiction. This module reads the rules but never modifies them.
export const dispatches = [
  {
    headline: 'A queue forms at the narrows.',
    story:
      'At dawn, customs crews on opposite shores of the Orison Strait start inspecting the same cargo twice. By lunch, the first ferry has missed its tide.',
    concept: 'Chokepoints',
    lesson:
      'When many journeys share one narrow passage, a short delay there can affect deliveries far beyond the coast.',
  },
  {
    headline: 'The timetable slips inland.',
    story:
      'A coastbound train leaves with empty wagons. Its operator can move the train today or wait for yesterday’s ship. The old timetable allows for neither.',
    concept: 'Lead time',
    lesson:
      'An order spends time travelling and waiting. Shops can run low even while the goods they bought are on the way.',
  },
  {
    headline: 'The second invoice arrives.',
    story:
      'A wholesaler opens two envelopes. The first is for the cargo. The second covers the extra days it spent at anchor. Shopkeepers wait for the new list.',
    concept: 'Cost pass-through',
    lesson:
      'Suppliers may absorb a higher cost or pass part of it to buyers. Here, freight pressure raises the local price in steps.',
  },
  {
    headline: 'A longer way round.',
    story:
      'A freighter takes the outer passage overnight. The detour gives its crew a dependable arrival window, at the cost of another day at sea.',
    concept: 'Substitution',
    lesson:
      'A substitute route can keep goods moving. Its extra distance can keep costs high even as deliveries resume.',
  },
  {
    headline: 'Neighbours redraw the list.',
    story:
      'A hand-written delivery roster goes up in the hall. Six small orders will fit in one van. Someone still has to collect the keys and do the driving.',
    concept: 'Collective action',
    lesson:
      'Pooling orders spreads the work. In this model, stronger neighbourhood ties reduce the cash contribution on later shared deliveries.',
  },
  {
    headline: 'A pilot crosses the table.',
    story:
      'Delegates from both shores lay a joint inspection form on the table. Outside, dispatchers still have to decide which of the waiting loads will move first.',
    concept: 'Negotiation lag',
    lesson:
      'A policy agreement takes time to change a queue. In this model, progress in talks eases new pressure while yesterday’s backlog carries forward.',
  },
  {
    headline: 'Seven days reach the ledger.',
    story:
      'The weekly manifests arrive with gaps and pencilled corrections. At home the same week is recorded in smaller units. A shift worked. A shelf filled. A favour owed.',
    concept: 'Buffers',
    lesson:
      'Cash, stored goods and social ties absorb different kinds of disruption. A decision can strengthen one buffer while drawing down another.',
  },
] as const
export const actionNames: Record<Action, string> = {
  stock: 'Buy a pantry box',
  earn: 'Take an extra shift',
  pool: 'Share a delivery',
}
export function options(state: State): Record<Action, string> {
  const { price, earnings, poolFee } = terms(state)
  return {
    stock: 'Pay ' + price * 3 + ' credits for four portions. Extras carry over.',
    earn: 'Earn ' + earnings + ' credits and spend two energy before dinner.',
    pool:
      'Bring home two portions for up to ' + poolFee + ' credits. Build ties and contribute time.',
  }
}
export function localBrief(state: State) {
  const { city, role, household } = state.profile
  const { price, need } = terms(state)
  return (
    'In ' +
    city +
    ', ' +
    cities[city].country +
    ', the local price is ' +
    price +
    ' credits per portion. ' +
    (household === 'With dependants'
      ? 'With dependants at home, you need '
      : 'Your household needs ') +
    need +
    ' portions tonight. ' +
    {
      Student: 'You can fit a paid campus shift around classes.',
      'Shift worker': 'Your supervisor is offering another shift.',
      'Office worker': 'Your office needs evening cover.',
    }[role]
  )
}

export function worldBrief(state: State) {
  const { pressure, talks } = state.world
  const queue =
    pressure >= 65
      ? 'At the anchorage, ships wait through a second round of sailings. Local buyers are bidding for space on the next departure.'
      : pressure >= 40
      ? 'Ships are stacking up faster than inspectors can clear them. Dispatchers have begun pricing the extra wait into freight contracts.'
      : 'Ships are still moving between inspections. Wholesalers can cover most of the delay with goods already ashore.'
  const negotiation =
    talks >= 7
      ? 'Delegates have agreed on much of a common inspection procedure.'
      : talks >= 4
      ? 'Both delegations are exchanging proposals. Separate inspections continue.'
      : 'The port authorities are still working from separate lists.'
  return queue + ' ' + negotiation
}
