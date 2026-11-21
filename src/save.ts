import { validProfile, validText } from './profile.ts'
import { replaceRecord } from './storage.ts'
export { readSave } from './storage.ts'
import { actions, canChoose, DAYS, settle, start } from './simulation/engine.ts'
import type { Action, Profile, Receipt } from './simulation/engine.ts'

export type Save = {
  version: 1
  seed: string
  profile: Profile
  choices: Action[]
  reviewing: boolean
}
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
    !validProfile(p) ||
    !validText(s.seed, 48) ||
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

export function writeSave(expected: string | null, next: Save | null) {
  const raw = next === null ? null : JSON.stringify(next)
  if (raw !== null) decode(raw)
  return replaceRecord(expected, raw)
}
