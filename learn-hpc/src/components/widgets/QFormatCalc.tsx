import { useMemo, useState } from 'react'

const Q_FORMATS = [
  { label: 'Q7 (int8)', frac: 7, bits: 8, signed: true },
  { label: 'Q15 (int16)', frac: 15, bits: 16, signed: true },
  { label: 'Q31 (int32)', frac: 31, bits: 32, signed: true },
] as const

function clampToBits(n: number, bits: number, signed: boolean) {
  if (signed) {
    const max = 2 ** (bits - 1) - 1
    const min = -(2 ** (bits - 1))
    return Math.max(min, Math.min(max, n))
  }
  return Math.max(0, Math.min(2 ** bits - 1, n))
}

function toBinary(n: number, bits: number): string {
  let v = n
  if (v < 0) v = 2 ** bits + v
  return v.toString(2).padStart(bits, '0')
}

export function QFormatCalc() {
  const [floatVal, setFloatVal] = useState(0.6)
  const [fmtIdx, setFmtIdx] = useState(1)
  const fmt = Q_FORMATS[fmtIdx]

  const result = useMemo(() => {
    const scale = 2 ** fmt.frac
    const raw = Math.round(floatVal * scale)
    const clamped = clampToBits(raw, fmt.bits, fmt.signed)
    const overflow = raw !== clamped
    const recoveredFloat = clamped / scale
    const error = floatVal - recoveredFloat
    const binary = toBinary(clamped, fmt.bits)
    const hex =
      '0x' +
      (clamped >= 0 ? clamped : 2 ** fmt.bits + clamped)
        .toString(16)
        .padStart(Math.ceil(fmt.bits / 4), '0')
        .toUpperCase()
    return { scale, raw, clamped, overflow, recoveredFloat, error, binary, hex }
  }, [floatVal, fmt])

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <div>
          <div className="mb-1 flex items-baseline justify-between">
            <span className="tag text-muted">float value</span>
            <span className="font-mono text-[11px] text-data-bright">
              {floatVal.toFixed(4)}
            </span>
          </div>
          <input
            type="range"
            min={-1}
            max={1}
            step={0.001}
            value={floatVal}
            onChange={(e) => setFloatVal(parseFloat(e.target.value))}
            className="w-full accent-signal"
          />
          <input
            type="number"
            value={floatVal}
            step={0.01}
            onChange={(e) => setFloatVal(parseFloat(e.target.value) || 0)}
            className="mt-2 w-full rounded-md border border-line bg-panel-2 px-2 py-1 font-mono text-sm text-ink focus:border-signal focus:outline-none"
          />
        </div>
        <div className="space-y-1">
          <span className="tag text-muted">Q-format</span>
          <div className="space-y-1">
            {Q_FORMATS.map((f, i) => (
              <button
                key={f.label}
                onClick={() => setFmtIdx(i)}
                className={`block w-full rounded-md border px-3 py-1.5 text-left font-mono text-[12px] transition-colors ${
                  fmtIdx === i
                    ? 'border-signal bg-signal/10 text-signal-bright'
                    : 'border-line bg-panel-2 text-muted hover:border-signal/40'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-lg border border-line bg-base/70 p-3 font-mono text-[12.5px]">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div>
            <span className="tag text-faint">integer (scale = 2^{fmt.frac})</span>
            <div className={result.overflow ? 'text-fault' : 'text-warn-bright'}>
              {result.clamped} {result.overflow && '⚠ clamped from ' + result.raw}
            </div>
          </div>
          <div>
            <span className="tag text-faint">hex</span>
            <div className="text-warn-bright">{result.hex}</div>
          </div>
          <div className="col-span-full">
            <span className="tag text-faint">binary ({fmt.bits} bits)</span>
            <div className="break-all text-data-bright">
              {result.binary.replace(/(.{4})/g, '$1 ').trim()}
            </div>
          </div>
          <div>
            <span className="tag text-faint">recovered float</span>
            <div className="text-signal-bright">
              {result.recoveredFloat.toFixed(6)}
            </div>
          </div>
          <div>
            <span className="tag text-faint">quantization error</span>
            <div className={Math.abs(result.error) > 1 / result.scale ? 'text-attack-bright' : 'text-ink/70'}>
              {result.error.toFixed(6)}
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md border border-data/30 bg-data/[0.04] px-3 py-2 text-[12px] leading-5 text-ink/80">
        <span className="tag mr-2 text-data-bright">how to read this</span>
        Q{fmt.frac} stores a real number as an integer scaled by 2^{fmt.frac}. To multiply two
        Q{fmt.frac} numbers, multiply the integers (use a wider int!) and shift right by{' '}
        {fmt.frac}. To add, just add — same scale.
      </div>
    </div>
  )
}
