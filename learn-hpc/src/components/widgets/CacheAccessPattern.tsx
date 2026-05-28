import { useEffect, useState } from 'react'

type Pattern = 'sequential' | 'strided' | 'random' | 'thrash'

const PATTERN_INFO: Record<Pattern, { label: string; missRate: number; desc: string }> = {
  sequential: { label: 'sequential', missRate: 0.02, desc: 'arr[i++] — prefetcher loves this' },
  strided: { label: 'strided (64B)', missRate: 0.30, desc: 'one cache line per touch — partial hits' },
  random: { label: 'random index', missRate: 0.65, desc: 'breaks the prefetcher; cache-miss heavy' },
  thrash: { label: 'thrasher (stride = cache size)', missRate: 0.95, desc: 'designed to evict every line — adversarial signature' },
}

const ROWS = 4
const COLS = 16

function nextIdx(p: Pattern, i: number) {
  if (p === 'sequential') return (i + 1) % (ROWS * COLS)
  if (p === 'strided') return (i + 4) % (ROWS * COLS)
  if (p === 'random') return Math.floor(Math.random() * ROWS * COLS)
  // thrash — long stride
  return (i + 17) % (ROWS * COLS)
}

export function CacheAccessPattern() {
  const [pattern, setPattern] = useState<Pattern>('sequential')
  const [idx, setIdx] = useState(0)
  const [hits, setHits] = useState(0)
  const [misses, setMisses] = useState(0)
  const [running, setRunning] = useState(false)
  const info = PATTERN_INFO[pattern]

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      setIdx((i) => nextIdx(pattern, i))
      if (Math.random() < info.missRate) setMisses((m) => m + 1)
      else setHits((h) => h + 1)
    }, 90)
    return () => clearInterval(id)
  }, [running, pattern, info.missRate])

  const reset = () => {
    setHits(0)
    setMisses(0)
    setIdx(0)
  }

  const total = hits + misses || 1
  const missPct = (misses / total) * 100

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {(Object.keys(PATTERN_INFO) as Pattern[]).map((p) => (
          <button
            key={p}
            onClick={() => {
              setPattern(p)
              reset()
            }}
            className={`rounded-md border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
              pattern === p
                ? p === 'thrash'
                  ? 'border-attack bg-attack/15 text-attack-bright'
                  : 'border-signal bg-signal/15 text-signal-bright'
                : 'border-line bg-panel-2 text-muted hover:border-data/40'
            }`}
          >
            {PATTERN_INFO[p].label}
          </button>
        ))}
      </div>

      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 font-mono text-[10.5px] text-faint">{info.desc}</div>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${COLS}, 1fr)` }}
        >
          {Array.from({ length: ROWS * COLS }).map((_, i) => (
            <div
              key={i}
              className={`aspect-square rounded-sm border text-center font-mono text-[9px] leading-[20px] transition-colors ${
                i === idx
                  ? pattern === 'thrash'
                    ? 'border-attack bg-attack/60 text-base font-700'
                    : 'border-signal bg-signal/50 text-base font-700'
                  : 'border-line/50 bg-panel-2/40 text-faint'
              }`}
            >
              {(i % 16).toString(16)}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-md border border-signal/40 bg-signal/15 px-3 py-1.5 font-mono text-[12px] text-signal-bright"
        >
          {running ? '■ stop' : '▶ run'}
        </button>
        <button
          onClick={reset}
          className="rounded-md border border-line bg-panel-2 px-3 py-1.5 font-mono text-[12px] text-muted hover:text-ink"
        >
          reset
        </button>
        <span className="ml-auto font-mono text-[12px] text-faint">
          {total} accesses · {(100 - missPct).toFixed(0)}% hit · {missPct.toFixed(0)}% miss
        </span>
      </div>

      <div className="h-2 overflow-hidden rounded-full bg-panel-2">
        <div
          className={`h-full transition-all ${pattern === 'thrash' ? 'bg-attack' : 'bg-signal'}`}
          style={{ width: `${missPct}%` }}
        />
      </div>
    </div>
  )
}
