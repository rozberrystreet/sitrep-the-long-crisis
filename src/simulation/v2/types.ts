import type { Profile } from '../engine.ts'

export type { Profile }
export type City = Profile['city']
export type Corridor = 'pacific' | 'atlantic'
export type Decision = 'shift' | 'reserve' | 'roster' | 'rest'
export type EffectKind = 'premium' | 'crate' | 'allocation'
export type Actor = 'customs' | 'carriers' | 'cooperative'

export interface RegionalEffect {
  corridor: Corridor
  imports: number
  fuel: number
}
export interface WorldEvent {
  version: 1
  id: string
  fictional: true
  source: Actor
  severity: 'notice' | 'strain' | 'relief'
  starts: number
  duration: number
  headline: string
  dispatch: string
  queue: number
  effects: readonly RegionalEffect[]
}
export interface ScenarioPack {
  id: string
  revision: number
  days: number
  events: readonly WorldEvent[]
}
export interface Household {
  cash: number
  pantry: number
  energy: number
  trust: number
  missed: number
}
export interface Region {
  inventory: number
  fuel: number
  price: number
  jobs: number
}
export interface Scheduled {
  kind: EffectKind
  due: number
  origin: string
}
export interface Fact {
  id: string
  reason: string
  parents: string[]
}
export interface Change extends Fact {
  metric: string
  before: number
  after: number
}
export type Trace = Fact | Change
export interface Receipt {
  day: number
  decision: Decision
  events: string[]
  traces: Trace[]
  closing: Household
}
export interface State {
  version: 2
  ruleset: 'living-world/1'
  scenario: string
  revision: number
  seed: string
  profile: Profile
  day: number // Last settled day. Zero is the opening balance.
  world: { queue: number }
  regions: Record<City, Region>
  household: Household
  pending: Scheduled[]
  history: Receipt[]
  lastChange: Record<string, string>
}
