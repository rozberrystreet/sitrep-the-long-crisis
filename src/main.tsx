import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { readSave, replay } from './save.ts'
import { decodeCampaign, writeCampaign } from './campaignSave.ts'
import type { CampaignSave } from './campaignSave.ts'
import { LivingIssue } from './ui/LivingIssue.tsx'
import { orison } from './simulation/v2/scenario.ts'
import { DAYS } from './simulation/engine.ts'
import { Setup } from './ui/Setup.tsx'
import { Debrief, Issue, Outcome } from './ui/Issue.tsx'
import './style.css'

function App() {
  const [save, setSave] = useState<CampaignSave | null>(null)
  const [ready, setReady] = useState(false)
  const [busy, setBusy] = useState(false)
  const [problem, setProblem] = useState('')
  const [corrupt, setCorrupt] = useState(false)
  const [temporary, setTemporary] = useState(false)
  const [reset, setReset] = useState(false)
  const original = useRef<string | null>(null)
  const pending = useRef(false)
  const main = useRef<HTMLElement>(null)
  async function load() {
    pending.current = true
    setBusy(true)
    try {
      const raw = await readSave()
      original.current = raw
      let loaded: CampaignSave | null = null
      if (raw !== null) {
        try {
          loaded = decodeCampaign(raw)
        } catch {
          setCorrupt(true)
          setProblem(
            'This saved issue could not be read. You can replace it and start a new issue.'
          )
          return
        }
      }
      setSave(loaded)
      setProblem('')
      setCorrupt(false)
      setTemporary(false)
      setReset(false)
    } catch {
      setTemporary(true)
      setProblem('Device storage is unavailable. You can play in this tab until it closes.')
    } finally {
      setReady(true)
      setBusy(false)
      pending.current = false
    }
  }
  useEffect(() => {
    void load()
  }, [])
  const screen = !ready
    ? 'loading'
    : corrupt
    ? 'recovery'
    : reset
    ? 'reset'
    : !save
    ? 'setup'
    : save.reviewing
    ? 'receipt'
    : save.choices.length === (save.version === 2 ? orison.days : DAYS)
    ? 'end'
    : 'report'
  useEffect(() => {
    main.current?.querySelector<HTMLElement>('h1')?.focus({ preventScroll: true })
    window.scrollTo(0, 0)
  }, [screen])
  async function change(next: CampaignSave | null) {
    if (pending.current) return
    pending.current = true
    setBusy(true)
    try {
      if (!temporary) original.current = await writeCampaign(original.current, next)
      setSave(next)
      setCorrupt(false)
      setReset(false)
      if (!temporary) setProblem('')
    } catch (e) {
      setProblem(
        e instanceof Error ? e.message : 'The save failed. Retry or reload the stored issue.'
      )
    } finally {
      setBusy(false)
      pending.current = false
    }
  }
  const run = save?.version === 1 ? replay(save) : null
  return (
    <>
      <a className="skip" href="#desk">
        Skip to issue
      </a>
      <header>
        <div className="bar">
          <div className="brand">
            <span className="mark" aria-hidden="true">
              ▥
            </span>
            SITREP<span className="brand-dot">.</span>
          </div>
          <div className="subtitle">The Long Crisis</div>
          <div className="fiction">Fictional simulation</div>
        </div>
      </header>
      <main id="desk" ref={main} tabIndex={-1}>
        {problem && (
          <div role="alert" className="alert">
            {problem}{' '}
            {!temporary && !corrupt && (
              <button className="link" disabled={busy} onClick={load}>
                Reload saved issue
              </button>
            )}
          </div>
        )}
        {!ready ? (
          <p role="status">Opening the issue…</p>
        ) : corrupt || reset ? (
          <section className="confirm">
            <p className="eyebrow">Local save</p>
            <h1 className="headline" tabIndex={-1}>
              Replace this issue?
            </h1>
            <p>This removes the saved household and its decision record from this browser.</p>
            <button className="primary" disabled={busy} onClick={() => change(null)}>
              Replace saved issue
            </button>
            {!corrupt && (
              <button className="link" onClick={() => setReset(false)}>
                Keep playing
              </button>
            )}
          </section>
        ) : save?.version === 2 ? (
          <LivingIssue save={save} busy={busy} change={change} restart={() => setReset(true)} />
        ) : !save || !run ? (
          <Setup submit={change} busy={busy} />
        ) : save.reviewing ? (
          <Outcome
            r={run.receipts[run.receipts.length - 1]}
            busy={busy}
            proceed={() => change({ ...save, reviewing: false })}
          />
        ) : run.state.day > DAYS ? (
          <Debrief {...run} busy={busy} restart={() => setReset(true)} />
        ) : (
          <Issue
            state={run.state}
            busy={busy}
            choose={(a) => change({ ...save, choices: [...save.choices, a], reviewing: true })}
          />
        )}
      </main>
      <footer>
        <span>
          SITREP <b>/</b> The Long Crisis
        </span>
        <span>
          {temporary ? 'Temporary session' : save ? 'Saved on this device' : 'Local edition'}
          {save && !reset && !corrupt && (
            <>
              {' '}
              ·{' '}
              <button className="link" disabled={busy} onClick={() => setReset(true)}>
                New issue
              </button>
            </>
          )}
        </span>
      </footer>
    </>
  )
}
createRoot(document.getElementById('root')!).render(<App />)
