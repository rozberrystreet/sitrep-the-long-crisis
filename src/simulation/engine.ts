// Ruleset v1. Every operation depends only on its arguments.
export const DAYS = 7
export const cities = {
  Melbourne: { country: 'Australia', exposure: 3 },
  Auckland: { country: 'New Zealand', exposure: 5 },
  Bristol: { country: 'United Kingdom', exposure: 2 },
  Halifax: { country: 'Canada', exposure: 4 },
} as const
export const roles = ['Office worker', 'Shift worker', 'Student'] as const
export const households = ['Living alone', 'Shared household', 'With dependants'] as const
export const reserves = { Tight: 64, Steady: 100, Comfortable: 150 }
export type Profile = {
  name: string
  city: keyof typeof cities
  role: (typeof roles)[number]
  household: (typeof households)[number]
  reserve: keyof typeof reserves
}
export const actions = ['stock', 'earn', 'pool'] as const
export type Action = (typeof actions)[number]
export type Account = { cash: number; supplies: number; energy: number; ties: number }
export type World = { pressure: number; talks: number }
export type State = { day: number; seed: string; profile: Profile; world: World; account: Account }
export type Entry = { metric: keyof Account; change: number; reason: string }
export type Receipt = {
  day: number
  action: Action
  entries: Entry[]
  before: Account
  after: Account
}
export const metricNames: Record<keyof Account, string> = {
  cash: 'Cash',
  supplies: 'Pantry',
  energy: 'Energy',
  ties: 'Neighbour ties',
}
export const defaultProfile: Profile = {
  name: '',
  city: 'Melbourne',
  role: 'Office worker',
  household: 'Living alone',
  reserve: 'Steady',
}

function keyedInt(seed: string, day: number, channel: string, width: number) {
  let hash = 2166136261
  for (const symbol of seed + '|' + day + '|' + channel) {
    hash = Math.imul(hash ^ symbol.charCodeAt(0), 16777619)
  }
  hash ^= hash >>> 16
  return (hash >>> 0) % width
}
const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value))

function nextWorld(seed: string, day: number, previous: World): World {
  const talks = clamp(previous.talks + keyedInt(seed, day, 'talks', 5) - 1, 10)
  const pressure = clamp(previous.pressure + 4 + keyedInt(seed, day, 'delay', 11) - talks, 100)
  return { talks, pressure }
}
export function start(profile: Profile, seed: string): State {
  const world = nextWorld(seed, 1, { talks: 2, pressure: 24 + keyedInt(seed, 0, 'harbour', 20) })
  return {
    day: 1,
    seed,
    profile: { ...profile },
    world,
    account: {
      cash: reserves[profile.reserve],
      supplies: 1,
      energy: 7,
      ties: profile.household === 'Shared household' ? 3 : 1,
    },
  }
}
export function terms(state: State) {
  const { profile, world, account } = state
  const need = profile.household === 'With dependants' ? 3 : 2
  const price = 3 + cities[profile.city].exposure + Math.floor(world.pressure / 12)
  const wage = { 'Office worker': 26, 'Shift worker': 32, Student: 21 }[profile.role]
  const earnings = wage - (account.energy < 4 ? 7 : 0)
  const poolFee = Math.max(0, price - account.ties)
  return { need, price, earnings, poolFee }
}
export function canChoose(state: State, action: Action) {
  return state.day <= DAYS && (action !== 'stock' || state.account.cash >= terms(state).price * 3)
}
export function settle(state: State, action: Action): { next: State; receipt: Receipt } {
  if (!actions.includes(action) || !canChoose(state, action)) throw new Error('Choice unavailable')
  const after = { ...state.account }
  const entries: Entry[] = []
  const { need, price, earnings, poolFee } = terms(state)
  function post(metric: keyof Account, delta: number, reason: string) {
    const bounded = clamp(
      after[metric] + delta,
      metric === 'ties' || metric === 'energy' ? 10 : Number.MAX_SAFE_INTEGER
    )
    const change = bounded - after[metric]
    after[metric] = bounded
    entries.push({ metric, change, reason })
  }

  if (action === 'stock') {
    post('cash', -3 * price, 'Advance purchase at the local price')
    post('supplies', 4, 'Four portions at the three-portion bulk price')
    post('energy', 1, 'One less evening errand')
  } else if (action === 'earn') {
    post(
      'cash',
      earnings,
      state.account.energy < 4
        ? 'Shortened shift due to fatigue'
        : 'Extra shift at your occupation rate'
    )
    post('energy', -2, 'Time and effort on shift')
  } else {
    const paid = Math.min(after.cash, poolFee)
    post('cash', -paid, 'Contribution after the neighbour discount')
    post('supplies', 2, 'Two portions from the shared delivery')
    post('ties', 2, 'You helped organise the next delivery')
    post('energy', paid < poolFee ? -2 : -1, 'Delivery work, including any unpaid contribution')
  }

  const taken = Math.min(need, after.supplies)
  if (taken) post('supplies', -taken, 'Portions used by your household tonight')
  const paidPortions = Math.min(need - taken, Math.floor(after.cash / price))
  if (paidPortions)
    post('cash', -paidPortions * price, 'Remaining portions bought at the local price')
  const shortfall = need - taken - paidPortions
  if (shortfall) post('energy', -shortfall * 2, 'Two energy points per missing portion')
  if (!shortfall) post('energy', 1, 'Evening recovery after a full meal')

  const receipt = {
    day: state.day,
    action,
    before: { ...state.account },
    after: { ...after },
    entries,
  }
  const day = state.day + 1
  const world = day <= DAYS ? nextWorld(state.seed, day, state.world) : state.world
  return { next: { ...state, day, world, account: after }, receipt }
}
