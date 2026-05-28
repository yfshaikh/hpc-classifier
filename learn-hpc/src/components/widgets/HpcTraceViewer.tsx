import { useMemo, useState } from 'react'

type Event = 'branch_misses' | 'cache_misses' | 'bus_cycles' | 'instructions'

const EVENTS: { id: Event; label: string; benignBase: number; benignVar: number; advBase: number; advVar: number; advSpike: number }[] = [
  { id: 'branch_misses', label: 'branch-misses', benignBase: 40, benignVar: 8, advBase: 60, advVar: 20, advSpike: 80 },
  { id: 'cache_misses', label: 'cache-misses', benignBase: 30, benignVar: 6, advBase: 75, advVar: 30, advSpike: 120 },
  { id: 'bus_cycles', label: 'bus-cycles', benignBase: 55, benignVar: 4, advBase: 70, advVar: 18, advSpike: 60 },
  { id: 'instructions', label: 'instructions', benignBase: 80, benignVar: 6, advBase: 65, advVar: 20, advSpike: 40 },
]

// Pseudo-random but deterministic generator for stable traces per seed
function rand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function genBenign(n: number, base: number, variance: number, seed: number): number[] {
  const r = rand(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    // periodic + noise
    const periodic = Math.sin((i / n) * Math.PI * 4) * variance * 0.4
    const noise = (r() - 0.5) * variance
    out.push(base + periodic + noise)
  }
  return out
}

function genAdversarial(n: number, base: number, variance: number, spike: number, seed: number): number[] {
  const r = rand(seed)
  const out: number[] = []
  for (let i = 0; i < n; i++) {
    const noisy = base + (r() - 0.5) * variance
    const spikeHit = r() < 0.18 ? spike * (0.5 + r() * 0.7) : 0
    out.push(noisy + spikeHit)
  }
  return out
}

function pathFor(values: number[], width: number, height: number, yMin: number, yMax: number) {
  const step = width / (values.length - 1)
  return values
    .map((v, i) => {
      const x = i * step
      const y = height - ((v - yMin) / (yMax - yMin)) * height
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`
    })
    .join(' ')
}

export function HpcTraceViewer() {
  const [eventId, setEventId] = useState<Event>('cache_misses')
  const [seed, setSeed] = useState(1)
  const ev = EVENTS.find((e) => e.id === eventId)!

  const benign = useMemo(() => genBenign(120, ev.benignBase, ev.benignVar, seed), [ev, seed])
  const adv = useMemo(() => genAdversarial(120, ev.advBase, ev.advVar, ev.advSpike, seed + 7), [ev, seed])

  const all = [...benign, ...adv]
  const lo = Math.min(...all) - 5
  const hi = Math.max(...all) + 5

  const W = 560
  const H = 160

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="tag text-muted">event:</span>
        {EVENTS.map((e) => (
          <button
            key={e.id}
            onClick={() => setEventId(e.id)}
            className={`rounded-md border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
              eventId === e.id
                ? 'border-data bg-data/15 text-data-bright'
                : 'border-line bg-panel-2 text-muted hover:border-data/40'
            }`}
          >
            {e.label}
          </button>
        ))}
        <button
          onClick={() => setSeed((s) => s + 1)}
          className="ml-auto rounded-md border border-line bg-panel-2 px-2.5 py-1 font-mono text-[11.5px] text-muted transition-colors hover:border-signal/40 hover:text-signal"
        >
          ↻ resample
        </button>
      </div>

      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] text-faint">
          <span>{ev.label} (counts / 1 ms window)</span>
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-signal" /> benign
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-sm bg-attack" /> adversarial
            </span>
          </span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
          {/* gridlines */}
          {[0.25, 0.5, 0.75].map((p) => (
            <line
              key={p}
              x1={0}
              x2={W}
              y1={H * p}
              y2={H * p}
              stroke="#262c3d"
              strokeWidth={0.5}
            />
          ))}
          {/* benign */}
          <path d={pathFor(benign, W, H, lo, hi)} fill="none" stroke="#6dd596" strokeWidth={1.4} />
          {/* adversarial */}
          <path d={pathFor(adv, W, H, lo, hi)} fill="none" stroke="#ff5db1" strokeWidth={1.4} />
        </svg>
        <div className="mt-1 font-mono text-[10px] text-faint">
          x: time (ms) →   y: count
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 font-mono text-xs">
        <div className="rounded-md border border-signal/30 bg-signal/[0.04] p-3">
          <div className="tag mb-1 text-signal-bright">benign stats</div>
          <div>μ ≈ {(benign.reduce((a, b) => a + b, 0) / benign.length).toFixed(1)}</div>
          <div>
            σ ≈{' '}
            {Math.sqrt(
              benign.reduce((a, b) => a + Math.pow(b - benign.reduce((x, y) => x + y, 0) / benign.length, 2), 0) /
                benign.length,
            ).toFixed(1)}
          </div>
        </div>
        <div className="rounded-md border border-attack/30 bg-attack/[0.04] p-3">
          <div className="tag mb-1 text-attack-bright">adversarial stats</div>
          <div>μ ≈ {(adv.reduce((a, b) => a + b, 0) / adv.length).toFixed(1)}</div>
          <div>
            σ ≈{' '}
            {Math.sqrt(
              adv.reduce((a, b) => a + Math.pow(b - adv.reduce((x, y) => x + y, 0) / adv.length, 2), 0) /
                adv.length,
            ).toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  )
}
