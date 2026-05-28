import { useState } from 'react'

interface Week {
  n: number
  title: string
  goal: string
  done: string
}

const WEEKS: Week[] = [
  {
    n: 1,
    title: 'perf on the Nano',
    goal: 'Get Linux perf working on Jetson Nano. Pick 4 events. Write a script that emits a CSV every 1 ms.',
    done: 'A working `collect.sh` that runs any program under perf and dumps timestamp + 4 counters per row.',
  },
  {
    n: 2,
    title: 'first workloads',
    goal: 'Write one benign and one adversarial C program. Collect a few thousand HPC samples each.',
    done: 'Two .csv files with visibly different HPC signatures.',
  },
  {
    n: 3,
    title: 'NumPy RC',
    goal: 'Implement the paper\'s Eq. 1 in pure NumPy. {0,1} weights, tanh nonlinearity, sklearn LogisticRegression readout.',
    done: 'Binary classifier achieves > chance accuracy on your week-2 dataset.',
  },
  {
    n: 4,
    title: 'operating point',
    goal: 'Sweep (G_i, G_f, N). Reproduce a version of paper Fig. 2.',
    done: 'Plot showing accuracy vs G_f for several G_i; pick a stable operating point ≥ 90 %.',
  },
  {
    n: 5,
    title: 'multi-class',
    goal: 'Add cache-thrasher, branch-mispredict-abuser, row-buffer hammer. 4-class problem.',
    done: 'A 4×4 confusion matrix (paper-style Fig. 8) on held-out data.',
  },
  {
    n: 6,
    title: 'robustness',
    goal: 'Add Gaussian noise to inputs. Perturb hyperparameters. Reproduce paper Fig. 3.',
    done: 'Plot showing accuracy stays > 90 % under up to ~10 % parameter perturbation.',
  },
  {
    n: 7,
    title: 'wrap + decide',
    goal: 'Write up findings. Decide whether Phase 2 (STM32 bare metal) is worth doing.',
    done: 'A README documenting Phase 1 results, lessons learned, and the Phase 2 go/no-go decision.',
  },
]

export function RoadmapTimeline() {
  const [active, setActive] = useState<number>(1)
  const cur = WEEKS.find((w) => w.n === active)!

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute left-2 right-2 top-4 h-px bg-line" />
        <div className="relative flex justify-between">
          {WEEKS.map((w) => (
            <button
              key={w.n}
              onClick={() => setActive(w.n)}
              className="group flex flex-col items-center"
            >
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 font-mono text-[12px] font-600 transition-all ${
                  active === w.n
                    ? 'border-signal bg-signal/20 text-signal-bright shadow-glow'
                    : 'border-line bg-panel-2 text-muted group-hover:border-data/40'
                }`}
              >
                W{w.n}
              </span>
              <span
                className={`mt-1.5 max-w-[80px] text-center text-[10.5px] leading-tight transition-colors ${
                  active === w.n ? 'text-ink' : 'text-faint group-hover:text-muted'
                }`}
              >
                {w.title}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border border-signal/30 bg-signal/[0.04] p-4">
        <div className="mb-2 flex items-baseline gap-3">
          <span className="font-mono text-[11px] text-signal">week {cur.n}</span>
          <h4 className="font-display text-base font-600 text-ink">{cur.title}</h4>
        </div>
        <div className="mb-3 text-[13.5px] leading-6 text-ink/80">
          <span className="tag mr-2 text-data-bright">goal</span>
          {cur.goal}
        </div>
        <div className="text-[13.5px] leading-6 text-ink/80">
          <span className="tag mr-2 text-go">done when</span>
          {cur.done}
        </div>
      </div>
    </div>
  )
}
