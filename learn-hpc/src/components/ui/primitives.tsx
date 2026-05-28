import type { ReactNode } from 'react'

/* Lead paragraph — the opening hook of a lesson. */
export function Lead({ children }: { children: ReactNode }) {
  return <p className="text-lg leading-relaxed text-ink/90 mb-6">{children}</p>
}

export function P({ children }: { children: ReactNode }) {
  return <p className="text-[15px] leading-7 text-ink/80 mb-4">{children}</p>
}

export function H2({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-display text-xl font-600 text-ink mt-10 mb-4 flex items-center gap-3">
      <span className="h-4 w-1 rounded-full bg-signal shadow-glow" />
      {children}
    </h2>
  )
}

export function H3({ children }: { children: ReactNode }) {
  return (
    <h3 className="font-display text-base font-600 text-data-bright mt-7 mb-3 tracking-wide">
      {children}
    </h3>
  )
}

export function UL({ children }: { children: ReactNode }) {
  return <ul className="space-y-2 mb-5 ml-1">{children}</ul>
}

export function OL({ children }: { children: ReactNode }) {
  return <ol className="space-y-2 mb-5 ml-1 list-none counter-reset-step">{children}</ol>
}

export function LI({ children }: { children: ReactNode }) {
  return (
    <li className="text-[15px] leading-7 text-ink/80 pl-5 relative">
      <span className="absolute left-0 top-[11px] h-1.5 w-1.5 rounded-sm bg-signal/70" />
      {children}
    </li>
  )
}

/* Inline emphasis for a domain term. */
export function Term({ children }: { children: ReactNode }) {
  return <span className="text-signal-bright font-500">{children}</span>
}

/* Adversarial inline emphasis — for terms tied to attacks. */
export function Attack({ children }: { children: ReactNode }) {
  return <span className="text-attack-bright font-500">{children}</span>
}

/* Inline monospace, good for code symbols, file paths, function names. */
export function Mono({
  children,
  tone,
}: {
  children: ReactNode
  tone?: 'fault' | 'go' | 'data' | 'attack' | 'signal'
}) {
  const color =
    tone === 'fault'
      ? 'text-fault'
      : tone === 'go'
        ? 'text-go'
        : tone === 'data'
          ? 'text-data-bright'
          : tone === 'attack'
            ? 'text-attack-bright'
            : tone === 'signal'
              ? 'text-signal-bright'
              : 'text-ink'
  return (
    <code
      className={`font-mono text-[0.86em] ${color} bg-white/[0.04] border border-line/70 rounded px-1.5 py-0.5`}
    >
      {children}
    </code>
  )
}

/* Display math — for equations from the paper. Kept simple (no KaTeX). */
export function Math({ children }: { children: ReactNode }) {
  return (
    <div className="my-5 flex justify-center">
      <div className="math rounded-lg border border-line bg-panel-2/40 px-6 py-3 text-base">
        {children}
      </div>
    </div>
  )
}

/* Inline math token, e.g. <Mi>G_i</Mi> = 0.6 */
export function Mi({ children }: { children: ReactNode }) {
  return <span className="math text-[0.95em]">{children}</span>
}

type Tone = 'note' | 'insight' | 'warn' | 'fault' | 'go' | 'attack'

const toneMap: Record<Tone, { label: string; bar: string; text: string; glyph: string }> = {
  note: { label: 'Note', bar: 'bg-data', text: 'text-data-bright', glyph: '//' },
  insight: { label: 'Key insight', bar: 'bg-signal', text: 'text-signal-bright', glyph: '★' },
  warn: { label: 'Gotcha', bar: 'bg-warn', text: 'text-warn-bright', glyph: '⚠' },
  fault: { label: 'The bug', bar: 'bg-fault', text: 'text-fault', glyph: '✕' },
  go: { label: 'Verified', bar: 'bg-go', text: 'text-go', glyph: '✓' },
  attack: { label: 'Adversarial', bar: 'bg-attack', text: 'text-attack-bright', glyph: '⚡' },
}

export function Callout({
  tone = 'note',
  title,
  children,
}: {
  tone?: Tone
  title?: string
  children: ReactNode
}) {
  const t = toneMap[tone]
  return (
    <div className="my-5 flex gap-0 overflow-hidden rounded-lg border border-line bg-panel-2/60">
      <div className={`w-1 shrink-0 ${t.bar}`} />
      <div className="px-4 py-3.5">
        <div className={`tag mb-1.5 flex items-center gap-2 ${t.text}`}>
          <span aria-hidden>{t.glyph}</span>
          {title ?? t.label}
        </div>
        <div className="text-[14px] leading-6 text-ink/80 [&_strong]:text-ink [&_strong]:font-600">
          {children}
        </div>
      </div>
    </div>
  )
}

/* Captioned figure wrapper for widgets and diagrams. */
export function Figure({
  title,
  caption,
  children,
}: {
  title?: string
  caption?: ReactNode
  children: ReactNode
}) {
  return (
    <figure className="my-7 rounded-xl border border-line bg-panel/70 overflow-hidden">
      {title && (
        <div className="flex items-center justify-between border-b border-line bg-panel-2/60 px-4 py-2.5">
          <span className="tag text-muted">{title}</span>
          <span className="flex gap-1" aria-hidden>
            <span className="h-2 w-2 rounded-full bg-fault/60" />
            <span className="h-2 w-2 rounded-full bg-warn/60" />
            <span className="h-2 w-2 rounded-full bg-go/60" />
          </span>
        </div>
      )}
      <div className="p-4 sm:p-5">{children}</div>
      {caption && (
        <figcaption className="border-t border-line px-4 py-2.5 text-xs leading-5 text-faint">
          {caption}
        </figcaption>
      )}
    </figure>
  )
}

/* Small framed table for spec-like data. */
export function DataTable({ head, rows }: { head: string[]; rows: ReactNode[][] }) {
  return (
    <div className="my-5 overflow-x-auto rounded-lg border border-line">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="bg-panel-2/70">
            {head.map((h, i) => (
              <th key={i} className="tag px-3 py-2 font-500 text-muted">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-t border-line-soft">
              {r.map((c, j) => (
                <td key={j} className="px-3 py-2 font-mono text-ink/80">
                  {c}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/* Two-column "compare" panel — useful for "without X / with X" framings. */
type CompareTone = 'attack' | 'signal' | 'data' | 'warn'
const compareTones: Record<CompareTone, { bar: string; text: string }> = {
  attack: { bar: 'bg-attack', text: 'text-attack-bright' },
  signal: { bar: 'bg-signal', text: 'text-signal-bright' },
  data: { bar: 'bg-data', text: 'text-data-bright' },
  warn: { bar: 'bg-warn', text: 'text-warn-bright' },
}

export function Compare({
  left,
  right,
  leftTitle,
  rightTitle,
  leftTone = 'attack',
  rightTone = 'signal',
}: {
  left: ReactNode
  right: ReactNode
  leftTitle?: string
  rightTitle?: string
  leftTone?: CompareTone
  rightTone?: CompareTone
}) {
  const L = compareTones[leftTone]
  const R = compareTones[rightTone]
  return (
    <div className="my-5 grid gap-3 md:grid-cols-2">
      <div className="rounded-lg border border-line bg-panel-2/40 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className={`h-3 w-1 rounded-full ${L.bar}`} />
          <span className={`tag ${L.text}`}>{leftTitle ?? 'before'}</span>
        </div>
        <div className="p-3 text-[14px] leading-6 text-ink/80">{left}</div>
      </div>
      <div className="rounded-lg border border-line bg-panel-2/40 overflow-hidden">
        <div className="flex items-center gap-2 border-b border-line px-3 py-2">
          <span className={`h-3 w-1 rounded-full ${R.bar}`} />
          <span className={`tag ${R.text}`}>{rightTitle ?? 'after'}</span>
        </div>
        <div className="p-3 text-[14px] leading-6 text-ink/80">{right}</div>
      </div>
    </div>
  )
}
