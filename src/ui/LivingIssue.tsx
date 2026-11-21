import { useEffect, useRef, useState } from 'react'
import type { LivingSave } from '../campaignSave.ts'
import { morning, replay } from '../simulation/v2/engine.ts'
import { actionNames, decisions, unavailable } from '../simulation/v2/decisions.ts'
import type { Terms } from '../simulation/v2/decisions.ts'
import { effectNames } from '../simulation/v2/consequences.ts'
import { actors, orison } from '../simulation/v2/scenario.ts'
import { explain, outcome } from '../simulation/v2/explain.ts'
import { portions, units } from '../simulation/v2/household.ts'
import type {
  Change,
  Decision,
  Household,
  Receipt,
  Scheduled,
  Trace,
} from '../simulation/v2/types.ts'

function Balances({ account }: { account: Household }) {
  return (
    <dl className="ledger">
      {(Object.keys(units) as (keyof Household)[]).map((key) => (
        <div key={key}>
          <dt>{units[key]}</dt>
          <dd>{account[key]}</dd>
        </div>
      ))}
    </dl>
  )
}
function Commitments({ pending }: { pending: Scheduled[] }) {
  if (!pending.length) return null
  return (
    <section>
      <h3>Still to come</h3>
      <ul>
        {[...pending]
          .sort((a, b) => a.due - b.due)
          .map((item) => (
            <li key={item.origin}>
              Day {item.due} · {effectNames[item.kind]}
            </li>
          ))}
      </ul>
    </section>
  )
}
function traceLabel(trace: Trace) {
  if (!('metric' in trace)) return trace.reason
  return trace.reason + ' (' + trace.before + ' → ' + trace.after + ')'
}
function ReceiptLedger({ receipt, history }: { receipt: Receipt; history: Receipt[] }) {
  const [path, setPath] = useState<string[]>([])
  const selected = path.at(-1)
  const readerTitle = useRef<HTMLHeadingElement>(null)
  const trigger = useRef<HTMLButtonElement | null>(null)
  useEffect(() => {
    if (selected) readerTitle.current?.focus()
  }, [selected])
  const causes = selected ? explain(history, selected) : []
  const item = causes.at(-1)
  const entries = receipt.traces.filter(
    (t): t is Change => 'metric' in t && t.metric.startsWith('household.')
  )
  return (
    <>
      <ul className="entries">
        {entries.map((row) => {
          const delta = row.after - row.before
          return (
            <li key={row.id}>
              <b>
                {delta > 0 ? '+' : ''}
                {delta} {units[row.metric.slice(10) as keyof Household]}
              </b>
              <span>{row.reason}</span>
              <button
                className="link"
                aria-label={'Trace change: ' + row.reason}
                onClick={(e) => {
                  trigger.current = e.currentTarget
                  setPath([row.id])
                }}
              >
                Trace change
              </button>
            </li>
          )
        })}
      </ul>
      <section className="cause-reader">
        {item && (
          <>
            <h3 ref={readerTitle} tabIndex={-1}>
              Where this came from
            </h3>
            <p>{traceLabel(item)}</p>
            {item.parents.length ? (
              <ul>
                {item.parents.map((id) => {
                  const parent = causes.find((t) => t.id === id)!
                  return (
                    <li key={id}>
                      <button className="link" onClick={() => setPath([...path, id])}>
                        Day {id.slice(1).split('.')[0]} · {traceLabel(parent)}
                      </button>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <p>This is the recorded source.</p>
            )}
            {path.length > 1 && (
              <button className="link" onClick={() => setPath(path.slice(0, -1))}>
                Back one cause
              </button>
            )}
            <button
              className="link"
              onClick={() => {
                setPath([])
                trigger.current?.focus()
              }}
            >
              Return to ledger
            </button>
          </>
        )}
      </section>
    </>
  )
}
function comparison(action: Decision, terms: Terms) {
  switch (action) {
    case 'shift':
      return (
        'Earn ' +
        terms.pay +
        ' credits for 2 energy.' +
        (terms.premiumDue
          ? ' Another 12 credits on day ' + terms.premiumDue + ' if local shift demand reaches 3.'
          : ' Final shifts pay the immediate rate.')
      )
    case 'reserve':
      return (
        'Pay ' +
        terms.deposit +
        ' credits today.' +
        (terms.crateDue ? ' Six portions arrive on day ' + terms.crateDue + '.' : '')
      )
    case 'roster':
      return (
        'Gain 1 portion and 2 trust for 2 energy.' +
        (terms.allocationDue
          ? ' On day ' +
            terms.allocationDue +
            ', receive 4 portions at trust 4 or higher, otherwise 1.'
          : ' The rota now pays the immediate portion only.')
      )
    case 'rest':
      return 'Recover up to 3 energy. Ordinary income continues.'
  }
}
export function LivingIssue({
  save,
  busy,
  change,
  restart,
}: {
  save: LivingSave
  busy: boolean
  change: (next: LivingSave) => void
  restart: () => void
}) {
  const state = replay(save.profile, save.seed, save.choices)
  const last = state.history.at(-1)
  if (save.reviewing && last)
    return (
      <div className="layout">
        <article>
          <p className="eyebrow">Evening ledger · Day {last.day}</p>
          <h1 className="headline" tabIndex={-1}>
            {actionNames[last.decision]}.
          </h1>
          <Balances account={last.closing} />
          <Commitments pending={state.pending} />
          <button
            className="primary"
            disabled={busy}
            onClick={() => change({ ...save, reviewing: false })}
          >
            {state.day === orison.days ? 'Read campaign review' : 'Open next dispatch'}
          </button>
        </article>
        <section className="dossier">
          <h2>Household ledger</h2>
          <ReceiptLedger key={last.day} receipt={last} history={state.history} />
        </section>
      </div>
    )
  if (state.day === orison.days)
    return (
      <div className="layout">
        <article>
          <p className="eyebrow">Closing edition · Orison Strait</p>
          <h1 className="headline" tabIndex={-1}>
            Fourteen days at the strait.
          </h1>
          <h2>{outcome(state.household)}</h2>
          <p>
            {save.profile.name} in {save.profile.city} finished with {state.household.cash} credits,{' '}
            {state.household.trust} trust and {state.household.missed} missed portions.
          </p>
          <Balances account={state.household} />
          <button className="primary" disabled={busy} onClick={restart}>
            Start another issue
          </button>
        </article>
        <section className="dossier">
          <h2>Decision archive</h2>
          {state.history.map((r) => (
            <details key={r.day}>
              <summary>
                Day {r.day} · {actionNames[r.decision]}
              </summary>
              <ReceiptLedger receipt={r} history={state.history} />
            </details>
          ))}
        </section>
      </div>
    )
  const { day, strait, household, market, terms, pending, journal } = morning(state)
  const lead = strait.events.at(-1)!.event
  const deliveries = journal.traces.filter(
    (t) => 'metric' in t && t.metric.startsWith('household.')
  )
  return (
    <div className="layout">
      <article>
        <p className="eyebrow">
          <span className="signal" /> Daily SITREP · Day {day} of {orison.days}
        </p>
        <h1 className="headline" tabIndex={-1}>
          {lead.headline}
        </h1>
        <p className="standfirst">{lead.dispatch}</p>
        <p className="eyebrow">Fictional dispatch · {actors[lead.source]}</p>
        <h2>At your door</h2>
        <p>
          In {save.profile.city}, a portion costs <b>{market.price} credits</b>. Your household
          needs {portions(save.profile)} portions tonight.
        </p>
        <p className="world">
          Strait queue {strait.queue}/50 · Depot stock {market.inventory}/30 · Shift demand{' '}
          {market.jobs}/6
        </p>
        <details>
          <summary>Today’s active events</summary>
          <ul>
            {strait.events.map(({ event }) => (
              <li key={event.id}>
                {event.headline} {actors[event.source]} · {event.severity} · days {event.starts}–
                {event.starts + event.duration - 1}
              </li>
            ))}
          </ul>
        </details>
      </article>
      <section className="dossier">
        <p className="eyebrow">Household desk · {save.profile.name}</p>
        <h2>Your next move</h2>
        <Balances account={household} />
        <details>
          <summary>Morning transactions</summary>
          <ul>
            {deliveries.map((t) => (
              <li key={t.id}>{traceLabel(t)}</li>
            ))}
          </ul>
        </details>
        <Commitments pending={pending} />
        <div className="choices">
          {decisions.map((action, i) => {
            const blocked = unavailable(action, household, terms)
            return (
              <button
                key={action}
                disabled={busy || Boolean(blocked)}
                onClick={() =>
                  change({ ...save, reviewing: true, choices: [...save.choices, action] })
                }
              >
                <span className="letter" aria-hidden="true">
                  {String.fromCharCode(65 + i)}
                </span>
                <span>
                  <b>{actionNames[action]}</b>
                  <small>{comparison(action, terms)}</small>
                  {blocked && <small>{blocked}</small>}
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </div>
  )
}
