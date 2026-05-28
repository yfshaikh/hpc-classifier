import { motion } from 'framer-motion'
import type { FlatLesson } from '../lib/curriculum'
import { neighbours, lessonKey } from '../lib/curriculum'
import { navigate } from '../lib/router'
import { useProgress } from '../lib/progress'
import { Quiz } from './ui/Quiz'
import type { Implementation, VideoLink } from '../lib/types'

function accentText(a: string) {
  if (a === 'attack') return 'text-attack-bright'
  if (a === 'data') return 'text-data-bright'
  return 'text-signal-bright'
}
function accentBar(a: string) {
  if (a === 'attack') return 'bg-attack'
  if (a === 'data') return 'bg-data'
  return 'bg-signal'
}

function ImplementationBlock({ impl }: { impl: Implementation }) {
  return (
    <section className="mt-12 rounded-xl border border-warn/30 bg-warn/[0.04]">
      <div className="flex items-center gap-3 border-b border-warn/20 px-5 py-3">
        <span className="h-4 w-1 rounded-full bg-warn" />
        <h2 className="font-display text-lg font-600 text-warn-bright">
          Now build it
        </h2>
        {impl.estimatedHours && (
          <span className="ml-auto font-mono text-[11px] text-faint">
            ~{impl.estimatedHours}
          </span>
        )}
      </div>
      <div className="px-5 py-4">
        {impl.intro && (
          <p className="mb-4 text-[14px] leading-7 text-ink/85">{impl.intro}</p>
        )}
        <ol className="space-y-4">
          {impl.tasks.map((task, i) => (
            <li key={i} className="rounded-lg border border-line bg-panel-2/40 p-4">
              <div className="mb-2 flex items-start gap-3">
                <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-warn/15 font-mono text-[11px] font-600 text-warn-bright">
                  {i + 1}
                </span>
                <h3 className="font-display text-[15px] font-600 text-ink">
                  {task.title}
                </h3>
              </div>
              <div className="ml-9 text-[14px] leading-6 text-ink/80">
                {task.description}
              </div>
              {task.files && task.files.length > 0 && (
                <div className="ml-9 mt-2 flex flex-wrap gap-1.5">
                  {task.files.map((f, j) => (
                    <span
                      key={j}
                      className="rounded border border-line/70 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[11.5px] text-data-bright"
                    >
                      {f}
                    </span>
                  ))}
                </div>
              )}
              {task.successCheck && (
                <div className="ml-9 mt-3 rounded-md border border-go/30 bg-go/[0.05] px-3 py-2 text-[12.5px] leading-5 text-go">
                  <span className="tag mr-2 text-go">success</span>
                  {task.successCheck}
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

function VideoBlock({ videos }: { videos: VideoLink[] }) {
  return (
    <section className="mt-8 rounded-xl border border-data/30 bg-data/[0.03]">
      <div className="flex items-center gap-3 border-b border-data/20 px-5 py-3">
        <span className="h-4 w-1 rounded-full bg-data" />
        <h2 className="font-display text-lg font-600 text-data-bright">
          Go deeper — videos
        </h2>
      </div>
      <ul className="divide-y divide-line">
        {videos.map((v, i) => (
          <li key={i}>
            <a
              href={v.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-start gap-3 px-5 py-3 transition-colors hover:bg-panel-2/40"
            >
              <span className="mt-0.5 font-mono text-[11px] text-data">▶</span>
              <span className="flex-1">
                <span className="block text-[14px] font-500 text-ink group-hover:text-data-bright">
                  {v.title}
                </span>
                <span className="mt-0.5 flex items-center gap-2 text-[11.5px] text-faint">
                  {v.duration && (
                    <span className="font-mono">{v.duration}</span>
                  )}
                  {v.duration && v.note && <span>·</span>}
                  {v.note && <span className="italic">{v.note}</span>}
                </span>
              </span>
              <span className="mt-0.5 text-faint group-hover:text-data">↗</span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  )
}

export function LessonView({ item }: { item: FlatLesson }) {
  const { track, lesson, globalIndex } = item
  const { isDone, toggle, markDone } = useProgress()
  const { prev, next } = neighbours(globalIndex)
  const key = lessonKey(track.id, lesson.id)
  const done = isDone(key)
  const accT = accentText(track.accent)
  const accB = accentBar(track.accent)

  const lessonNumInTrack = track.lessons.findIndex((l) => l.id === lesson.id) + 1

  return (
    <motion.article
      key={key}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto max-w-3xl px-5 py-10 sm:px-8"
    >
      {/* breadcrumb */}
      <div className="mb-5 flex items-center gap-2 font-mono text-[11px] text-faint">
        <span className={accT}>{track.glyph}</span>
        <span>{track.title}</span>
        <span>/</span>
        <span>
          lesson {lessonNumInTrack} of {track.lessons.length}
        </span>
        <span className="ml-auto flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-faint" />
          {lesson.minutes} min
        </span>
      </div>

      {/* title block */}
      <div className="mb-8 border-b border-line pb-6">
        <div className={`tag mb-3 inline-flex items-center gap-2 ${accT}`}>
          <span className={`h-3 w-1 rounded-full ${accB}`} />
          {lesson.kicker}
        </div>
        <h1 className="font-display text-3xl font-700 leading-tight text-ink sm:text-4xl">
          {lesson.title}
        </h1>
      </div>

      {/* body */}
      <div className="text-ink/85">{lesson.body}</div>

      {/* implementation block */}
      {lesson.implementation && (
        <ImplementationBlock impl={lesson.implementation} />
      )}

      {/* videos */}
      {lesson.videos && lesson.videos.length > 0 && (
        <VideoBlock videos={lesson.videos} />
      )}

      {/* quiz */}
      {lesson.quiz && lesson.quiz.length > 0 && <Quiz items={lesson.quiz} />}

      {/* mark complete */}
      <div className="mt-12 flex items-center gap-3 rounded-lg border border-line bg-panel/60 px-4 py-3">
        <button
          onClick={() => toggle(key)}
          className={`flex h-6 w-6 items-center justify-center rounded-md border transition-colors ${
            done
              ? 'border-go bg-go/20 text-go'
              : 'border-line text-faint hover:border-go/50'
          }`}
        >
          {done ? '✓' : ''}
        </button>
        <span className="text-[13px] text-muted">
          {done ? 'Completed' : 'Mark this lesson complete'}
        </span>
      </div>

      {/* prev / next */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {prev ? (
          <button
            onClick={() => navigate(prev.track.id, prev.lesson.id)}
            className="group rounded-lg border border-line bg-panel/40 px-4 py-3 text-left transition-colors hover:border-data/40 hover:bg-panel-2/50"
          >
            <span className="tag text-faint">← previous</span>
            <span className="mt-1 block truncate text-[13px] text-ink/80 group-hover:text-ink">
              {prev.lesson.title}
            </span>
          </button>
        ) : (
          <span />
        )}
        {next ? (
          <button
            onClick={() => {
              markDone(key)
              navigate(next.track.id, next.lesson.id)
            }}
            className="group rounded-lg border border-signal/30 bg-signal/[0.04] px-4 py-3 text-right transition-colors hover:border-signal/60 hover:bg-signal/10"
          >
            <span className="tag text-signal-bright">next →</span>
            <span className="mt-1 block truncate text-[13px] text-ink/80 group-hover:text-ink">
              {next.lesson.title}
            </span>
          </button>
        ) : (
          <button
            onClick={() => {
              markDone(key)
              navigate()
            }}
            className="group rounded-lg border border-go/40 bg-go/[0.05] px-4 py-3 text-right transition-colors hover:border-go/70"
          >
            <span className="tag text-go">finish →</span>
            <span className="mt-1 block text-[13px] text-ink/80 group-hover:text-ink">
              Back to overview
            </span>
          </button>
        )}
      </div>
    </motion.article>
  )
}
