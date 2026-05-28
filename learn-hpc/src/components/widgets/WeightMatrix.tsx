import { useMemo, useState } from 'react'

function genMatrix(N: number, d: number, sparsity: number, seed: number) {
  let s = seed
  const r = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
  const M: number[][] = []
  for (let i = 0; i < N; i++) {
    const row: number[] = []
    for (let j = 0; j < d; j++) {
      row.push(r() < sparsity ? 1 : 0)
    }
    M.push(row)
  }
  return M
}

export function WeightMatrix() {
  const [N, setN] = useState(4)
  const [d, setD] = useState(4)
  const [sparsity, setSparsity] = useState(0.5)
  const [seed, setSeed] = useState(11)

  const W = useMemo(() => genMatrix(N, d, sparsity, seed), [N, d, sparsity, seed])
  const ones = W.reduce((acc, row) => acc + row.reduce((a, b) => a + b, 0), 0)
  const total = N * d
  const actualSparsity = ones / total

  // Reservoir matrix is sparse and "identity-ish" — model it differently:
  const Wr = useMemo(() => {
    let s = seed + 99
    const r = () => {
      s = (s * 9301 + 49297) % 233280
      return s / 233280
    }
    const M: number[][] = []
    for (let i = 0; i < N; i++) {
      const row: number[] = Array(N).fill(0)
      row[i] = r() < 0.7 ? 1 : 0 // diagonal-dominant 0/1
      M.push(row)
    }
    return M
  }, [N, seed])

  const cellSize = Math.max(24, Math.min(48, 320 / Math.max(N, d)))

  function Matrix({ M, title, color }: { M: number[][]; title: string; color: string }) {
    return (
      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[11px] text-faint">
          <span className="tag">{title}</span>
          <span>{M.length}×{M[0].length}</span>
        </div>
        <div
          className="grid gap-0.5"
          style={{ gridTemplateColumns: `repeat(${M[0].length}, ${cellSize}px)` }}
        >
          {M.flatMap((row, i) =>
            row.map((v, j) => (
              <div
                key={`${i}-${j}`}
                style={{
                  width: cellSize,
                  height: cellSize,
                  background: v ? color : 'rgba(255,255,255,0.03)',
                }}
                className={`rounded-sm border ${v ? 'border-transparent' : 'border-line'} flex items-center justify-center font-mono text-[10px] ${v ? 'text-base font-700' : 'text-faint'}`}
              >
                {v}
              </div>
            )),
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">N (neurons)</span>
            <span className="font-mono text-[11px] text-data-bright">{N}</span>
          </div>
          <input type="range" min={2} max={8} value={N} onChange={(e) => setN(parseInt(e.target.value))} className="w-full accent-data" />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">d (input features)</span>
            <span className="font-mono text-[11px] text-data-bright">{d}</span>
          </div>
          <input type="range" min={1} max={8} value={d} onChange={(e) => setD(parseInt(e.target.value))} className="w-full accent-data" />
        </div>
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">P(W_ij = 1)</span>
            <span className="font-mono text-[11px] text-signal-bright">{sparsity.toFixed(2)}</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={sparsity} onChange={(e) => setSparsity(parseFloat(e.target.value))} className="w-full accent-signal" />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setSeed((s) => s + 1)}
            className="w-full rounded-md border border-line bg-panel-2 px-3 py-1.5 font-mono text-[12px] text-muted transition-colors hover:border-signal/40 hover:text-signal"
          >
            ↻ reseed
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Matrix M={W} title="W  (input weights, N×d)" color="#6dd596" />
        <Matrix M={Wr} title="Wr (reservoir weights, N×N)" color="#7fb6ff" />
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[12px]">
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">ones in W</div>
          <div className="text-signal-bright">{ones} / {total}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">actual sparsity</div>
          <div className="text-data-bright">{actualSparsity.toFixed(2)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">multiplies replaced by</div>
          <div className="text-warn-bright">adds (free)</div>
        </div>
      </div>
    </div>
  )
}
