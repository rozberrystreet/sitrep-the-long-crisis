import test from 'node:test'
import assert from 'node:assert/strict'
import { decode, replay } from '../src/save.ts'
import { defaultProfile } from '../src/simulation/engine.ts'
const original = {
  version: 1,
  seed: 'station',
  profile: { ...defaultProfile, name: 'Wren' },
  choices: ['pool', 'earn'],
  reviewing: true,
}
test('reloading an evening save reconstructs the same receipts, world, and next turn', () => {
  const loaded = decode(JSON.stringify(original))
  assert.deepEqual(loaded, original)
  assert.deepEqual(replay(loaded), replay(original))
  assert.deepEqual(
    replay({ ...loaded, choices: [...loaded.choices, 'pool'] }),
    replay({ ...original, choices: [...original.choices, 'pool'] })
  )
})
test('truncated, incompatible and impossible saves are rejected', () => {
  for (const raw of [
    '{',
    'null',
    '[]',
    JSON.stringify({ ...original, version: 2 }),
    JSON.stringify({ ...original, choices: ['invalid'] }),
    JSON.stringify({ ...original, reviewing: 1 }),
    JSON.stringify({ ...original, choices: [] }),
    JSON.stringify({ ...original, choices: Array(8).fill('pool') }),
    JSON.stringify({
      ...original,
      choices: Array(7).fill('stock'),
      profile: { ...original.profile, reserve: 'Tight' },
    }),
  ])
    assert.throws(() => decode(raw))
})
test('a malformed profile cannot select inherited keys or invalid seed values', () => {
  for (const [key, value] of Object.entries({
    city: 'constructor',
    name: '   ',
    reserve: '__proto__',
    role: 'unknown',
    household: null,
  })) {
    assert.throws(() =>
      decode(JSON.stringify({ ...original, profile: { ...original.profile, [key]: value } }))
    )
  }
  for (const seed of [null, '', ' '.repeat(10), 'a'.repeat(49)])
    assert.throws(() => decode(JSON.stringify({ ...original, seed })))
})
