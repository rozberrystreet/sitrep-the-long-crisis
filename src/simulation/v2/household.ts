import type { Journal } from './journal.ts'
import type { Household, Profile, Region } from './types.ts'

export const units: Record<keyof Household, string> = {
  cash: 'credits',
  pantry: 'pantry portions',
  energy: 'energy',
  trust: 'trust',
  missed: 'missed portions',
}
export function initialHousehold(profile: Profile): Household {
  return {
    cash: { Tight: 64, Steady: 100, Comfortable: 150 }[profile.reserve],
    pantry: 3,
    energy: 7,
    trust: profile.household === 'Shared household' ? 3 : 1,
    missed: 0,
  }
}
export function portions(profile: Profile) {
  return profile.household === 'With dependants' ? 3 : 2
}
export function post(
  account: Household,
  metric: keyof Household,
  delta: number,
  reason: string,
  parents: string[],
  journal: Journal
) {
  const limit = metric === 'energy' || metric === 'trust' ? 10 : Number.MAX_SAFE_INTEGER
  account[metric] = journal.measure(
    'household.' + metric,
    account[metric],
    Math.min(limit, Math.max(0, account[metric] + delta)),
    reason,
    parents
  )
}
export function payBaseIncome(
  account: Household,
  profile: Profile,
  market: Region,
  journal: Journal
) {
  const base = { 'Office worker': 14, 'Shift worker': 12, Student: 10 }[profile.role]
  post(
    account,
    'cash',
    base + market.jobs,
    'Ordinary income for a ' + profile.role.toLowerCase() + ' includes local shift demand.',
    [journal.latest[profile.city + '.jobs']],
    journal
  )
}
export function eveningMeal(account: Household, profile: Profile, price: number, journal: Journal) {
  const need = portions(profile)
  const needCause = journal.fact('This household needs ' + need + ' portions each evening.')
  const fromShelf = Math.min(need, account.pantry)
  post(
    account,
    'pantry',
    -fromShelf,
    'Tonight’s meal uses stored portions first.',
    [needCause],
    journal
  )
  const bought = Math.min(need - fromShelf, Math.floor(account.cash / price))
  const pricing = journal.latest[profile.city + '.price']
  post(
    account,
    'cash',
    -bought * price,
    'Bought ' + bought + ' portions at ' + price + ' credits each.',
    [pricing, journal.latest['household.pantry']],
    journal
  )
  const missing = need - fromShelf - bought
  if (missing)
    post(
      account,
      'missed',
      missing,
      'The evening budget fell short of a full meal.',
      [journal.latest['household.cash']],
      journal
    )
  post(
    account,
    'energy',
    missing ? -missing : 1,
    missing ? 'Missed portions reduced energy.' : 'A full evening meal restored energy.',
    [journal.latest[missing ? 'household.missed' : 'household.cash']],
    journal
  )
}
