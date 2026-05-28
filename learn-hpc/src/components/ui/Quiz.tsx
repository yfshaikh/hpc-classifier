import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import type { QuizQuestion } from '../../lib/types'

function Question({ item, index }: { item: QuizQuestion; index: number }) {
  const [picked, setPicked] = useState<number | null>(null)
  const answered = picked !== null
  const correct = picked === item.answer

  return (
    <div className="rounded-lg border border-line bg-panel/60 p-4">
      <div className="mb-3 flex gap-2">
        <span className="font-mono text-xs text-signal">Q{index + 1}</span>
        <p className="text-[15px] font-500 text-ink">{item.q}</p>
      </div>
      <div className="grid gap-2">
        {item.options.map((opt, i) => {
          const isAnswer = i === item.answer
          const isPicked = i === picked
          let cls = 'border-line bg-panel-2/40 hover:border-data/50 hover:bg-panel-2'
          if (answered) {
            if (isAnswer) cls = 'border-go/60 bg-go/10 text-go'
            else if (isPicked) cls = 'border-fault/60 bg-fault/10 text-fault'
            else cls = 'border-line bg-panel-2/30 opacity-60'
          }
          return (
            <button
              key={i}
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`flex items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[14px] transition-colors disabled:cursor-default ${cls}`}
            >
              <span className="font-mono text-xs text-faint">
                {String.fromCharCode(65 + i)}
              </span>
              <span className="flex-1">{opt}</span>
              {answered && isAnswer && <span className="text-go">✓</span>}
              {answered && isPicked && !isAnswer && <span className="text-fault">✕</span>}
            </button>
          )
        })}
      </div>
      <AnimatePresence>
        {answered && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div
              className={`mt-3 rounded-md border px-3 py-2.5 text-[13px] leading-6 ${
                correct
                  ? 'border-go/40 bg-go/[0.06]'
                  : 'border-warn/40 bg-warn/[0.06]'
              }`}
            >
              <span className={`tag mr-2 ${correct ? 'text-go' : 'text-warn-bright'}`}>
                {correct ? 'Correct' : 'Not quite'}
              </span>
              <span className="text-ink/80">{item.explain}</span>
              {!correct && (
                <button
                  onClick={() => setPicked(null)}
                  className="ml-2 text-data-bright underline-offset-2 hover:underline"
                >
                  try again
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function Quiz({ items }: { items: QuizQuestion[] }) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex items-center gap-3">
        <span className="h-4 w-1 rounded-full bg-data shadow-glow-data" />
        <h2 className="font-display text-xl font-600 text-ink">Check yourself</h2>
      </div>
      <div className="space-y-3">
        {items.map((item, i) => (
          <Question key={i} item={item} index={i} />
        ))}
      </div>
    </section>
  )
}
