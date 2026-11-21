import { test, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { IDBFactory } from 'fake-indexeddb'
import { defaultProfile } from '../src/simulation/engine.ts'
import { decode, readSave, writeSave } from '../src/save.ts'

const save = {
  version: 1,
  seed: 'archive',
  profile: { ...defaultProfile, name: 'Wren' },
  choices: [],
  reviewing: false,
}
beforeEach(() => {
  globalThis.indexedDB = new IDBFactory()
})
test('onboarding, settlement, receipt dismissal and reset persist as atomic records', async () => {
  assert.equal(await readSave(), null)
  let token = await writeSave(null, save)
  const receipt = { ...save, choices: ['pool'], reviewing: true }
  token = await writeSave(token, receipt)
  assert.deepEqual(decode(await readSave()), receipt)
  token = await writeSave(token, { ...receipt, reviewing: false })
  assert.equal(decode(await readSave()).reviewing, false)
  await writeSave(token, null)
  assert.equal(await readSave(), null)
})
test('only one of two competing settlement transactions can win', async () => {
  const token = await writeSave(null, save)
  const attempts = await Promise.allSettled(
    ['earn', 'pool'].map((action) =>
      writeSave(token, { ...save, choices: [action], reviewing: true })
    )
  )
  const ok = attempts.filter((a) => a.status === 'fulfilled'),
    failed = attempts.filter((a) => a.status === 'rejected')
  assert.equal(ok.length, 1)
  assert.equal(failed.length, 1)
  assert.match(failed[0].reason.message, /Another tab/)
  assert.equal(await readSave(), ok[0].value)
})
test('an invalid update leaves the previous game intact', async () => {
  const token = await writeSave(null, save)
  assert.throws(() => writeSave(token, { ...save, choices: ['unknown'] }))
  assert.equal(await readSave(), token)
})
