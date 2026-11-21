import { decode, writeSave } from './save.ts'
import type { Save } from './save.ts'
import { validProfile, validText } from './profile.ts'
import { replaceRecord } from './storage.ts'
import { decisions } from './simulation/v2/decisions.ts'
import { replay, RULESET } from './simulation/v2/engine.ts'
import { orison } from './simulation/v2/scenario.ts'
import type { Decision, Profile } from './simulation/v2/types.ts'

export interface LivingSave {
  version: 2
  ruleset: typeof RULESET
  scenario: string
  revision: number
  seed: string
  profile: Profile
  choices: Decision[]
  reviewing: boolean
}
export type CampaignSave = Save | LivingSave
export function newLivingSave(profile: Profile, seed: string): LivingSave {
  return {
    version: 2,
    ruleset: RULESET,
    scenario: orison.id,
    revision: orison.revision,
    seed,
    profile: { ...profile },
    choices: [],
    reviewing: false,
  }
}
export function decodeCampaign(raw: string): CampaignSave {
  const value = JSON.parse(raw)
  if (value?.version !== 2) return decode(raw)
  if (
    value.ruleset !== RULESET ||
    value.scenario !== orison.id ||
    value.revision !== orison.revision
  )
    throw Error('Unknown living-world ruleset or scenario revision')
  if (
    !validProfile(value.profile) ||
    !validText(value.seed, 48) ||
    !Array.isArray(value.choices) ||
    value.choices.length > orison.days ||
    !value.choices.every((a: Decision) => decisions.includes(a)) ||
    typeof value.reviewing !== 'boolean' ||
    (value.reviewing && value.choices.length === 0)
  )
    throw Error('Invalid living-world save')
  replay(value.profile, value.seed, value.choices)
  return {
    ...newLivingSave(value.profile, value.seed),
    choices: value.choices,
    reviewing: value.reviewing,
  }
}
export function writeCampaign(expected: string | null, next: CampaignSave | null) {
  if (!next || next.version === 1) return writeSave(expected, next)
  const raw = JSON.stringify(next)
  decodeCampaign(raw)
  return replaceRecord(expected, raw)
}
