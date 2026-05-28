import { useState } from 'react'

/**
 * Models how classification accuracy decays as input noise grows.
 * Roughly mirrors paper Fig. 3(b): flat ≤ ~1mV-equivalent, gentle drop after.
 */
function accuracyAt(noiseLevel: number) {
  // noiseLevel in [0, 5]; noiseLevel of 1 ≈ paper's 1 mV reference
  const base = 0.978
  if (noiseLevel <= 1) return base - 0.001 * noiseLevel
  const beyond = noiseLevel - 1
  return Math.max(0.5, base - 0.02 * beyond - 0.04 * beyond * beyond)
}

const W = 480
const H = 160

export function NoisePerturbation() {
  const [noise, setNoise] = useState(0.5)
  const samples = 80

  const pts: [number, number][] = []
  for (let i = 0; i <= samples; i++) {
    const x = (i / samples) * 5
    pts.push([x, accuracyAt(x)])
  }

  const toSvg = (x: number, y: number): [number, number] => {
    const sx = (x / 5) * W
    const sy = H - ((y - 0.5) / 0.5) * H
    return [sx, sy]
  }

  const path = pts
    .map(([x, y], i) => {
      const [sx, sy] = toSvg(x, y)
      return `${i === 0 ? 'M' : 'L'}${sx.toFixed(1)} ${sy.toFixed(1)}`
    })
    .join(' ')

  const acc = accuracyAt(noise)
  const [px, py] = toSvg(noise, acc)

  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-line bg-base/70 p-3">
        <div className="mb-2 flex items-center justify-between font-mono text-[10.5px] text-faint">
          <span>accuracy vs input noise (RMS, relative to paper baseline)</span>
          <span>1.0 ≈ paper "1 mVrms" reference</span>
        </div>
        <svg viewBox={`0 0 ${W} ${H}`} className="block w-full">
          {/* y reference grid: 0.6, 0.7, 0.8, 0.9 */}
          {[0.6, 0.7, 0.8, 0.9, 1.0].map((y) => {
            const sy = H - ((y - 0.5) / 0.5) * H
            return (
              <g key={y}>
                <line x1={0} x2={W} y1={sy} y2={sy} stroke="#262c3d" strokeWidth={0.4} />
                <text x={2} y={sy - 2} fill="#4f5970" fontSize={9} fontFamily="JetBrains Mono">
                  {(y * 100).toFixed(0)}%
                </text>
              </g>
            )
          })}
          <path d={path} fill="none" stroke="#6dd596" strokeWidth={1.6} />
          <line x1={px} y1={0} x2={px} y2={H} stroke="#ff5db1" strokeWidth={0.7} strokeDasharray="2 3" />
          <circle cx={px} cy={py} r={4} fill="#ff5db1" />
        </svg>
      </div>

      <div className="flex items-center gap-3">
        <span className="tag text-muted">noise level:</span>
        <input
          type="range"
          min={0}
          max={5}
          step={0.05}
          value={noise}
          onChange={(e) => setNoise(parseFloat(e.target.value))}
          className="flex-1 accent-attack"
        />
        <span className="w-16 font-mono text-xs text-attack-bright">
          {noise.toFixed(2)}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[12px]">
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">noise (rel)</div>
          <div className="text-attack-bright">{noise.toFixed(2)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">expected accuracy</div>
          <div className={acc >= 0.9 ? 'text-signal-bright' : acc >= 0.7 ? 'text-warn-bright' : 'text-fault'}>
            {(acc * 100).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  )
}
