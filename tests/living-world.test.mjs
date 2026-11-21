import test from 'node:test'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { cities, defaultProfile, households, roles, reserves } from '../src/simulation/engine.ts'
import { replay as legacyReplay } from '../src/save.ts'
import { start, morning, tick, replay } from '../src/simulation/v2/engine.ts'
import { decisions, unavailable } from '../src/simulation/v2/decisions.ts'
import { explain, outcome } from '../src/simulation/v2/explain.ts'
import { orison } from '../src/simulation/v2/scenario.ts'

const player = { ...defaultProfile, name: 'Wren' }
const seed = 'ORISON-01'
const path = [
  'reserve',
  'rest',
  'shift',
  'roster',
  'roster',
  'rest',
  'shift',
  'reserve',
  'rest',
  'shift',
  'roster',
  'roster',
  'rest',
  'shift',
]
const measures = (receipt) => receipt.traces.filter((t) => 'metric' in t)
const found = (receipt, reason) => receipt.traces.find((t) => t.reason.includes(reason))

test('the complete v1 reference replay matches merged main, including every receipt', () => {
  const legacy = {
    version: 1,
    seed,
    profile: player,
    choices: ['pool', 'earn', 'stock', 'pool', 'earn', 'stock', 'pool'],
    reviewing: false,
  }
  const digest = createHash('sha256')
    .update(JSON.stringify(legacyReplay(legacy)))
    .digest('hex')
  assert.equal(digest, '75624b82bdfb7a86eb9218ab864450411922c8a0f42d25b30c37d4324c40d808')
})
test('the v2 reference path closes at day fourteen, with a different outcome from a recovery-only run', () => {
  const s = replay(player, seed, path)
  assert.deepEqual(s.household, { cash: 359, pantry: 4, energy: 9, trust: 9, missed: 0 })
  assert.deepEqual(s.world, { queue: 0 })
  assert.deepEqual(s.pending, [])
  assert.equal(s.history.length, 14)
  assert.equal(outcome(s.household), 'A place in the cooperative')
  assert.equal(
    outcome(replay(player, seed, Array(14).fill('rest')).household),
    'A narrow passage through'
  )
  assert.throws(() => tick(s, 'rest'), /complete/)
})
test('a prepaid crate arrives exactly two mornings later, once, with the original decision as its cause', () => {
  const state = replay(player, seed, ['reserve', 'rest', 'rest', 'rest'])
  const arrivals = state.history.flatMap((r) =>
    r.traces.filter((t) => t.reason.includes('Six prepaid')).map((row) => ({ day: r.day, row }))
  )
  assert.deepEqual(
    arrivals.map((a) => a.day),
    [3]
  )
  const entry = arrivals[0].row
  assert.equal(entry.after - entry.before, 6)
  assert.ok(explain(state.history, entry.id).some((e) => e.reason === 'Reserve a crate on day 1.'))
})
test('a shift premium depends on demand on the due day, including the zero-payout branch', () => {
  const s = replay(player, seed, path)
  const failed = found(s.history[4], 'cancelled the premium')
  const paid = found(s.history[11], '12-credit premium')
  assert.equal(failed.after - failed.before, 0)
  assert.equal(paid.after - paid.before, 12)
  for (const [row, day] of [
    [failed, 3],
    [paid, 10],
  ]) {
    const causes = explain(s.history, row.id)
    assert.ok(causes.some((t) => t.reason === 'Take a dock shift on day ' + day + '.'))
    assert.ok(causes.some((t) => t.metric === 'Melbourne.jobs'))
  }
})
test('cooperative allocations check current trust three days after volunteering', () => {
  for (const [second, amount] of [
    ['rest', 1],
    ['roster', 4],
  ]) {
    const s = replay(player, seed, ['roster', second, 'rest', 'rest'])
    const r = s.history[3]
    const row = measures(r).find(
      (t) => t.reason.includes('allocation') || t.reason.includes('this trust level')
    )
    assert.equal(row.after - row.before, amount)
    assert.ok(explain(s.history, row.id).some((t) => t.reason === 'Join the food rota on day 1.'))
    assert.equal(found(s.history[2], 'from day 1 comes due'), undefined)
  }
})
test('a fictional regional fuel event propagates to a household purchase only on its exposed route', () => {
  const base = { id: 'fixture', revision: 1, days: 30, events: [] }
  const shock = {
    ...base,
    revision: 2,
    events: [
      {
        version: 1,
        id: 'fuel',
        fictional: true,
        source: 'carriers',
        severity: 'strain',
        starts: 2,
        duration: 1,
        headline: 'A local fuel surcharge.',
        dispatch: 'A test of regional pass-through.',
        queue: 0,
        effects: [{ corridor: 'pacific', imports: 0, fuel: 3 }],
      },
    ],
  }
  const control = replay(player, seed, ['rest', 'rest', 'rest'], base)
  const s = replay(player, seed, ['rest', 'rest', 'rest'], shock)
  const r = s.history[1],
    fuel = measures(r).find((t) => t.metric === 'Melbourne.fuel')
  const payment = found(r, 'Bought ')
  assert.equal(s.history[0].events.length, 0)
  assert.deepEqual(r.events, ['fuel'])
  assert.deepEqual(s.history[2].events, [])
  assert.equal(fuel.after - fuel.before, 3)
  assert.equal(found(control.history[1], 'Bought ').after - payment.after, 3)
  const chain = explain(s.history, payment.id)
  assert.ok(chain.some((t) => t.reason.includes('A local fuel surcharge')))
  assert.ok(chain.some((t) => t.metric === 'Melbourne.price'))
  const atlantic = replay({ ...player, city: 'Bristol' }, seed, ['rest', 'rest'], shock)
  assert.deepEqual(
    atlantic.household,
    replay({ ...player, city: 'Bristol' }, seed, ['rest', 'rest'], base).household
  )
  assert.throws(() => morning(s, base), /mismatch/)
  assert.equal(replay(player, seed, Array(30).fill('rest'), base).day, 30)
})
test('seeded profile sweep is deterministic and pure, every change reconciles and every cause resolves in order', () => {
  const openingQueues = new Set()
  for (let n = 0; n < 48; n++) {
    const profile = {
      ...player,
      city: Object.keys(cities)[n % 4],
      role: roles[n % 3],
      household: households[Math.floor(n / 3) % 3],
      reserve: Object.keys(reserves)[Math.floor(n / 4) % 3],
    }
    const key = 'ledger-' + n
    let state = start(profile, key)
    const history = [],
      seen = new Set(),
      balances = new Map()
    for (let i = 0; i < orison.days; i++) {
      const before = JSON.stringify(state),
        m = morning(state)
      if (!i) openingQueues.add(m.strait.queue)
      const allowed = decisions.filter((a) => !unavailable(a, m.household, m.terms))
      const action = allowed[(n + 3 * i) % allowed.length]
      const next = tick(state, action)
      assert.equal(JSON.stringify(state), before)
      const receipt = next.history.at(-1)
      for (const t of receipt.traces) {
        assert.ok(!seen.has(t.id))
        assert.ok(t.parents.every((p) => seen.has(p)))
        seen.add(t.id)
        if ('metric' in t) {
          assert.ok(Number.isSafeInteger(t.after) && t.after >= 0)
          if (balances.has(t.metric)) assert.equal(t.before, balances.get(t.metric))
          balances.set(t.metric, t.after)
        }
      }
      for (const [metric, value] of Object.entries(next.household)) {
        const delta = measures(receipt)
          .filter((t) => t.metric === 'household.' + metric)
          .reduce((sum, t) => sum + t.after - t.before, 0)
        assert.equal(state.household[metric] + delta, value)
      }
      assert.ok(next.household.energy <= 10 && next.household.trust <= 10)
      assert.ok(next.pending.every((e) => e.due > next.day && e.due <= orison.days))
      history.push(action)
      state = next
    }
    assert.deepEqual(replay(profile, key, history), state)
  }
  assert.ok(openingQueues.size >= 5)
})
test('campaign deadlines, fatigue and cash constraints are enforced by the engine', () => {
  const state = start(player, seed)
  assert.throws(() => tick(state, 'unknown'))
  assert.throws(
    () => tick({ ...state, household: { ...state.household, energy: 0 } }, 'shift'),
    /energy/
  )
  const poor = {
    ...state,
    profile: { ...player, role: 'Student' },
    household: { ...state.household, cash: 0 },
  }
  assert.throws(() => tick(poor, 'reserve'), /credits/)
  assert.throws(() => tick(replay(player, seed, Array(12).fill('rest')), 'reserve'), /final/)
})
