import type { Track } from '../lib/types'
import { Callout, Figure, H2, Lead, LI, Math, Mi, Mono, P, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { HyperparamHeatmap } from '../components/widgets/HyperparamHeatmap'

export const track5: Track = {
  id: 'sweep',
  index: 5,
  title: 'Hyperparameter sweep',
  subtitle: 'Reproducing Fig. 2',
  accent: 'data',
  glyph: '05',
  outcome: 'A heatmap of accuracy vs (G_i, G_f) and a defensible choice of operating point.',
  lessons: [
    {
      id: 'landscape',
      title: 'The (G_i, G_f, N) landscape',
      kicker: 'Three knobs, one accuracy surface',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            The paper sweeps these three hyperparameters and finds (G_i=0.6, G_f &lt; 0.6, N=4) as
            a sweet spot. You'll do a smaller version of the same sweep on your own data and
            decide whether you agree.
          </Lead>

          <Figure title="predicted accuracy surface" caption="Hover cells. This is what the sweep should look like qualitatively.">
            <HyperparamHeatmap />
          </Figure>

          <H2>What each knob controls</H2>
          <UL>
            <LI><Mi>G_i</Mi> — too low and the reservoir doesn't "see" the input strongly enough; too high and it saturates instantly.</LI>
            <LI><Mi>G_f</Mi> — too low and there's no memory; too high and the echo state property breaks (Module 3, lesson 4).</LI>
            <LI><Mi>N</Mi> — too small and there isn't enough state; too large and you overfit a small dataset. The paper uses 4.</LI>
          </UL>

          <H2>What "too low" looks like in practice</H2>
          <P>
            If <Mi>G_i</Mi> is far below 0.5, the pre-activation values are all close to zero,
            <Mono> tanh(small) ≈ small</Mono>, and the reservoir is doing essentially nothing. All
            traces look the same to it — accuracy hovers around 50% on a binary task.
          </P>
        </div>
      ),
    },
    {
      id: 'sweep-script',
      title: 'Reproducing the paper\'s Fig. 2',
      kicker: 'A grid over (G_i, G_f) for fixed N',
      minutes: 7,
      body: (
        <div className="lesson">
          <Lead>
            The paper varies G_i in {`{0.1, 0.2, ..., 0.7}`} and G_f in {`{0.1, 0.2, ..., 0.8}`}{' '}
            and re-runs the simulation 50 times per cell. You'll do similar — maybe coarser, maybe
            fewer repetitions — and report a heatmap.
          </Lead>

          <CodeBlock
            lang="python"
            caption="scripts/sweep.py"
            code={`#!/usr/bin/env python3
import argparse, itertools, json
import numpy as np
import matplotlib.pyplot as plt

from rc.reservoir import Reservoir
from rc.train     import build_classifier, featurize
from sklearn.model_selection import cross_val_score
from scripts.classify import collect  # reuse

def sweep(traces, labels, gi_grid, gf_grid, n, n_repeats=10):
    H = np.zeros((len(gf_grid), len(gi_grid)))
    S = np.zeros_like(H)
    for (i, gi), (j, gf) in itertools.product(enumerate(gi_grid), enumerate(gf_grid)):
        accs = []
        for seed in range(n_repeats):
            r = Reservoir(n_neurons=n, n_features=traces[0].shape[1],
                          gi=gi, gf=gf, seed=seed)
            X, y = featurize(traces, labels, r)
            clf  = build_classifier()
            accs.append(cross_val_score(clf, X, y, cv=3).mean())
        H[j, i] = float(np.mean(accs))
        S[j, i] = float(np.std(accs))
    return H, S

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="data/raw")
    ap.add_argument("--n",    type=int, default=4)
    args = ap.parse_args()

    traces, labels = collect(args.root)
    gi_grid = np.linspace(0.1, 0.8, 8)
    gf_grid = np.linspace(0.1, 0.8, 8)
    H, S = sweep(traces, labels, gi_grid, gf_grid, args.n)

    json.dump({"H": H.tolist(), "S": S.tolist(),
               "gi": gi_grid.tolist(), "gf": gf_grid.tolist()},
              open("results/sweep.json", "w"))

    plt.imshow(H, origin="lower", extent=[gi_grid[0], gi_grid[-1], gf_grid[0], gf_grid[-1]],
               aspect="auto", cmap="viridis")
    plt.colorbar(label="mean CV accuracy")
    plt.xlabel("G_i"); plt.ylabel("G_f")
    plt.title("RC accuracy across (G_i, G_f)")
    plt.savefig("results/sweep.png", dpi=120, bbox_inches="tight")`}
          />

          <Callout tone="warn" title="Time budget">
            On the Nano, even a small sweep can take an hour. Develop the sweep script on your
            laptop with cached features. Only run the full sweep on the Nano once the code is
            stable.
          </Callout>
        </div>
      ),
    },
    {
      id: 'picking-op-point',
      title: 'Picking your operating point',
      kicker: 'Stability matters as much as peak accuracy',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            "Pick the highest cell" is wrong. The paper picks an operating point with high mean
            and low standard deviation across reseeds — a robust point, not a lucky one. You
            should do the same.
          </Lead>

          <H2>Two-part selection criterion</H2>
          <UL>
            <LI><strong>Threshold</strong> — accuracy ≥ 90 % (or 95 %, your call).</LI>
            <LI><strong>Stability</strong> — std across reseeds &lt; 2 %.</LI>
          </UL>
          <P>
            Among cells meeting both, prefer the one nearer the center of the plateau. Edge cells
            are vulnerable to small input distribution shifts.
          </P>

          <H2>Writing it up</H2>
          <P>
            Document your chosen operating point in the project README:
          </P>
          <CodeBlock
            lang="shell"
            code={`# In hpc-classifier/README.md
## RC operating point (Phase 1)

  G_i = 0.6   (paper)
  G_f = 0.4   (paper; verified on our data — see results/sweep.png)
  N   = 4     (paper)

  5-fold CV accuracy at this point: 0.94 ± 0.018
  Stability radius: ±0.15 around (G_i, G_f) maintains >= 0.90 accuracy.`}
          />
        </div>
      ),
      implementation: {
        intro: <>Reproduce a small version of paper Fig. 2 on your data.</>,
        estimatedHours: '4-6 hours',
        tasks: [
          {
            title: 'Implement scripts/sweep.py',
            description: <>Coarse grid is fine. 8×8 with 10 reseeds takes ~30 min on the Nano on a small dataset.</>,
            files: ['hpc-classifier/scripts/sweep.py', 'hpc-classifier/results/sweep.json'],
            successCheck: 'A JSON of mean/std accuracy per cell, and a PNG heatmap.',
          },
          {
            title: 'Pick and document your operating point',
            description: <>Add the chosen (G_i, G_f, N) to the README with the threshold + stability rationale.</>,
            files: ['hpc-classifier/README.md'],
            successCheck: 'Someone reading the README can reproduce your model with one command.',
          },
        ],
      },
    },
  ],
}
