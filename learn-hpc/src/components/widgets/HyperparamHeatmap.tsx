import { useState } from 'react'

/**
 * Models the paper's Fig. 2(a) accuracy-vs-(Gi, Gf) sweep with a smoothed
 * surface — peaks near (Gi=0.6, Gf<0.6) and degrades sharply for low Gi.
 */
function predictedAcc(Gi: number, Gf: number) {
  const giScore = Math.exp(-Math.pow(Gi - 0.55, 2) / 0.05)
  const gfPenalty = Gf > 0.65 ? Math.pow(Gf - 0.65, 2) * 4 : 0
  const noise = (Math.sin(Gi * 47 + Gf * 31) + 1) * 0.005
  const a = 0.55 + giScore * 0.45 - gfPenalty + noise
  return Math.max(0.5, Math.min(0.99, a))
}

const GRID = 9 // 9x9 cells

export function HyperparamHeatmap() {
  const [hover, setHover] = useState<[number, number] | null>([5, 3])
  const cellPx = 36

  const cells: { gi: number; gf: number; acc: number }[][] = []
  for (let r = 0; r < GRID; r++) {
    const row: { gi: number; gf: number; acc: number }[] = []
    for (let c = 0; c < GRID; c++) {
      const gi = (c / (GRID - 1)) * 0.9 + 0.05
      const gf = (r / (GRID - 1)) * 0.9 + 0.05
      row.push({ gi, gf, acc: predictedAcc(gi, gf) })
    }
    cells.push(row)
  }

  function color(acc: number) {
    // 0.5 -> dim red ; 1.0 -> bright green
    const t = (acc - 0.5) / 0.5
    const r = Math.round(255 * (1 - t) + 109 * t)
    const g = Math.round(80 * (1 - t) + 213 * t)
    const b = Math.round(120 * (1 - t) + 150 * t)
    return `rgb(${r},${g},${b})`
  }

  const hoverCell = hover ? cells[hover[0]][hover[1]] : null

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] text-faint">
          <span>predicted accuracy across (G_i, G_f)</span>
          <span>hover a cell</span>
        </div>
        <div className="flex gap-2">
          {/* y-axis label */}
          <div className="flex flex-col items-center justify-between py-1 font-mono text-[10px] text-faint">
            <span>0.95</span>
            <span style={{ writingMode: 'vertical-rl' }}>G_f</span>
            <span>0.05</span>
          </div>
          <div>
            <div
              className="grid gap-0.5"
              style={{ gridTemplateColumns: `repeat(${GRID}, ${cellPx}px)` }}
            >
              {cells.flatMap((row, r) =>
                row.map((c, ci) => (
                  <div
                    key={`${r}-${ci}`}
                    onMouseEnter={() => setHover([r, ci])}
                    style={{ width: cellPx, height: cellPx, background: color(c.acc) }}
                    className={`relative cursor-pointer rounded-sm transition-transform hover:scale-110 ${
                      hover && hover[0] === r && hover[1] === ci
                        ? 'ring-2 ring-data shadow-glow-data'
                        : ''
                    }`}
                  >
                    <span className="absolute inset-0 flex items-center justify-center font-mono text-[9px] text-black/70">
                      {(c.acc * 100).toFixed(0)}
                    </span>
                  </div>
                )),
              )}
            </div>
            <div className="mt-1 flex items-center justify-between font-mono text-[10px] text-faint">
              <span>0.05</span>
              <span>G_i</span>
              <span>0.95</span>
            </div>
          </div>
        </div>
      </div>

      {hoverCell && (
        <div className="grid grid-cols-3 gap-2 font-mono text-[12px]">
          <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
            <div className="tag text-faint">G_i</div>
            <div className="text-signal-bright">{hoverCell.gi.toFixed(2)}</div>
          </div>
          <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
            <div className="tag text-faint">G_f</div>
            <div className="text-data-bright">{hoverCell.gf.toFixed(2)}</div>
          </div>
          <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
            <div className="tag text-faint">predicted acc</div>
            <div className={hoverCell.acc >= 0.9 ? 'text-signal-bright' : 'text-warn-bright'}>
              {(hoverCell.acc * 100).toFixed(1)}%
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
