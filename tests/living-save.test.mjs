import test from 'node:test'
import assert from 'node:assert/strict'
import { IDBFactory } from 'fake-indexeddb'
import { readSave } from '../src/storage.ts'
import { decodeCampaign, newLivingSave, writeCampaign } from '../src/campaignSave.ts'
import { defaultProfile } from '../src/simulation/engine.ts'
import { replay } from '../src/simulation/v2/engine.ts'

const profile = { ...defaultProfile, name: 'Wren' }
const record = {
  ...newLivingSave(profile, 'SAVE-02'),
  choices: ['reserve', 'rest'],
  reviewing: true,
}

test('v2 reload restores the exact pending queue, receipt and next tick from its compact history', async () => {
  globalThis.indexedDB = new IDBFactory()
  const raw = await writeCampaign(null, record)
  assert.equal(raw, await readSave())
  const restored = decodeCampaign(raw)
  assert.deepEqual(restored, record)
  const before = replay(profile, record.seed, record.choices)
  const after = replay(restored.profile, restored.seed, restored.choices)
  assert.deepEqual(after, before)
  assert.equal(after.pending[0].due, 3)
  assert.deepEqual(
    replay(restored.profile, restored.seed, [...restored.choices, 'rest']),
    replay(profile, record.seed, ['reserve', 'rest', 'rest'])
  )
})
test('legacy storage loads without rewriting and stale writes cannot migrate or overwrite a game', async () => {
  globalThis.indexedDB = new IDBFactory()
  const legacy = { version: 1, profile, seed: 'old', choices: ['pool'], reviewing: true }
  const raw = await writeCampaign(null, legacy)
  assert.deepEqual(decodeCampaign(await readSave()), legacy)
  assert.equal(await readSave(), raw)
  await assert.rejects(writeCampaign(null, record), /Another tab/)
  await writeCampaign(raw, null)
  const newer = await writeCampaign(null, record)
  await assert.rejects(writeCampaign(raw, legacy), /Another tab/)
  assert.equal(await readSave(), newer)
})
test('future revisions, invalid profiles and impossible v2 histories leave the previous record intact', async () => {
  globalThis.indexedDB = new IDBFactory()
  const raw = await writeCampaign(null, record)
  for (const patch of [
    { version: 3 },
    { ruleset: 'future' },
    { revision: 2 },
    { scenario: 'other' },
    { choices: ['bogus'] },
    { choices: [] },
    { choices: Array(15).fill('rest') },
    { choices: Array(9).fill('shift') },
    { profile: { ...profile, city: 'constructor' } },
    { seed: '  ' },
    { reviewing: 1 },
  ]) {
    assert.throws(() => writeCampaign(raw, { ...record, ...patch }))
    assert.equal(await readSave(), raw)
  }
  for (const damaged of ['null', '{', '[]']) assert.throws(() => decodeCampaign(damaged))
})
