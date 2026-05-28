import { useState } from 'react'

const W = 420
const H = 200

function tanh(x: number) {
  return Math.tanh(x)
}

export function NonlinearityCurve() {
  const [xInput, setXInput] = useState(0.6)
  const xRange = 3
  const samples = 80

  const yAt = (x: number) => tanh(x)
  const points: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const x = -xRange + (i / samples) * (2 * xRange)
    points.push([x, yAt(x)])
  }

  const toSvg = (x: number, y: number): [number, number] => {
    const sx = ((x + xRange) / (2 * xRange)) * W
    const sy = H / 2 - (y * H) / 2.4
    return [sx, sy]
  }

  const path = points
    .map(([x, y], i) => {
      const [sx, sy] = toSvg(x, y)
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)} ${sy.toFixed(1)}`
    })
    .join(' ')

  const yOut = yAt(xInput)
  const [px, py] = toSvg(xInput, yOut)
  const [pxAxis] = toSvg(xInput, 0)
  const [, pyAxis] = toSvg(0, yOut)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-base/70 p-3">
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
          {/* axes */}
          <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="#262c3d" strokeWidth={0.5} />
          <line x1={W / 2} x2={W / 2} y1={0} y2={H} stroke="#262c3d" strokeWidth={0.5} />

          {/* y = ±1 reference lines */}
          <line x1={0} x2={W} y1={H / 2 - H / 2.4} y2={H / 2 - H / 2.4} stroke="#262c3d" strokeWidth={0.4} strokeDasharray="3 3" />
          <line x1={0} x2={W} y1={H / 2 + H / 2.4} y2={H / 2 + H / 2.4} stroke="#262c3d" strokeWidth={0.4} strokeDasharray="3 3" />

          {/* curve */}
          <path d={path} fill="none" stroke="#6dd596" strokeWidth={1.6} />

          {/* probe point */}
          <line x1={pxAxis} y1={H / 2} x2={px} y2={py} stroke="#ff5db1" strokeWidth={0.7} strokeDasharray="2 3" />
          <line x1={W / 2} y1={pyAxis} x2={px} y2={py} stroke="#ff5db1" strokeWidth={0.7} strokeDasharray="2 3" />
          <circle cx={px} cy={py} r={4} fill="#ff5db1" />

          {/* labels */}
          <text x={W - 16} y={H / 2 + 12} fill="#4f5970" fontSize={9} textAnchor="end" fontFamily="JetBrains Mono">x</text>
          <text x={W / 2 + 8} y={12} fill="#4f5970" fontSize={9} fontFamily="JetBrains Mono">H(x)</text>
          <text x={6} y={H / 2 - H / 2.4 - 3} fill="#4f5970" fontSize={9} fontFamily="JetBrains Mono">+1</text>
          <text x={6} y={H / 2 + H / 2.4 + 11} fill="#4f5970" fontSize={9} fontFamily="JetBrains Mono">-1</text>
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <span className="tag text-muted">input x:</span>
        <input
          type="range"
          min={-xRange}
          max={xRange}
          step={0.01}
          value={xInput}
          onChange={(e) => setXInput(parseFloat(e.target.value))}
          className="flex-1 accent-attack"
        />
        <span className="w-20 font-mono text-xs text-data-bright">
          {xInput.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 font-mono text-[12px]">
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">x</div>
          <div className="text-ink">{xInput.toFixed(3)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">H(x) = tanh(x)</div>
          <div className="text-signal-bright">{yOut.toFixed(3)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">H'(x) = 1 - tanh²(x)</div>
          <div className="text-data-bright">{(1 - yOut * yOut).toFixed(3)}</div>
        </div>
      </div>
    </div>
  )
}
