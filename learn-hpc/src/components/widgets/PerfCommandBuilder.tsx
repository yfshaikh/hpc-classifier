import { useState } from 'react'

const ALL_EVENTS = [
  'branch-misses',
  'cache-misses',
  'bus-cycles',
  'instructions',
  'cpu-cycles',
  'L1-dcache-load-misses',
  'iTLB-load-misses',
  'page-faults',
]

export function PerfCommandBuilder() {
  const [events, setEvents] = useState<string[]>(['branch-misses', 'cache-misses', 'bus-cycles', 'instructions'])
  const [intervalMs, setIntervalMs] = useState(1)
  const [pid, setPid] = useState('')
  const [program, setProgram] = useState('./benign')

  const toggle = (e: string) => {
    setEvents((cur) => (cur.includes(e) ? cur.filter((x) => x !== e) : [...cur, e]))
  }

  const cmd = (() => {
    const parts = ['perf', 'stat']
    parts.push('-e', events.join(','))
    parts.push('-I', String(intervalMs))
    parts.push('-x', ',')
    if (pid) {
      parts.push('-p', pid)
    } else {
      parts.push('--', program)
    }
    return parts.join(' ')
  })()

  const overLimit = events.length > 4

  return (
    <div className="space-y-3">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="tag text-muted">events (PMU has a hardware limit, typically 4)</span>
          <span className={`font-mono text-[11px] ${overLimit ? 'text-fault' : 'text-data-bright'}`}>
            {events.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {ALL_EVENTS.map((e) => {
            const on = events.includes(e)
            return (
              <button
                key={e}
                onClick={() => toggle(e)}
                className={`rounded-md border px-2 py-1 font-mono text-[11.5px] transition-colors ${
                  on
                    ? 'border-signal bg-signal/15 text-signal-bright'
                    : 'border-line bg-panel-2 text-muted hover:border-signal/40'
                }`}
              >
                {e}
              </button>
            )
          })}
        </div>
        {overLimit && (
          <div className="mt-2 rounded border border-fault/40 bg-fault/[0.08] px-3 py-1.5 text-[12px] text-fault">
            ⚠ exceeded 4 events. The kernel will multiplex — counts get scaled to estimates. Stick to 4.
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <span className="tag text-muted">interval (ms)</span>
          <input
            type="number"
            min={1}
            value={intervalMs}
            onChange={(e) => setIntervalMs(parseInt(e.target.value) || 1)}
            className="mt-1 w-full rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-sm text-ink focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <span className="tag text-muted">target (--pid OR program)</span>
          <input
            type="text"
            placeholder="leave empty to run program"
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-sm text-ink focus:border-signal focus:outline-none"
          />
        </div>
        <div>
          <span className="tag text-muted">program (if no PID)</span>
          <input
            type="text"
            value={program}
            onChange={(e) => setProgram(e.target.value)}
            className="mt-1 w-full rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-sm text-ink focus:border-signal focus:outline-none"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-line bg-[#0a0d14] p-3">
        <div className="tag mb-1 text-faint">$ assembled command</div>
        <code className="block whitespace-pre-wrap font-mono text-[13px] text-data-bright">
          {cmd}
        </code>
      </div>
    </div>
  )
}
