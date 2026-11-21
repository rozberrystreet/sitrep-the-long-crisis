import type { Household, Receipt, Trace } from './types.ts'

// The reader follows recorded edges only. It cannot change the simulation or invent causes.
export function explain(
  history: readonly Receipt[],
  id: string,
  current: readonly Trace[] = []
): Trace[] {
  const index = new Map(
    [...history.flatMap((r) => r.traces), ...current].map((trace) => [trace.id, trace])
  )
  const seen = new Set<string>()
  const result: Trace[] = []
  function visit(key: string) {
    if (seen.has(key)) return
    const item = index.get(key)
    if (!item) throw Error('Missing cause ' + key)
    seen.add(key)
    for (const parent of item.parents) visit(parent)
    result.push(item)
  }
  visit(id)
  return result
}
export function outcome(account: Household) {
  if (account.missed >= 3) return 'A household under strain'
  if (account.trust >= 7) return 'A place in the cooperative'
  if (account.cash >= 100) return 'A reserve for the next crossing'
  return 'A narrow passage through'
}
