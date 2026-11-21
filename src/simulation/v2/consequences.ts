import type { Journal } from './journal.ts'
import { post } from './household.ts'
import type { City, Household, Region, Scheduled } from './types.ts'

export const effectNames = {
  premium: 'Shift premium',
  crate: 'Reserved crate',
  allocation: 'Cooperative allocation',
} as const
export const delays = { premium: 2, crate: 2, allocation: 3 } as const

export function settleDue(
  pending: readonly Scheduled[],
  account: Household,
  market: Region,
  city: City,
  journal: Journal
) {
  const later: Scheduled[] = []
  for (const item of pending) {
    if (item.due !== journal.day) {
      later.push(item)
      continue
    }
    const originDay = item.due - delays[item.kind]
    const commitment = journal.fact(
      effectNames[item.kind] + ' from day ' + originDay + ' comes due.',
      [item.origin]
    )
    switch (item.kind) {
      case 'crate':
        post(
          account,
          'pantry',
          6,
          'Six prepaid portions arrived at the door.',
          [commitment],
          journal
        )
        break
      case 'premium': {
        const earned = market.jobs >= 3
        post(
          account,
          'cash',
          earned ? 12 : 0,
          earned
            ? 'Enough cargo moved to pay the 12-credit premium.'
            : 'Low cargo intake cancelled the premium.',
          [commitment, journal.latest[city + '.jobs']],
          journal
        )
        break
      }
      case 'allocation': {
        const trusted = account.trust >= 4
        post(
          account,
          'pantry',
          trusted ? 4 : 1,
          trusted
            ? 'Trust of at least four secured the four-portion allocation.'
            : 'The cooperative released one portion at this trust level.',
          [commitment, journal.latest['household.trust']].filter((id): id is string => Boolean(id)),
          journal
        )
        break
      }
    }
  }
  return later
}
