import { actions, canChoose, DAYS, metricNames, terms } from '../simulation/engine.ts'
import type { Account, Action, Receipt, State } from '../simulation/engine.ts'
import { actionNames, dispatches, localBrief, options, worldBrief } from '../simulation/dispatch.ts'
import { Chart } from './Chart.tsx'

export function Ledger({ account }: { account: Account }) {
  return (
    <dl className="ledger">
      {(Object.keys(metricNames) as (keyof Account)[]).map((k) => (
        <div key={k}>
          <dt>{metricNames[k]}</dt>
          <dd>
            {account[k]}
            <small>{{ cash: ' cr', supplies: ' portions', energy: '/10', ties: '/10' }[k]}</small>
          </dd>
        </div>
      ))}
    </dl>
  )
}
export function FieldNote({ day }: { day: number }) {
  const item = dispatches[day - 1]
  return (
    <aside className="note">
      <p className="eyebrow">Field note · {String(day).padStart(2, '0')}</p>
      <h3>{item.concept}</h3>
      <p>{item.lesson}</p>
    </aside>
  )
}
export function Issue({
  state,
  choose,
  busy,
}: {
  state: State
  choose: (a: Action) => void
  busy: boolean
}) {
  const item = dispatches[state.day - 1],
    descriptions = options(state)
  return (
    <div className="layout">
      <article>
        <p className="eyebrow">
          <span className="signal" /> Daily SITREP <span className="divider">/</span> Day{' '}
          {state.day} of {DAYS}
        </p>
        <h1 className="headline" tabIndex={-1}>
          {item.headline}
        </h1>
        <p className="standfirst">{item.story}</p>
        <Chart pressure={state.world.pressure} />
        <p className="eyebrow space">From the anchorage</p>
        <p>{worldBrief(state)}</p>
        <p className="eyebrow space">Local dispatch · {state.profile.city}</p>
        <h2>At your door</h2>
        <p>{localBrief(state)}</p>
        <p className="world">
          Negotiation progress <b>{state.world.talks}/10</b> · Local portion{' '}
          <b>{terms(state).price} cr</b>
        </p>
        <FieldNote day={state.day} />
      </article>
      <section className="dossier">
        <p className="eyebrow">Household desk · {state.profile.name}</p>
        <h2>Your next move</h2>
        <Ledger account={state.account} />
        <p>Choose one action before tonight’s meal. Food in your pantry is used first.</p>
        <div className="choices">
          {actions.map((a, i) => (
            <button key={a} disabled={busy || !canChoose(state, a)} onClick={() => choose(a)}>
              <span className="letter">{String.fromCharCode(65 + i)}</span>
              <span>
                <b>{actionNames[a]}</b>
                <small>{descriptions[a]}</small>
                {!canChoose(state, a) && <small>Insufficient cash</small>}
              </span>
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}
export function Outcome({ r, proceed, busy }: { r: Receipt; proceed: () => void; busy: boolean }) {
  return (
    <div className="layout">
      <article>
        <p className="eyebrow">
          <span className="signal" /> Evening ledger · Day {r.day}
        </p>
        <h1 className="headline" tabIndex={-1}>
          {actionNames[r.action]}.
        </h1>
        <p className="standfirst">
          The day is settled. Here’s how your decision and the evening meal changed your household.
        </p>
        <table>
          <caption>Household balance</caption>
          <thead>
            <tr>
              <th>Measure</th>
              <th>Before</th>
              <th>After</th>
            </tr>
          </thead>
          <tbody>
            {(Object.keys(metricNames) as (keyof Account)[]).map((k) => (
              <tr key={k}>
                <th>{metricNames[k]}</th>
                <td>{r.before[k]}</td>
                <td>{r.after[k]}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <FieldNote day={r.day} />
      </article>
      <section className="dossier">
        <p className="eyebrow">Decision record</p>
        <h2>What changed</h2>
        <ul className="entries">
          {r.entries.map((e, i) => (
            <li key={i}>
              <b>
                {e.change > 0 ? '+' : ''}
                {e.change} {metricNames[e.metric].toLowerCase()}
              </b>
              <span>
                {e.reason}
                {e.change === 0 ? ' · at limit or zero cost' : ''}
              </span>
            </li>
          ))}
        </ul>
        <button className="primary" disabled={busy} onClick={proceed}>
          {r.day === DAYS ? 'Read week in review' : 'Open next dispatch'} <span>→</span>
        </button>
      </section>
    </div>
  )
}
export function Debrief({
  state,
  receipts,
  restart,
  busy,
}: {
  state: State
  receipts: Receipt[]
  restart: () => void
  busy: boolean
}) {
  return (
    <div className="layout">
      <article>
        <p className="eyebrow">
          <span className="signal" /> Closing edition · Seven days filed
        </p>
        <h1 className="headline" tabIndex={-1}>
          Week in review.
        </h1>
        <p className="standfirst">
          {state.profile.name}, your household in {state.profile.city} finished the week with{' '}
          {state.account.cash} credits and {state.account.supplies} pantry portions.
        </p>
        <Ledger account={state.account} />
        <Chart pressure={state.world.pressure} />
      </article>
      <section className="dossier">
        <p className="eyebrow">Archive · {state.seed}</p>
        <h2>Your decision record</h2>
        {receipts.map((r) => (
          <details key={r.day}>
            <summary>
              Day {r.day} · {actionNames[r.action]}
            </summary>
            <ul>
              {r.entries.map((e, i) => (
                <li key={i}>
                  {e.reason} ({e.change > 0 ? '+' : ''}
                  {e.change} {metricNames[e.metric].toLowerCase()})
                </li>
              ))}
            </ul>
          </details>
        ))}
        <button className="primary" onClick={restart} disabled={busy}>
          Start another issue <span>→</span>
        </button>
      </section>
    </div>
  )
}
