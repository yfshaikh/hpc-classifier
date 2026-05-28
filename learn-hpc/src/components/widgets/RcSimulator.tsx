import { useMemo, useState } from 'react'

/**
 * Toy RC simulator implementing the paper's Eq. 1:
 *   R_k[n] = H( G_i * W_k . X[n] + G_f * Wr_k . R[n-1] )
 *
 * - Input X[n] is a single scalar stepped pulse to keep things visual.
 * - W is N x 1 with {0,1} weights (each neuron gets the input or doesn't).
 * - Wr is sparse identity-ish (each neuron's recurrent weight is 0 or 1).
 * - H is tanh.
 *
 * Not training the readout here — point is to feel how Gi/Gf/N change
 * reservoir dynamics.
 */

function seedWeights(N: number, seed: number) {
  let s = seed
  const r = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const W: number[] = Array.from({ length: N }, () => (r() < 0.7 ? 1 : 0))
  const Wr: number[] = Array.from({ length: N }, () => (r() < 0.5 ? 1 : 0))
  if (W.every((w) => w === 0)) (W as number[])[0] = 1 // avoid all-dead reservoir
  return { W, Wr }
}

const T = 80 // timesteps

function inputAt(n: number) {
  // Square pulse: on between t=10..40, off otherwise.
  return n >= 10 && n < 40 ? 1 : 0
}

export function RcSimulator() {
  const [Gi, setGi] = useState(0.6)
  const [Gf, setGf] = useState(0.4)
  const [N, setN] = useState(4)
  const [seed, setSeed] = useState(3)

  const states = useMemo(() => {
    const { W, Wr } = seedWeights(N, seed)
    const R: number[][] = Array.from({ length: N }, () => Array(T).fill(0))
    for (let t = 0; t < T; t++) {
      const x = inputAt(t)
      for (let k = 0; k < N; k++) {
        const prev = t === 0 ? 0 : R[k][t - 1]
        const pre = Gi * W[k] * x + Gf * Wr[k] * prev
        R[k][t] = Math.tanh(pre)
      }
    }
    return { R, W, Wr }
  }, [Gi, Gf, N, seed])

  const W = 540
  const H = 22 // per-neuron strip height
  const totalH = H * N + 20

  // Plot each neuron as its own row
  function strip(values: number[], yCenter: number) {
    const step = W / (T - 1)
    return values
      .map((v, i) => {
        const x = i * step
        const y = yCenter - v * (H * 0.42)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`
      })
      .join(' ')
  }

  // Stability proxy: spectral radius for our trivially-diagonal Wr is just max(|Wr_k|) * Gf
  // (since Wr is diagonal with entries 0/1, eigenvalues are those entries).
  const specRadius = Gf * Math.max(...states.Wr)

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">G_i (input gain)</span>
            <span className="font-mono text-[11px] text-signal-bright">{Gi.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={Gi} onChange={(e) => setGi(parseFloat(e.target.value))} className="w-full accent-signal" />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">G_f (feedback gain)</span>
            <span className="font-mono text-[11px] text-data-bright">{Gf.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1.2} step={0.05} value={Gf} onChange={(e) => setGf(parseFloat(e.target.value))} className="w-full accent-data" />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">N (neurons)</span>
            <span className="font-mono text-[11px] text-attack-bright">{N}</span>
          </div>
          <input type="range" min={1} max={8} step={1} value={N} onChange={(e) => setN(parseInt(e.target.value))} className="w-full accent-attack" />
        </div>
      </div>

      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] text-faint">
          <span>reservoir state per neuron — input pulse on t=10..40</span>
          <button onClick={() => setSeed((s) => s + 1)} className="rounded border border-line bg-panel-2 px-2 py-0.5 text-muted hover:border-signal/40 hover:text-signal">
            ↻ reseed W
          </button>
        </div>
        <svg viewBox={`0 0 ${W} ${totalH}`} className="block w-full">
          {/* input pulse band */}
          <rect x={(10 / (T - 1)) * W} y={0} width={((40 - 10) / (T - 1)) * W} height={totalH} fill="#7fb6ff" fillOpacity={0.05} />
          {states.R.map((row, k) => {
            const y0 = H * (k + 0.5)
            return (
              <g key={k}>
                <line x1={0} x2={W} y1={y0} y2={y0} stroke="#262c3d" strokeWidth={0.4} />
                <path d={strip(row, y0)} fill="none" stroke={states.W[k] ? '#6dd596' : '#4f5970'} strokeWidth={1.4} />
                <text x={6} y={y0 - 6} fill="#4f5970" fontSize={9} fontFamily="JetBrains Mono">
                  k={k} · W={states.W[k]} · Wr={states.Wr[k]}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[12px]">
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">spectral radius (proxy)</div>
          <div className={specRadius > 1 ? 'text-attack-bright' : 'text-signal-bright'}>
            ρ ≈ {specRadius.toFixed(2)}
          </div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">echo state property</div>
          <div className={specRadius > 1 ? 'text-attack-bright' : 'text-go'}>
            {specRadius > 1 ? 'violated ↯' : 'holds ✓'}
          </div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">paper operating point</div>
          <div className="text-ink">G_i=0.6 G_f=0.4 N=4</div>
        </div>
      </div>
    </div>
  )
}
