import { useMemo, useState } from 'react'

type Cell = number

const PRESETS: { label: string; tn: number; fp: number; fn: number; tp: number }[] = [
  { label: 'paper result', tn: 28063, fp: 1937, fn: 0, tp: 30000 },
  { label: 'good', tn: 9500, fp: 500, fn: 200, tp: 9800 },
  { label: 'noisy', tn: 7200, fp: 2800, fn: 1500, tp: 8500 },
  { label: 'random', tn: 5000, fp: 5000, fn: 5000, tp: 5000 },
]

export function ConfusionMatrix() {
  const [preset, setPreset] = useState(0)
  const p = PRESETS[preset]
  const [tn, setTn] = useState<Cell>(p.tn)
  const [fp, setFp] = useState<Cell>(p.fp)
  const [fn, setFn] = useState<Cell>(p.fn)
  const [tp, setTp] = useState<Cell>(p.tp)

  // sync to preset
  useMemo(() => {
    setTn(p.tn)
    setFp(p.fp)
    setFn(p.fn)
    setTp(p.tp)
  }, [preset]) // eslint-disable-line react-hooks/exhaustive-deps

  const total = tn + fp + fn + tp || 1
  const accuracy = (tp + tn) / total
  const precision = tp / (tp + fp || 1)
  const recall = tp / (tp + fn || 1)
  const f1 = (2 * precision * recall) / (precision + recall || 1)

  const max = Math.max(tn, fp, fn, tp)
  const intensity = (v: number) => Math.min(0.85, v / max)

  function cell(label: string, v: number, set: (n: number) => void, isCorrect: boolean) {
    return (
      <div
        className={`rounded-md border p-3 text-center ${
          isCorrect ? 'border-go/40' : 'border-fault/40'
        }`}
        style={{
          background: isCorrect
            ? `rgba(52,224,122,${intensity(v) * 0.32})`
            : `rgba(255,93,177,${intensity(v) * 0.32})`,
        }}
      >
        <div className="tag text-faint">{label}</div>
        <input
          type="number"
          value={v}
          onChange={(e) => set(parseInt(e.target.value) || 0)}
          className="mt-1 w-full bg-transparent text-center font-mono text-lg text-ink focus:outline-none"
        />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((pr, i) => (
          <button
            key={pr.label}
            onClick={() => setPreset(i)}
            className={`rounded-md border px-2.5 py-1 font-mono text-[11.5px] transition-colors ${
              preset === i
                ? 'border-data bg-data/15 text-data-bright'
                : 'border-line bg-panel-2 text-muted hover:border-data/40'
            }`}
          >
            {pr.label}
          </button>
        ))}
      </div>

      <div className="grid gap-2 sm:grid-cols-[80px_1fr]">
        <div />
        <div className="grid grid-cols-2 gap-2">
          <div className="tag text-center text-muted">pred: benign</div>
          <div className="tag text-center text-muted">pred: malware</div>
        </div>
        <div className="flex items-center justify-end pr-2">
          <span className="tag text-muted">actual: benign</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cell('TN', tn, setTn, true)}
          {cell('FP', fp, setFp, false)}
        </div>
        <div className="flex items-center justify-end pr-2">
          <span className="tag text-muted">actual: malware</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {cell('FN', fn, setFn, false)}
          {cell('TP', tp, setTp, true)}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 font-mono text-[12px] sm:grid-cols-4">
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">accuracy</div>
          <div className="text-signal-bright">{(accuracy * 100).toFixed(2)}%</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">precision</div>
          <div className="text-data-bright">{precision.toFixed(3)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">recall</div>
          <div className="text-data-bright">{recall.toFixed(3)}</div>
        </div>
        <div className="rounded border border-line bg-panel-2/40 px-3 py-2">
          <div className="tag text-faint">F1</div>
          <div className="text-warn-bright">{f1.toFixed(3)}</div>
        </div>
      </div>
    </div>
  )
}
