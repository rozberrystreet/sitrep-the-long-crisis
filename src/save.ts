import {
  actions,
  canChoose,
  cities,
  DAYS,
  households,
  reserves,
  roles,
  settle,
  start,
} from './simulation/engine.ts'
import type { Action, Profile, Receipt } from './simulation/engine.ts'

export type Save = {
  version: 1
  seed: string
  profile: Profile
  choices: Action[]
  reviewing: boolean
}
const member = (object: object, key: unknown) =>
  typeof key === 'string' && Object.hasOwn(object, key)
const text = (value: unknown, max: number) =>
  typeof value === 'string' && value.trim().length > 0 && value.length <= max
export function replay(save: Save) {
  let state = start(save.profile, save.seed)
  const receipts: Receipt[] = []
  for (const action of save.choices) {
    if (!canChoose(state, action)) throw new Error('Invalid decision history')
    const turn = settle(state, action)
    receipts.push(turn.receipt)
    state = turn.next
  }
  return { state, receipts }
}
export function decode(raw: string): Save {
  const s = JSON.parse(raw)
  if (s?.version !== 1) throw new Error('Unsupported save version')
  const p = s.profile
  if (
    !p ||
    !text(p.name, 40) ||
    !member(cities, p.city) ||
    !roles.includes(p.role) ||
    !households.includes(p.household) ||
    !member(reserves, p.reserve) ||
    !text(s.seed, 48) ||
    !Array.isArray(s.choices) ||
    s.choices.length > DAYS ||
    !s.choices.every((a: Action) => actions.includes(a)) ||
    typeof s.reviewing !== 'boolean' ||
    (s.reviewing && !s.choices.length)
  )
    throw new Error('Invalid save')
  replay(s)
  return s
}

// One read/write transaction compares and replaces the whole record atomically.
async function access(
  expected?: string | null,
  replacement?: string | null
): Promise<string | null> {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('sitrep-issues', 1)
    request.onupgradeneeded = () => request.result.createObjectStore('desk')
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
  try {
    return await new Promise<string | null>((resolve, reject) => {
      const writing = expected !== undefined
      const tx = db.transaction('desk', writing ? 'readwrite' : 'readonly')
      const store = tx.objectStore('desk')
      const read = store.get('current')
      let result: string | null = null
      let conflict = false
      read.onsuccess = () => {
        result = read.result ?? null
        if (!writing) return
        if (expected !== result) {
          conflict = true
          tx.abort()
          return
        }
        result = replacement ?? null
        if (result === null) store.delete('current')
        else store.put(result, 'current')
      }
      tx.oncomplete = () => resolve(result)
      tx.onabort = () =>
        reject(
          new Error(
            conflict
              ? 'Another tab changed this issue. Reload to read its latest edition.'
              : 'Device storage could not commit this change. Try again.'
          )
        )
    })
  } finally {
    db.close()
  }
}
export const readSave = () => access()
export function writeSave(expected: string | null, next: Save | null) {
  const raw = next === null ? null : JSON.stringify(next)
  if (raw !== null) decode(raw)
  return access(expected, raw)
}
