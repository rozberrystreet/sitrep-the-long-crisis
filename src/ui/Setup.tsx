import { useState } from 'react'
import { cities, defaultProfile, households, reserves, roles } from '../simulation/engine.ts'
import type { Profile } from '../simulation/engine.ts'
import { newLivingSave } from '../campaignSave.ts'
import type { CampaignSave } from '../campaignSave.ts'
import { Chart } from './Chart.tsx'

export function Setup({ submit, busy }: { submit: (s: CampaignSave) => void; busy: boolean }) {
  const [edition, setEdition] = useState('legacy')
  const living = edition === 'living'
  const [profile, set] = useState<Profile>(defaultProfile)
  const [seed, setSeed] = useState('ORISON-01')
  function change<K extends keyof Profile>(key: K, value: Profile[K]) {
    set({ ...profile, [key]: value })
  }
  return (
    <div className="setup layout">
      <section className="cover">
        <p className="eyebrow">
          <span className="signal" /> Scenario 01 <span className="divider">/</span> Maritime trade
        </p>
        <h1 tabIndex={-1}>
          The Orison <br />
          <em>Strait.</em>
        </h1>
        <p className="standfirst">
          {living
            ? 'Fourteen days between the shipping lane and your kitchen table. Follow two trade routes, keep your household fed and see which promises come due.'
            : 'Two customs offices. One narrow passage. Live through the week a shipping delay reaches your kitchen table.'}
        </p>
        <Chart />
        <div className="edition">
          <span>{living ? 14 : 7} daily dispatches</span>
          <span>One household decision per day</span>
        </div>
      </section>
      <section className="dossier">
        <p className="eyebrow">Player dossier</p>
        <h2>Who are you in this story?</h2>
        <p>Choose a fictional household. Your circumstances shape each day’s options.</p>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            const player = { ...profile, name: profile.name.trim() }
            if (living) {
              submit(newLivingSave(player, seed.trim()))
              return
            }
            submit({
              version: 1,
              seed: seed.trim(),
              profile: player,
              choices: [],
              reviewing: false,
            })
          }}
        >
          <div className="field">
            <label htmlFor="setup-edition">Campaign edition</label>
            <select id="setup-edition" value={edition} onChange={(e) => setEdition(e.target.value)}>
              <option value="legacy">First edition · 7 days</option>
              <option value="living">Living World · 14 days</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="setup-name">Call sign</label>
            <input
              id="setup-name"
              required
              pattern=".*\S.*"
              maxLength={40}
              autoComplete="off"
              placeholder="Choose a name"
              value={profile.name}
              onInput={(e) => change('name', e.currentTarget.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="setup-city">Home city</label>
            <select
              id="setup-city"
              value={profile.city}
              onChange={(e) => change('city', e.target.value as Profile['city'])}
            >
              {Object.entries(cities).map(([city, c]) => (
                <option key={city} value={city}>
                  {city}, {c.country}
                </option>
              ))}
            </select>
          </div>
          <div className="pair">
            <div className="field">
              <label htmlFor="setup-occupation">Occupation</label>
              <select
                id="setup-occupation"
                value={profile.role}
                onChange={(e) => change('role', e.target.value as Profile['role'])}
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label htmlFor="setup-household">Household</label>
              <select
                id="setup-household"
                value={profile.household}
                onChange={(e) => change('household', e.target.value as Profile['household'])}
              >
                {households.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="field">
            <label htmlFor="setup-reserve">Starting reserve</label>
            <select
              id="setup-reserve"
              value={profile.reserve}
              onChange={(e) => change('reserve', e.target.value as Profile['reserve'])}
            >
              {Object.entries(reserves).map(([r, v]) => (
                <option value={r} key={r}>
                  {r} · {v} credits
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="setup-seed">Scenario seed</label>
            <input
              id="setup-seed"
              aria-describedby="setup-seed-help"
              spellCheck={false}
              required
              pattern=".*\S.*"
              maxLength={48}
              value={seed}
              onInput={(e) => setSeed(e.currentTarget.value)}
            />
            <small id="setup-seed-help">Use the same seed to replay the same world events.</small>
          </div>
          <button className="primary" disabled={busy}>
            Open first dispatch <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </div>
  )
}
