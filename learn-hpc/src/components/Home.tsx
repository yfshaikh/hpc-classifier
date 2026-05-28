import { motion } from 'framer-motion'
import { tracks, totalLessons, flatLessons, lessonKey } from '../lib/curriculum'
import { navigate } from '../lib/router'
import { useProgress } from '../lib/progress'

function accentRing(a: string) {
  if (a === 'attack') return 'hover:border-attack/50'
  if (a === 'data') return 'hover:border-data/50'
  return 'hover:border-signal/50'
}
function accentGlyph(a: string) {
  if (a === 'attack')
    return 'text-attack/30 group-hover:text-attack'
  if (a === 'data') return 'text-data/30 group-hover:text-data'
  return 'text-signal/30 group-hover:text-signal'
}
function accentBar(a: string) {
  if (a === 'attack') return 'bg-attack'
  if (a === 'data') return 'bg-data'
  return 'bg-signal'
}

export function Home() {
  const { isDone } = useProgress()
  const completed = flatLessons.filter((f) =>
    isDone(lessonKey(f.track.id, f.lesson.id)),
  ).length
  const started = completed > 0
  const firstUndone =
    flatLessons.find((f) => !isDone(lessonKey(f.track.id, f.lesson.id))) ??
    flatLessons[0]

  return (
    <div className="mx-auto max-w-5xl px-5 py-12 sm:px-8">
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="tag mb-4 inline-flex items-center gap-2 text-signal">
          <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-signal" />
          Chandrasekaran et al. 2022 · Jetson Nano · STM32F4 · NumPy
        </div>
        <h1 className="font-display text-4xl font-700 leading-[1.05] text-ink sm:text-6xl">
          From an{' '}
          <span className="text-signal text-glow-signal">HPC trace</span>{' '}
          to a{' '}
          <span className="text-attack text-glow-attack">malware verdict</span>.
        </h1>
        <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted">
          A modified, software-only replication of an analog-CMOS reservoir-computing
          malware detector. Each module teaches a concept, gives you something concrete to
          implement, and points you at the best video to go deeper. Built for understanding,
          not memorising.
        </p>

        {/* decorative HPC trace */}
        <svg className="my-8 w-full" height="44" viewBox="0 0 800 44" preserveAspectRatio="none">
          {/* benign baseline */}
          <motion.path
            d="M0 22 L40 22 L60 16 L100 16 L120 22 L180 22 L200 18 L260 18 L280 24 L340 24 L360 20 L420 20 L440 22 L500 22 L520 18 L580 18 L600 22 L660 22 L680 20 L740 20 L760 22 L800 22"
            fill="none"
            stroke="#6dd596"
            strokeWidth="1.5"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.85 }}
            transition={{ duration: 1.6, ease: 'easeInOut' }}
          />
          {/* adversarial spikes */}
          <motion.path
            d="M0 28 L40 28 L60 6 L80 36 L100 8 L120 30 L180 28 L220 4 L240 38 L260 6 L300 30 L340 28 L380 8 L400 36 L440 28 L500 28 L540 6 L560 34 L600 28 L660 28 L700 4 L720 38 L760 28 L800 28"
            fill="none"
            stroke="#ff5db1"
            strokeWidth="1.2"
            opacity="0.7"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 0.7 }}
            transition={{ duration: 2.0, ease: 'easeInOut', delay: 0.3 }}
          />
        </svg>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() =>
              navigate(firstUndone.track.id, firstUndone.lesson.id)
            }
            className="rounded-lg bg-signal px-5 py-3 font-display text-sm font-700 tracking-wide text-base transition-colors hover:bg-signal-bright"
          >
            {started ? 'Resume →' : 'Start the lab →'}
          </button>
          <span className="font-mono text-xs text-faint">
            {completed}/{totalLessons} lessons · {tracks.length} modules
          </span>
        </div>
      </motion.div>

      {/* track grid */}
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {tracks.map((t, i) => {
          const tDone = t.lessons.filter((l) =>
            isDone(lessonKey(t.id, l.id)),
          ).length
          const pct = Math.round((tDone / t.lessons.length) * 100)
          return (
            <motion.button
              key={t.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 + i * 0.05 }}
              onClick={() => navigate(t.id, t.lessons[0].id)}
              className={`group relative overflow-hidden rounded-xl border border-line bg-panel/50 p-5 text-left transition-colors ${accentRing(t.accent)}`}
            >
              <div className="flex items-start justify-between">
                <span
                  className={`font-display text-3xl font-700 transition-colors ${accentGlyph(t.accent)}`}
                >
                  {t.glyph}
                </span>
                {tDone === t.lessons.length && tDone > 0 && (
                  <span className="text-go">✓</span>
                )}
              </div>
              <h3 className="mt-2 font-display text-lg font-600 text-ink">
                {t.title}
              </h3>
              <p className="mt-1 text-[13px] leading-5 text-muted">{t.subtitle}</p>
              {t.outcome && (
                <p className="mt-2 text-[12px] leading-5 text-faint italic">
                  → {t.outcome}
                </p>
              )}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-panel-2">
                  <div
                    className={`h-full rounded-full ${accentBar(t.accent)}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="font-mono text-[10px] text-faint">
                  {tDone}/{t.lessons.length}
                </span>
              </div>
            </motion.button>
          )
        })}
      </div>

      <p className="mt-12 text-center text-xs text-faint">
        Progress saved locally · clear with the reset button in the sidebar
      </p>
    </div>
  )
}
