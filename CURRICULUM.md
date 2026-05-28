# HPC Classifier — Curriculum & Project Context

> This document is the single source of truth for what the project is, how it's
> structured, and what each learning module expects you to build. Paste it into
> a fresh LLM session if you get stuck — it gives the model enough context to
> help without re-explaining the paper.

---

## TL;DR

A modified, **software-only** replication of:

> Chandrasekaran, Kuruvila, Basu, Sanyal. *Real-Time Hardware-Based Malware and
> Micro-Architectural Attack Detection Utilizing CMOS Reservoir Computing.*
> IEEE TCAS-II, Vol. 69, No. 2, Feb 2022.

Hardware: **Jetson Nano** (Cortex-A57) for Phase 1, **STM32F4 Nucleo** for
(optional) Phase 2. Pace: ~5–8 hr/week, weekends only.

**Goal:** learn HPC instrumentation, reservoir computing, and embedded ML by
building every piece by hand on small models.

**Non-goal:** detect novel malware. The synthetic adversarial workloads
(Module 2) reproduce the *shape* of attack HPC signatures, not their semantics.
Be honest about this in any write-up.

---

## Tech stack

### Phase 1 (Jetson Nano, software)
- Linux `perf` for HPC trace collection
- Python 3.10+: `numpy`, `scipy`, `scikit-learn`, `matplotlib`, `pandas`
- All workloads in C (gcc -O2)

### Phase 2 (STM32F4, bare metal) — deferred
- STM32CubeMX or CubeIDE
- `arm-none-eabi-gcc`
- ST-Link v2 + OpenOCD
- INA219 (or shunt + DMM) for energy measurement

### Learn-HPC app (this learning UI)
- Vite + React 18 + TypeScript + Tailwind + framer-motion
- See `learn-hpc/README.md` for dev commands

---

## Repo layout

```
hpc-classifier/
├── CURRICULUM.md          ← you are here
├── README.md              ← top-level project README (write this in Module 8)
├── learn-hpc/             ← the interactive learning app
│   └── src/
│       ├── content/       ← track0...track9 — the modules
│       ├── components/    ← UI + widgets
│       └── lib/           ← types, router, curriculum, progress
│
├── data/
│   ├── README.md          ← trace format spec (Module 1, lesson 4)
│   ├── events.txt         ← chosen 4 PMU events (Module 1)
│   └── raw/               ← gitignored: per-class trace CSVs
│
├── workloads/
│   ├── Makefile
│   ├── cache_thrash.c     ← Module 2, lesson 2
│   ├── branch_abuse.c     ← Module 2, lesson 3
│   ├── row_hammer.c       ← Module 2, lesson 4
│   ├── benign/            ← MiBench-derived benign programs
│   └── bin/
│
├── rc/                    ← Phase 1 NumPy implementation
│   ├── reservoir.py       ← Module 4: Eq. 1
│   ├── features.py        ← Module 4: trace → feature vector
│   └── train.py           ← Module 4: sklearn pipeline
│
├── scripts/
│   ├── collect.sh         ← Module 1: perf wrapper
│   ├── plot_trace.py      ← Module 1
│   ├── collect_all.py     ← Module 2
│   ├── classify.py        ← Module 4: end-to-end
│   ├── sweep.py           ← Module 5: hyperparameter sweep
│   ├── evaluate.py        ← Module 6: confusion matrix
│   ├── noise_sweep.py     ← Module 7
│   ├── param_perturb.py   ← Module 7
│   ├── reproduce.sh       ← Module 8: rebuild everything
│   └── gen_tanh_table.py  ← Module 9 (Phase 2)
│
├── tests/                 ← pytest
│   └── test_reservoir.py
│
├── results/               ← committed: plots, JSON summaries
│   ├── sweep.json / .png
│   ├── confusion.png
│   ├── noise.png
│   └── perturb.png
│
└── phase2/                ← Module 9 deliverables; only populated if Phase 2 goes
    ├── rc/
    │   ├── reservoir_q15.c / .h
    │   └── tanh_q15.h
    ├── firmware/          ← STM32CubeMX project
    └── tests/test_host.c
```

---

## The 10 modules (and what each leaves behind)

### Module 0 — Overview & the paper
**What:** the paper in 5 minutes, your modifications, the 7-week shape.
**Lessons:** 3.
**Build:** project skeleton, Python venv, Jetson Nano sanity check.
**Files:** `data/`, `workloads/`, `rc/`, `requirements.txt`, top-level `README.md`.

### Module 1 — HPCs as a security signal (Week 1)
**Key concept:** Linux `perf -I 1`, 4 events max, mind the multiplexing trap.
**Lessons:** 4.
**Build:** working `collect.sh` that produces clean CSV traces. A `plot_trace.py`.
**Files:** `scripts/collect.sh`, `scripts/plot_trace.py`, `data/events.txt`,
`data/README.md`.

### Module 2 — Synthetic adversarial workloads (Week 2)
**Key concept:** mimic attack HPC signatures without distributing real malware.
**Lessons:** 4 (why-synthetic, cache_thrash, branch_abuse, benign baseline +
row_hammer).
**Build:** 3 adversarial C programs + ≥4 benign programs (MiBench-style). Batch
collector script.
**Files:** `workloads/{cache_thrash,branch_abuse,row_hammer}.c`,
`workloads/benign/`, `workloads/Makefile`, `scripts/collect_all.py`.

### Module 3 — Reservoir computing theory
**Key concept:** random nonlinear projection + recurrent memory; echo state
property requires spectral_radius(Wr) · G_f < 1.
**Lessons:** 4 (big idea, nonlinearity, recurrence, stability).
**Build:** none — pure understanding.

### Module 4 — NumPy RC implementation (Week 3)
**Key concept:** Eq. 1 in code, train only the readout via sklearn.
**Lessons:** 4 (Eq. 1 → code, featurization, training, end-to-end).
**Build:** `rc/reservoir.py`, `rc/features.py`, `rc/train.py`, `scripts/classify.py`,
tests.
**Definition of done:** 5-fold CV ≥ 80% on binary task at paper's operating
point (G_i=0.6, G_f=0.4, N=4).

### Module 5 — Hyperparameter sweep (Week 4)
**Key concept:** the (G_i, G_f) accuracy surface. Pick a stable region, not a
peak.
**Lessons:** 3.
**Build:** `scripts/sweep.py`, `results/sweep.json`, `results/sweep.png`.
**Definition of done:** chosen operating point documented in README with
stability radius.

### Module 6 — Multi-class extension (Week 5)
**Key concept:** binary → N-way needs nothing more than sklearn's
multinomial mode; per-class precision/recall matter more than overall accuracy.
**Lessons:** 3.
**Build:** 4-class confusion matrix (paper Fig. 8 shape).
**Files:** `scripts/evaluate.py`, `results/confusion.png`.

### Module 7 — Robustness analysis (Week 6)
**Key concept:** measure noise tolerance and hyperparameter perturbation. Paper
gets ≥ 90% up to 11% param perturbation, ≤ 1 mVrms input noise.
**Lessons:** 3.
**Build:** `scripts/noise_sweep.py`, `scripts/param_perturb.py`, two plots.

### Module 8 — Phase 1 wrap & Phase 2 decision (Week 7)
**Key concept:** polish, document, decide.
**Lessons:** 2.
**Build:** top-level `README.md`, `scripts/reproduce.sh`, `PHASE2.md` with the
go/no-go.

### Module 9 — Fixed-point & quantization (Phase 2 prep)
**Key concept:** Q15 arithmetic. Multiply two Q15 values → Q30 → shift down by
15. Use int32 for intermediates. tanh as a lookup table.
**Lessons:** 4.
**Build:** quantized C inference matching NumPy reference within ±2 LSBs of Q15.
**Files:** `phase2/rc/reservoir_q15.{c,h}`, `phase2/rc/tanh_q15.h`,
`phase2/firmware/`, `phase2/tests/test_host.c`.

---

## Operating point (paper-defined)

- `G_i = 0.6` — input gain
- `G_f = 0.4` — feedback gain
- `N   = 4`   — reservoir neurons
- Sample rate: 1 kHz (1 sample per ms of HPC counters)
- Events: branch-misses, cache-misses, bus-cycles, instructions
- Activation: tanh

Modify only after Module 5's sweep tells you to.

---

## Verifications you must not skip

| Stage                      | How to verify it works                                     |
|----------------------------|------------------------------------------------------------|
| HPC collection             | Plot each column. Counts in expected order of magnitude.   |
| Reservoir implementation   | Zero input → zero state forever. Same seed → same state.  |
| Training                   | 5-fold CV (StratifiedKFold). Not single train/test split. |
| Quantization (Phase 2)     | Q15 sim diffed against float64 within 1e-3.                |
| Host C (Phase 2)           | Diffed bit-exact against Q15 sim on one full trace.        |
| Target C (Phase 2)         | Diffed bit-exact against host C on the same trace.         |

---

## Where to stop and ask

If you get stuck, the order of things to check is almost always:

1. **Data first.** Re-plot your trace. Is it the right shape?
2. **Reservoir state second.** Is it stuck at ±1? Is it all zero? Is it identical
   for every input?
3. **Featurizer third.** Mean and std are most likely culprits if classes look
   identical to the classifier.
4. **Classifier last.** It's usually not the classifier.

---

## Notes for an LLM helping with implementation

- Don't write the user's code for them. They're learning by doing.
- Their preference: explain concepts, give pseudo-code, review what they wrote.
- Push back when their approach is wrong. They appreciate it.
- They use Jetson Nano (Cortex-A57), not Orin. Don't assume modern PMU features.
- Their STM32 is an F4 with an FPU. Phase 2 fixed-point work is for *learning*,
  not necessity.
- Phase 2 may never happen. Don't push it. Phase 1 alone is a complete project.

---

## License & honesty

Synthetic adversarial workloads. Not real malware. State this in any README
that describes the project externally.
