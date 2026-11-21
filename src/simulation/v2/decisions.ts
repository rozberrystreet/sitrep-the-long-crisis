import type { Journal } from './journal.ts'
import type { Decision, Household, Profile, Region, Scheduled, EffectKind } from './types.ts'
import { post } from './household.ts'
import { delays } from './consequences.ts'

export const actionNames = {
  shift: 'Take a dock shift',
  reserve: 'Reserve a crate',
  roster: 'Join the food rota',
  rest: 'Take a recovery day',
} as const
export const decisions = Object.keys(actionNames) as Decision[]
export interface Terms {
  pay: number
  deposit: number
  premiumDue: number | null
  crateDue: number | null
  allocationDue: number | null
}
export function decisionTerms(
  profile: Profile,
  market: Region,
  day: number,
  length: number
): Terms {
  const due = (kind: EffectKind) => (day + delays[kind] <= length ? day + delays[kind] : null)
  const base = { 'Office worker': 12, 'Shift worker': 17, Student: 9 }[profile.role]
  return {
    pay: base + 2 * market.jobs,
    deposit: 2 * market.price,
    crateDue: due('crate'),
    premiumDue: due('premium'),
    allocationDue: due('allocation'),
  }
}
export function unavailable(action: Decision, account: Household, terms: Terms) {
  if ((action === 'shift' || action === 'roster') && account.energy < 2) return 'Requires 2 energy.'
  if (action === 'reserve') {
    if (!terms.crateDue) return 'The crate would arrive after the final dispatch.'
    if (account.cash < terms.deposit) return 'Requires ' + terms.deposit + ' credits.'
  }
  return null
}
export function applyDecision(
  action: Decision,
  account: Household,
  city: Profile['city'],
  terms: Terms,
  pending: Scheduled[],
  journal: Journal
) {
  const blocked = unavailable(action, account, terms)
  if (!decisions.includes(action) || blocked) throw Error(blocked || 'Unknown decision')
  const origin = journal.fact(actionNames[action] + ' on day ' + journal.day + '.')
  function schedule(kind: EffectKind, due: number | null) {
    if (due !== null) pending.push({ kind, due, origin })
  }
  switch (action) {
    case 'shift':
      post(
        account,
        'cash',
        terms.pay,
        'Extra shift paid at the local occupation rate.',
        [origin, journal.latest[city + '.jobs']],
        journal
      )
      post(account, 'energy', -2, 'A dock shift used two energy.', [origin], journal)
      schedule('premium', terms.premiumDue)
      break
    case 'reserve':
      post(
        account,
        'cash',
        -terms.deposit,
        'Paid for a future crate at twice today’s portion price.',
        [origin, journal.latest[city + '.price']],
        journal
      )
      schedule('crate', terms.crateDue)
      break
    case 'roster':
      post(account, 'energy', -2, 'Time spent on the food rota.', [origin], journal)
      post(account, 'trust', 2, 'Neighbours recorded a completed rota shift.', [origin], journal)
      post(account, 'pantry', 1, 'One portion came home from the rota.', [origin], journal)
      schedule('allocation', terms.allocationDue)
      break
    case 'rest':
      post(account, 'energy', 3, 'A day free of extra work restored energy.', [origin], journal)
      break
  }
}
