import type { Journal } from './journal.ts'
import { cityList, ports } from './regions.ts'
import type { State } from './types.ts'
import type { openStrait } from './world.ts'

export function clearMarkets(
  state: State,
  strait: ReturnType<typeof openStrait>,
  journal: Journal
) {
  const markets = { ...state.regions }
  for (const city of cityList) {
    const { corridor, exposure, basePrice } = ports[city]
    const prior = state.regions[city]
    const effects = strait.events.flatMap(({ event, cause }) =>
      event.effects
        .filter((e) => e.corridor === corridor)
        .map((e) => ({
          ...e,
          cause: journal.fact(
            city +
              ' route adjustment: ' +
              e.imports +
              ' stock units and ' +
              e.fuel +
              ' fuel credits.',
            [cause]
          ),
        }))
    )
    const imports = effects.reduce((sum, effect) => sum + effect.imports, 0)
    const surcharge = effects.reduce((sum, effect) => sum + effect.fuel, 0)
    const prefix = city + '.'
    const inventory = journal.measure(
      prefix + 'inventory',
      prior.inventory,
      Math.max(
        0,
        Math.min(30, prior.inventory + 2 + imports - Math.floor((strait.queue * exposure) / 16))
      ),
      city + ' depot stock reflects scheduled imports, daily demand and strait delays.',
      [
        journal.latest['strait.queue'],
        ...effects.filter((e) => e.imports !== 0).map((e) => e.cause),
      ]
    )
    const fuel = journal.measure(
      prefix + 'fuel',
      prior.fuel,
      Math.max(0, 1 + surcharge),
      city + ' pays the base freight charge plus active fuel surcharges.',
      effects.filter((e) => e.fuel !== 0).map((e) => e.cause),
      false
    )
    const price = journal.measure(
      prefix + 'price',
      prior.price,
      basePrice + fuel + Math.floor((30 - inventory) / 5),
      city + ' shops price a portion using freight and available depot stock.',
      [journal.latest[prefix + 'fuel'], journal.latest[prefix + 'inventory']],
      false
    )
    const jobs = journal.measure(
      prefix + 'jobs',
      prior.jobs,
      1 + Math.floor(inventory / 6),
      city + ' warehouses release shifts as cargo becomes available.',
      [journal.latest[prefix + 'inventory']],
      false
    )
    markets[city] = { inventory, fuel, price, jobs }
  }
  return markets
}
