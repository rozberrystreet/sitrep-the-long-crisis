import test from 'node:test'
import assert from 'node:assert/strict'
import {
  actions,
  canChoose,
  cities,
  DAYS,
  defaultProfile,
  households,
  settle,
  start,
  terms,
} from '../src/simulation/engine.ts'
import { dispatches, localBrief, options } from '../src/simulation/dispatch.ts'
import { replay } from '../src/save.ts'

const profile = { ...defaultProfile, name: 'Wren' }
const save = {
  version: 1,
  seed: 'ORISON-01',
  profile,
  choices: ['pool', 'earn', 'stock', 'pool', 'earn', 'stock', 'pool'],
  reviewing: false,
}
test('v1 reference seed pins the opening terms and seven-day outcome', () => {
  const initial = start(profile, save.seed)
  assert.deepEqual(initial.world, { talks: 4, pressure: 35 })
  assert.deepEqual(terms(initial), { need: 2, price: 8, earnings: 26, poolFee: 7 })
  assert.deepEqual(replay(save).state.account, { cash: 71, supplies: 2, energy: 9, ties: 7 })
  assert.deepEqual(replay(save), replay(structuredClone(save)))
})
test('seeds vary the world while a household choice leaves the shared world reproducible', () => {
  const s = start(profile, 'ORISON-01')
  const paths = new Set(
    Array.from({ length: 40 }, (_, i) => JSON.stringify(start(profile, String(i)).world))
  )
  assert.ok(paths.size > 10)
  const outcomes = actions.map((a) => settle(s, a).next)
  assert.equal(new Set(outcomes.map((s) => JSON.stringify(s.world))).size, 1)
  assert.equal(new Set(outcomes.map((s) => JSON.stringify(s.account))).size, 3)
})
test('city, household, reserves, occupation and fatigue alter applied terms', () => {
  const s = start(profile, save.seed)
  assert.ok(terms(start({ ...profile, city: 'Auckland' }, save.seed)).price > terms(s).price)
  assert.equal(terms(start({ ...profile, household: 'With dependants' }, save.seed)).need, 3)
  assert.ok(start({ ...profile, reserve: 'Tight' }, save.seed).account.cash < s.account.cash)
  const shift = start({ ...profile, role: 'Shift worker' }, save.seed)
  assert.ok(terms(shift).earnings > terms(s).earnings)
  assert.equal(terms({ ...shift, account: { ...shift.account, energy: 2 } }).earnings, 25)
  assert.ok(terms(settle(s, 'pool').next).poolFee < terms(settle(s, 'earn').next).poolFee)
})
test('low reserves never strand the household and exhausted stock is rejected', () => {
  const s = start({ ...profile, household: 'With dependants' }, 'lean')
  s.account = { cash: 0, supplies: 0, energy: 3, ties: 0 }
  assert.throws(() => settle(s, 'stock'))
  const { next, receipt } = settle(s, 'pool')
  assert.equal(next.account.energy, 0)
  assert.equal(next.account.cash, 0)
  assert.ok(receipt.entries.some((e) => e.reason.includes('missing portion')))
})
test('terminal turns and unknown choices are rejected', () => {
  assert.throws(() => settle(replay(save).state, 'earn'))
  assert.throws(() => settle(start(profile, 'seed'), 'skip'))
})
test('all affordable paths reconcile each metric and preserve their input', () => {
  function visit(s) {
    if (s.day > DAYS) return
    const before = structuredClone(s)
    for (const a of actions.filter((a) => canChoose(s, a))) {
      const { next, receipt } = settle(s, a)
      assert.deepEqual(s, before)
      for (const [metric, value] of Object.entries(next.account)) {
        assert.equal(
          value,
          s.account[metric] +
            receipt.entries.filter((e) => e.metric === metric).reduce((n, e) => n + e.change, 0)
        )
        assert.ok(Number.isInteger(value) && value >= 0)
      }
      assert.ok(next.account.energy <= 10 && next.account.ties <= 10)
      visit(next)
    }
  }
  visit(start(profile, 'sweep'))
})
test('the authored edition and local dispatch cover every supported day and profile location', () => {
  assert.equal(dispatches.length, DAYS)
  for (const city of Object.keys(cities))
    for (const household of households) {
      const s = start({ ...profile, city, household }, 'desk')
      assert.ok(localBrief(s).includes(city))
      assert.ok(localBrief(s).includes(terms(s).need + ' portions'))
      assert.ok(options(s).stock.includes(String(terms(s).price * 3)))
    }
})
