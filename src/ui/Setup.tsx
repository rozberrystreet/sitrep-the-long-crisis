import { useState } from 'react'
import { cities, defaultProfile, households, reserves, roles } from '../simulation/engine.ts'
import type { Profile } from '../simulation/engine.ts'
import type { Save } from '../save.ts'
import { Chart } from './Chart.tsx'

export function Setup({ submit, busy }: { submit: (s: Save) => void; busy: boolean }) {
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
          Two customs offices. One narrow passage. Live through the week a shipping delay reaches
          your kitchen table.
        </p>
        <Chart />
        <div className="edition">
          <span>7 daily dispatches</span>
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
            submit({
              version: 1,
              seed: seed.trim(),
              profile: { ...profile, name: profile.name.trim() },
              choices: [],
              reviewing: false,
            })
          }}
        >
          <label>
            Call sign
            <input
              required
              pattern=".*\S.*"
              maxLength={40}
              autoComplete="off"
              placeholder="Choose a name"
              value={profile.name}
              onInput={(e) => change('name', e.currentTarget.value)}
            />
          </label>
          <label>
            Home city
            <select
              value={profile.city}
              onChange={(e) => change('city', e.target.value as Profile['city'])}
            >
              {Object.entries(cities).map(([city, c]) => (
                <option key={city} value={city}>
                  {city}, {c.country}
                </option>
              ))}
            </select>
          </label>
          <div className="pair">
            <label>
              Occupation
              <select
                value={profile.role}
                onChange={(e) => change('role', e.target.value as Profile['role'])}
              >
                {roles.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </label>
            <label>
              Household
              <select
                value={profile.household}
                onChange={(e) => change('household', e.target.value as Profile['household'])}
              >
                {households.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Starting reserve
            <select
              value={profile.reserve}
              onChange={(e) => change('reserve', e.target.value as Profile['reserve'])}
            >
              {Object.entries(reserves).map(([r, v]) => (
                <option value={r} key={r}>
                  {r} · {v} credits
                </option>
              ))}
            </select>
          </label>
          <label>
            Scenario seed
            <input
              spellCheck={false}
              required
              pattern=".*\S.*"
              maxLength={48}
              value={seed}
              onInput={(e) => setSeed(e.currentTarget.value)}
            />
            <small>Use the same seed to replay the same world events.</small>
          </label>
          <button className="primary" disabled={busy}>
            Open first dispatch <span aria-hidden="true">→</span>
          </button>
        </form>
      </section>
    </div>
  )
}
