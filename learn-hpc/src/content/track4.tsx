import type { Track } from '../lib/types'
import { Callout, H2, H3, Lead, LI, Math, Mi, Mono, P, Term, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'

export const track4: Track = {
  id: 'numpy-rc',
  index: 4,
  title: 'NumPy implementation',
  subtitle: 'Eq. 1 from paper → working classifier',
  accent: 'signal',
  glyph: '04',
  outcome: 'A reservoir.py + train.py that beat chance on your collected traces.',
  lessons: [
    {
      id: 'eq1-to-code',
      title: 'Translating Eq. 1 to NumPy',
      kicker: 'Six lines of code',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            The paper's Eq. 1 is short. The corresponding NumPy is shorter. If you write it
            carefully now, you'll never have to rewrite it.
          </Lead>

          <Math>
            R[n] = tanh( <Mi>G_i</Mi> W X[n] + <Mi>G_f</Mi> Wr R[n−1] )
          </Math>

          <H2>Naive but correct first</H2>
          <CodeBlock
            lang="python"
            caption="rc/reservoir.py — first version"
            code={`import numpy as np

class Reservoir:
    def __init__(self, n_neurons=4, n_features=4,
                 gi=0.6, gf=0.4, sparsity_w=0.7, sparsity_wr=0.7,
                 seed=0):
        rng = np.random.default_rng(seed)
        self.W  = (rng.random((n_neurons, n_features)) < sparsity_w).astype(np.float64)
        self.Wr = (rng.random((n_neurons, n_neurons))  < sparsity_wr).astype(np.float64) * np.eye(n_neurons)
        self.gi = gi
        self.gf = gf
        self.N  = n_neurons

    def run(self, X):
        """X: (T, d) time-series.  Returns: (T, N) reservoir state trajectory."""
        T = X.shape[0]
        R = np.zeros((T, self.N))
        r_prev = np.zeros(self.N)
        for t in range(T):
            pre = self.gi * (self.W @ X[t]) + self.gf * (self.Wr @ r_prev)
            r_prev = np.tanh(pre)
            R[t] = r_prev
        return R`}
          />

          <H2>What to notice</H2>
          <UL>
            <LI><Mono>Wr * np.eye</Mono> enforces "sparsely filled identity" — diagonal only, matching the paper.</LI>
            <LI>The reservoir state is stored as <Mono>float64</Mono>. That's fine for Phase 1. Phase 2 will quantize this.</LI>
            <LI><Mono>r_prev</Mono> starts at zero. Echo state property says any starting point is fine; zero is the cheapest.</LI>
            <LI>The loop is explicit and per-timestep. Don't optimize it yet. Correctness first.</LI>
          </UL>

          <Callout tone="warn" title="Resist vectorizing too early">
            You'll be tempted to make the time loop into a single matmul. Don't — the recurrence
            R[n] depends on R[n-1], so the loop is fundamentally sequential. Premature
            vectorization will produce wrong answers that look right.
          </Callout>
        </div>
      ),
    },
    {
      id: 'feature-extraction',
      title: 'From reservoir state to a feature vector',
      kicker: 'One trace, one feature vector',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            The reservoir produces an (T, N) state trajectory for each trace. The classifier wants
            a single feature vector per trace. How you collapse trajectory → vector matters.
          </Lead>

          <H2>The paper's choice</H2>
          <P>
            The paper feeds the <em>current</em> reservoir state into the readout at every timestep
            and produces a binary decision per timestep. For Phase 1, you have a simpler option:
            collect statistics over the trajectory and classify the whole trace at once. Both work.
            Start with the simpler one.
          </P>

          <CodeBlock
            lang="python"
            caption="rc/features.py"
            code={`import numpy as np

def trace_features(R: np.ndarray) -> np.ndarray:
    """Collapse (T, N) reservoir state into a feature vector.

    Concatenates per-neuron mean, std, and last-state.
    Plenty for Phase 1; refine if needed.
    """
    mean = R.mean(axis=0)
    std  = R.std(axis=0)
    last = R[-1]
    return np.concatenate([mean, std, last])  # (3*N,)`}
          />

          <H3>Why these three</H3>
          <UL>
            <LI><strong>Mean</strong> — captures the average operating point of each neuron under this trace.</LI>
            <LI><strong>Std</strong> — captures how active the neuron was. A neuron that flatlined isn't contributing useful information.</LI>
            <LI><strong>Last state</strong> — captures the system's "current verdict" if the trace had run forever. ESP says it forgets initial condition, so this is meaningful.</LI>
          </UL>

          <Callout tone="note" title="The richer alternative">
            If you want to be paper-faithful: classify per-timestep, then majority-vote at the
            trace level. That's how their Fig. 8 confusion matrices are built (60 000 / 180 000
            samples — they're at the sample level, not trace level). It costs more compute. For
            Phase 1, trace-level is fine.
          </Callout>
        </div>
      ),
    },
    {
      id: 'training-readout',
      title: 'Training the readout',
      kicker: 'sklearn does the heavy lifting',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            With features extracted, training is trivially small — a logistic regression on a
            handful of dimensions. You don't write the optimizer; sklearn does. Don't overthink
            this step.
          </Lead>

          <CodeBlock
            lang="python"
            caption="rc/train.py"
            code={`import numpy as np
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.model_selection import cross_val_score

from rc.reservoir import Reservoir
from rc.features  import trace_features

def featurize(traces, labels, reservoir):
    """traces: list of (T, d) arrays;  labels: array of int."""
    X = np.vstack([trace_features(reservoir.run(t)) for t in traces])
    y = np.asarray(labels)
    return X, y

def build_classifier():
    return Pipeline([
        ("scale", StandardScaler()),
        ("lr",    LogisticRegression(max_iter=1000, C=1.0)),
    ])

def train_and_eval(traces, labels, n_neurons=4, gi=0.6, gf=0.4, seed=0):
    r = Reservoir(n_neurons=n_neurons, n_features=traces[0].shape[1],
                  gi=gi, gf=gf, seed=seed)
    X, y = featurize(traces, labels, r)
    clf = build_classifier()
    scores = cross_val_score(clf, X, y, cv=5, scoring="accuracy")
    return scores.mean(), scores.std()`}
          />

          <H2>Why StandardScaler</H2>
          <P>
            Your three feature groups (mean, std, last) have wildly different scales. Logistic
            regression is sensitive to that. Standardize them — it costs nothing and helps a lot.
          </P>

          <H2>Why 5-fold cross-validation</H2>
          <P>
            With ~50-100 traces per class, a single train/test split is high variance. 5-fold gives
            you a mean and a std — enough to tell whether tweaks are real or noise. Use it from day
            one.
          </P>

          <Callout tone="insight" title="What &quot;working&quot; looks like in Week 3">
            On 2 classes (benign vs cache-thrasher) with the operating point (G_i=0.6, G_f=0.4, N=4),
            you should see <strong>≥ 90% mean accuracy with std &lt; 3%</strong>. If you don't:
            check feature scaling, then trace quality, then reservoir output (is it stuck at ±1?).
          </Callout>
        </div>
      ),
    },
    {
      id: 'end-to-end',
      title: 'End-to-end: trace CSV → verdict',
      kicker: 'Wire it all together',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            By end of Week 3 you want one command: feed a CSV, get a verdict. Even if the verdict
            is wrong sometimes, the pipeline should be plumbed end-to-end. That's the deliverable.
          </Lead>

          <CodeBlock
            lang="python"
            caption="scripts/classify.py"
            code={`#!/usr/bin/env python3
"""Train an RC classifier on all traces in data/raw/, then evaluate."""

import argparse, glob, os
import numpy as np
import pandas as pd

from rc.reservoir import Reservoir
from rc.features  import trace_features
from rc.train     import build_classifier, featurize

def load_trace(path):
    df = pd.read_csv(path)
    # drop any rows where perf gave "<not counted>"
    df = df.dropna()
    return df.to_numpy(dtype=np.float64)

def collect(root):
    traces, labels = [], []
    for label_idx, cls in enumerate(sorted(os.listdir(root))):
        for f in glob.glob(os.path.join(root, cls, "*.csv")):
            t = load_trace(f)
            if len(t) < 50:  # too short, perf transient
                continue
            traces.append(t)
            labels.append(label_idx)
    return traces, np.asarray(labels)

if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--root", default="data/raw")
    ap.add_argument("--gi",   type=float, default=0.6)
    ap.add_argument("--gf",   type=float, default=0.4)
    ap.add_argument("--n",    type=int,   default=4)
    args = ap.parse_args()

    traces, labels = collect(args.root)
    r = Reservoir(n_neurons=args.n, n_features=traces[0].shape[1],
                  gi=args.gi, gf=args.gf, seed=0)
    X, y = featurize(traces, labels, r)
    clf  = build_classifier()
    clf.fit(X, y)
    print(f"Train accuracy: {clf.score(X, y):.3f}  on {len(y)} traces.")`}
          />

          <Callout tone="warn" title="Train ≠ test">
            The script above reports train accuracy for sanity. For real numbers, use
            cross-validation (see <Mono>train.py</Mono>) and reserve a held-out test set. Don't
            quote training accuracy in any write-up.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>By end of weekend 3 you should have: a working Reservoir class, a featurizer, a training pipeline, and a single command that produces a CV accuracy number on your collected data.</>,
        estimatedHours: '5-7 hours',
        tasks: [
          {
            title: 'Implement Reservoir, trace_features, build_classifier',
            description: <>Use the snippets above as a starting point. Treat them as scaffolding — adjust to fit your trace format.</>,
            files: ['hpc-classifier/rc/reservoir.py', 'hpc-classifier/rc/features.py', 'hpc-classifier/rc/train.py'],
            successCheck: 'pytest or a smoke-test script runs Reservoir.run on dummy data without errors.',
          },
          {
            title: 'Unit-test the reservoir',
            description: (
              <>
                Write 3 tests: (1) zero input → zero state forever; (2) constant input →
                state converges; (3) deterministic given a fixed seed.
              </>
            ),
            files: ['hpc-classifier/tests/test_reservoir.py'],
            successCheck: 'All 3 tests pass on first deliberate run.',
          },
          {
            title: 'Plumb the end-to-end script',
            description: <>scripts/classify.py loads traces, trains, prints accuracy. Hardcoded paths are fine for now.</>,
            files: ['hpc-classifier/scripts/classify.py'],
            successCheck: 'python scripts/classify.py prints a 5-fold CV accuracy ≥ 80% on benign vs cache-thrasher.',
          },
          {
            title: 'Commit the dataset metadata, not the data',
            description: <>Add data/raw/ to .gitignore. Commit a data/README.md describing the trace format and your class layout.</>,
            successCheck: 'A fresh clone can\'t accidentally redistribute trace CSVs.',
          },
        ],
      },
    },
  ],
}
