import { useEffect, useState } from 'react'
import { tracks, totalLessons, lessonKey } from '../lib/curriculum'
import { navigate } from '../lib/router'
import { useProgress } from '../lib/progress'

interface Props {
  activeTrack: string | null
  activeLesson: string | null
  onNavigate?: () => void
}

function accentText(a: string) {
  if (a === 'attack') return 'text-attack'
  if (a === 'data') return 'text-data'
  return 'text-signal'
}
function accentTextBright(a: string) {
  if (a === 'attack') return 'text-attack-bright'
  if (a === 'data') return 'text-data-bright'
  return 'text-signal-bright'
}
function accentBg(a: string) {
  if (a === 'attack') return 'bg-attack/10'
  if (a === 'data') return 'bg-data/10'
  return 'bg-signal/10'
}

export function Sidebar({ activeTrack, activeLesson, onNavigate }: Props) {
  const { isDone, done, reset } = useProgress()
  const [open, setOpen] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (activeTrack) setOpen((o) => ({ ...o, [activeTrack]: true }))
  }, [activeTrack])

  const completed = [...done].filter((k) =>
    tracks.some((t) => t.lessons.some((l) => lessonKey(t.id, l.id) === k)),
  ).length
  const pct = Math.round((completed / totalLessons) * 100)

  const go = (trackId: string, lessonId: string) => {
    navigate(trackId, lessonId)
    onNavigate?.()
  }

  return (
    <div className="flex h-full flex-col">
      {/* brand */}
      <button
        onClick={() => {
          navigate()
          onNavigate?.()
        }}
        className="group flex items-center gap-3 px-5 py-5 text-left"
      >
        <span className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-signal to-signal-dim font-display text-lg font-700 text-base shadow-glow">
          H
        </span>
        <span>
          <span className="block font-display text-base font-700 leading-none tracking-wide text-ink group-hover:text-glow-signal">
            HPC<span className="text-signal"> CLASSIFIER LAB</span>
          </span>
          <span className="tag text-faint">a learn-by-building field guide</span>
        </span>
      </button>

      {/* progress */}
      <div className="px-5 pb-4">
        <div className="mb-1.5 flex items-center justify-between">
          <span className="tag text-muted">progress</span>
          <span className="font-mono text-xs text-signal-bright">
            {completed}/{totalLessons}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-panel-2">
          <div
            className="h-full rounded-full bg-gradient-to-r from-signal via-data to-attack transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      {/* tracks */}
      <nav className="flex-1 overflow-y-auto px-3 pb-6">
        {tracks.map((t) => {
          const tDone = t.lessons.filter((l) =>
            isDone(lessonKey(t.id, l.id)),
          ).length
          const isOpen = open[t.id]
          const isActiveTrack = activeTrack === t.id
          return (
            <div key={t.id} className="mb-1">
              <button
                onClick={() =>
                  setOpen((o) => ({ ...o, [t.id]: !o[t.id] }))
                }
                className={`flex w-full items-center gap-3 rounded-lg px-2.5 py-2 text-left transition-colors ${
                  isActiveTrack ? 'bg-panel-2/70' : 'hover:bg-panel-2/40'
                }`}
              >
                <span className={`font-mono text-[11px] ${accentText(t.accent)}`}>
                  {t.glyph}
                </span>
                <span className="flex-1">
                  <span className="block text-[13px] font-500 leading-tight text-ink">
                    {t.title}
                  </span>
                  <span className="font-mono text-[10px] text-faint">
                    {tDone}/{t.lessons.length}
                  </span>
                </span>
                <span
                  className={`text-faint transition-transform ${isOpen ? 'rotate-90' : ''}`}
                >
                  ›
                </span>
              </button>
              {isOpen && (
                <div className="ml-3 mt-0.5 border-l border-line pl-2">
                  {t.lessons.map((l) => {
                    const active = isActiveTrack && activeLesson === l.id
                    const d = isDone(lessonKey(t.id, l.id))
                    return (
                      <button
                        key={l.id}
                        onClick={() => go(t.id, l.id)}
                        className={`flex w-full items-center gap-2.5 rounded-md px-2.5 py-1.5 text-left text-[12.5px] transition-colors ${
                          active
                            ? `${accentBg(t.accent)} ${accentTextBright(t.accent)}`
                            : 'text-muted hover:text-ink'
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-sm border text-[8px] ${
                            d
                              ? 'border-go bg-go/20 text-go'
                              : active
                                ? 'border-current'
                                : 'border-line'
                          }`}
                        >
                          {d ? '✓' : ''}
                        </span>
                        <span className="leading-tight">{l.title}</span>
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </nav>

      {completed > 0 && (
        <button
          onClick={reset}
          className="mx-5 mb-4 rounded-md border border-line px-3 py-1.5 text-[11px] text-faint transition-colors hover:border-fault/40 hover:text-fault"
        >
          reset progress
        </button>
      )}
    </div>
  )
}
