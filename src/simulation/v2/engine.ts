import { Journal } from './journal.ts'
import { initialMarkets } from './regions.ts'
import { initialHousehold, eveningMeal, payBaseIncome } from './household.ts'
import { applyDecision, decisionTerms } from './decisions.ts'
import { settleDue } from './consequences.ts'
import { clearMarkets } from './economy.ts'
import { openStrait } from './world.ts'
import { orison } from './scenario.ts'
import type { Decision, Profile, Receipt, ScenarioPack, State } from './types.ts'

export const RULESET = 'living-world/1' as const

export function start(profile: Profile, seed: string, pack: ScenarioPack = orison): State {
  return {
    version: 2,
    ruleset: RULESET,
    scenario: pack.id,
    revision: pack.revision,
    seed,
    profile: { ...profile },
    day: 0,
    world: { queue: 12 },
    regions: initialMarkets(),
    household: initialHousehold(profile),
    pending: [],
    history: [],
    lastChange: {},
  }
}

export function morning(state: State, pack: ScenarioPack = orison) {
  if (state.scenario !== pack.id || state.revision !== pack.revision || state.ruleset !== RULESET)
    throw Error('Scenario or ruleset mismatch')
  if (state.day >= pack.days) throw Error('Campaign complete')
  const day = state.day + 1
  const journal = new Journal(day, state.lastChange)
  const strait = openStrait(state, pack, journal)
  const regions = clearMarkets(state, strait, journal)
  const market = regions[state.profile.city]
  const household = { ...state.household }
  const pending = settleDue(state.pending, household, market, state.profile.city, journal)
  payBaseIncome(household, state.profile, market, journal)
  const terms = decisionTerms(state.profile, market, day, pack.days)
  return { day, journal, strait, regions, market, household, pending, terms }
}

export function tick(state: State, action: Decision, pack: ScenarioPack = orison): State {
  const { day, journal, strait, regions, market, household, pending, terms } = morning(state, pack)
  applyDecision(action, household, state.profile.city, terms, pending, journal)
  eveningMeal(household, state.profile, market.price, journal)
  const receipt: Receipt = {
    day,
    decision: action,
    events: strait.events.map((e) => e.event.id),
    traces: journal.traces,
    closing: { ...household },
  }
  return {
    ...state,
    day,
    world: { queue: strait.queue },
    regions,
    household,
    pending,
    history: [...state.history, receipt],
    lastChange: journal.latest,
  }
}

export function replay(
  profile: Profile,
  seed: string,
  choices: readonly Decision[],
  pack: ScenarioPack = orison
) {
  return choices.reduce((state, action) => tick(state, action, pack), start(profile, seed, pack))
}
