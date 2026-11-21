import { actors } from './scenario.ts'
import type { Journal } from './journal.ts'
import type { ScenarioPack, State } from './types.ts'

function tide(seed: string, day: number) {
  let hash = 2166136261
  for (const char of 'living-world/1|tide|' + day + '|' + seed) {
    hash = Math.imul(hash ^ char.charCodeAt(0), 16777619)
  }
  return ((hash >>> 0) % 7) - 3
}

export function openStrait(state: State, pack: ScenarioPack, journal: Journal) {
  const day = journal.day
  const active = pack.events.filter((e) => e.starts <= day && day < e.starts + e.duration)
  const events = active.map((event) => ({
    event,
    cause: journal.fact(
      actors[event.source] +
        ' · ' +
        event.headline +
        ' Queue adjustment: ' +
        event.queue +
        ' points.'
    ),
  }))
  const weather = tide(state.seed, day)
  const tideCause = journal.fact('The seeded sailing window adds ' + weather + ' queue points.')
  const change = weather - 2 + active.reduce((sum, event) => sum + event.queue, 0)
  const queue = journal.measure(
    'strait.queue',
    state.world.queue,
    Math.max(0, Math.min(50, state.world.queue + change)),
    'Routine clearance removes two queue points before event and tide adjustments.',
    [tideCause, ...events.filter((e) => e.event.queue !== 0).map((e) => e.cause)]
  )
  return { queue, events }
}
