# HPC Classifier

Phase 1 software pipeline for classifying hardware performance counter (HPC) traces with reservoir computing. Synthetic attack and benign workloads produce the traces; a frozen random reservoir encodes temporal structure; only a linear readout is trained.

## Background

Hardware malware detectors (HMDs) watch CPU performance counters — branch misses, cache misses, bus cycles, instructions — instead of scanning binaries. Attack behavior leaves a fingerprint in those time series.

This project follows the approach in Chandrasekaran et al. (2022): a small reservoir computer maps each HPC window into a feature space where classes are linearly separable. The reservoir weights stay random and frozen; only the output layer is trained. That keeps training cheap and makes a later embedded port realistic.

Phase 1 runs entirely in software (Jetson Orin Nano / host Python). Real malware is intentionally avoided — C programs that mimic the HPC signatures of row hammer, cache thrashing, and branch abuse stand in as safe proxies, alongside benign compute- and memory-bound workloads.

## Phase 1 — what is implemented

| Piece | What it does |
|---|---|
| **Workloads** | `cache_thrash`, `branch_abuse`, `row_hammer`, plus benign `matmul` and `memstream` |
| **Collection** | `perf stat` at 1 ms for four events → CSV traces under `data/raw/<class>/` |
| **Reservoir** | 4 neurons, \(R[n] = \tanh(G_i W X[n] + G_f W_r R[n-1])\) with \(G_i=0.6\), \(G_f=0.4\) |
| **Features** | Per-neuron mean, std, and final state → 12-D vector per trace |
| **Classifier** | `StandardScaler` + `LogisticRegression`, 5-fold CV (~98% accuracy on ~150 traces) |
| **Noise sweep** | Gaussian noise in z-scored input space; accuracy stays high through \(\sigma \approx 0.5\) |
| **Extras** | Manim explainers (`manim/`), interactive curriculum (`learn-hpc/`) |

Classes on disk are four folders: `benign` (matmul + memstream), `branch_abuse`, `cache_thrash`, `row_hammer`.

## Pipeline order (how the folders fit together)

Work through the repo in this order — each stage feeds the next:

```
1. workloads/     write & compile the C programs that generate HPC fingerprints
2. scripts/       collect.sh / collect_all.sh run those binaries under perf
3. data/          raw CSVs land here; plots/ holds quick visualizations
4. rc/            load traces → run reservoir → build feature matrix
5. scripts/       classify.py trains/evaluates the readout; noise_sweep.py stress-tests it
6. results/       figures from experiments (e.g. noise.png)
```

Supporting material (not on the critical path):

- `manim/` — animations of the reservoir step, random projection, cache/DRAM patterns
- `learn-hpc/` — Vite/React field guide for the concepts behind the pipeline
- `ignore/` — local scratch (gitignored)

## Repository layout

```
hpc-classifier/
├── workloads/          # C sources + Makefile → bin/
│   ├── benign/         # matmul.c, memstream.c
│   ├── *.c             # adversarial workloads
│   └── Makefile
├── scripts/
│   ├── collect.sh      # one perf run → one CSV
│   ├── collect_all.sh  # bulk collect all classes
│   ├── plot_trace.py   # quick CSV → plot
│   ├── classify.py     # reservoir + logistic regression + CV
│   └── noise_sweep.py  # accuracy vs input noise
├── data/
│   ├── events.txt      # why each HPC event matters
│   ├── raw/<class>/    # collected CSVs
│   └── plots/          # example trace plots
├── rc/
│   ├── data.py         # CSV → (T, 4) z-scored arrays
│   ├── reservoir.py    # frozen random reservoir (Eq. 1)
│   └── features.py     # state trajectory → feature vector
├── results/            # experiment outputs
├── manim/              # blog/explainer animations
└── learn-hpc/          # interactive learning app
```

## Quick start

```bash
# 1. Build workloads
make -C workloads

# 2. Collect traces (default: 30 runs per class)
./scripts/collect_all.sh

# 3. Classify
python scripts/classify.py

# 4. Optional: noise robustness plot → results/noise.png
python scripts/noise_sweep.py
```

Requires `perf`, `gcc`, Python with `numpy`, `pandas`, `scikit-learn`, and `matplotlib` (for the noise plot).
