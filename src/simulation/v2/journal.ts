import type { Change, Trace } from './types.ts'

// A journal belongs to one tick. The state passed to the engine is never mutated.
export class Journal {
  readonly day: number
  readonly traces: Trace[] = []
  readonly latest: Record<string, string>

  constructor(day: number, previous: Record<string, string>) {
    this.day = day
    this.latest = { ...previous }
  }

  fact(reason: string, parents: string[] = []) {
    const id = 'd' + this.day + '.' + (this.traces.length + 1)
    this.traces.push({ id, reason, parents: [...new Set(parents)] })
    return id
  }

  measure(
    metric: string,
    before: number,
    after: number,
    reason: string,
    parents: string[],
    carry = true
  ) {
    const previous = this.latest[metric]
    const id = 'd' + this.day + '.' + (this.traces.length + 1)
    const trace: Change = {
      id,
      metric,
      before,
      after,
      reason,
      parents: [...new Set(carry && previous ? [...parents, previous] : parents)],
    }
    this.traces.push(trace)
    this.latest[metric] = id
    return after
  }
}
