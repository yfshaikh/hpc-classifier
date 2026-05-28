import type { Track } from '../lib/types'
import { Callout, Figure, H2, Lead, LI, Mi, Mono, P, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { NoisePerturbation } from '../components/widgets/NoisePerturbation'

export const track7: Track = {
  id: 'robustness',
  index: 7,
  title: 'Robustness analysis',
  subtitle: 'Stress-testing the classifier',
  accent: 'attack',
  glyph: '07',
  outcome: 'Plots showing accuracy under noise and hyperparameter perturbation — paper Fig. 3 style.',
  lessons: [
    {
      id: 'what-is-robustness',
      title: 'What "robustness" means here',
      kicker: 'Three things, not one',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            "Robust" is a vague compliment unless you specify to what. The paper analyses three
            kinds of robustness. You should too — each tests a different real-world failure mode.
          </Lead>

          <H2>Three kinds of robustness to measure</H2>
          <UL>
            <LI>
              <strong>Input noise</strong> — accuracy under additive Gaussian noise on the input.
              Models the analog reality of the chip; for us, models real-world variability in HPC
              counts across runs.
            </LI>
            <LI>
              <strong>Hyperparameter perturbation</strong> — accuracy when G_i, G_f, N drift from
              their nominal values. Models manufacturing variation; for us, models how
              sensitive the model is to "good-enough" tuning.
            </LI>
            <LI>
              <strong>Distribution shift</strong> — accuracy on traces from a slightly different
              workload than was trained on. Not in the paper. Worth measuring anyway: it tells
              you whether the model is brittle outside its training distribution.
            </LI>
          </UL>

          <Callout tone="insight" title="Why this matters for embedded ML">
            Phase 2 will run quantized inference on an MCU. Quantization is itself a form of
            "noise on everything." A model that's brittle to small input noise in Phase 1 will be
            useless in Phase 2.
          </Callout>
        </div>
      ),
    },
    {
      id: 'noise-perturbation',
      title: 'Noise perturbation',
      kicker: 'Paper Fig. 3(b), your version',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            Add Gaussian noise of various standard deviations to every input sample. Retrain (or
            evaluate, depending on your protocol). Plot accuracy as a function of noise.
          </Lead>

          <Figure title="expected shape — accuracy vs input noise" caption="Move the slider. The paper sees accuracy holding above 90% up to ~1 mVrms of input noise.">
            <NoisePerturbation />
          </Figure>

          <H2>The protocol</H2>
          <CodeBlock
            lang="python"
            caption="scripts/noise_sweep.py"
            code={`import numpy as np

def evaluate_with_noise(traces, labels, reservoir, classifier_factory,
                        noise_levels, n_repeats=10, rng=None):
    from rc.train import featurize
    from sklearn.model_selection import cross_val_score

    rng = rng or np.random.default_rng(42)
    results = {}
    for sigma in noise_levels:
        accs = []
        for rep in range(n_repeats):
            noisy_traces = [t + rng.normal(0, sigma, t.shape) for t in traces]
            X, y = featurize(noisy_traces, labels, reservoir)
            acc = cross_val_score(classifier_factory(), X, y, cv=3).mean()
            accs.append(acc)
        results[sigma] = (float(np.mean(accs)), float(np.std(accs)))
    return results`}
          />

          <H2>Interpreting the curve</H2>
          <UL>
            <LI>A flat curve in a region around <Mi>σ = 0</Mi> means small input noise doesn't hurt — the reservoir is regularizing it.</LI>
            <LI>A sharp cliff is a sign of overfitting. If your model was relying on exact counter values, noise breaks it.</LI>
            <LI>A gradual slope is healthy — that's what the paper sees and you should aim for.</LI>
          </UL>

          <Callout tone="warn" title="What units of noise">
            The paper measures noise in mVrms because it's an analog chip. For your software, noise
            is a multiple of each feature's standard deviation. Report it as a fraction (e.g.{' '}
            "0.05σ" = 5% of the feature's natural variation).
          </Callout>
        </div>
      ),
    },
    {
      id: 'param-perturbation',
      title: 'Hyperparameter perturbation',
      kicker: 'Paper Fig. 3(a)',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            Take your chosen (G_i, G_f, N). Multiply each by (1 + ε) where ε is a small random
            perturbation. Re-evaluate. Repeat. Plot accuracy distribution as a function of |ε|.
          </Lead>

          <H2>What the paper finds</H2>
          <P>
            Accuracy stays above 90% as long as the perturbation is within ~11%. That's the
            "robustness budget." If your version blows up under 5%, the model is more brittle than
            the paper's — investigate before quoting numbers.
          </P>

          <H2>Code shape</H2>
          <CodeBlock
            lang="python"
            caption="scripts/param_perturb.py"
            code={`import numpy as np
from rc.reservoir import Reservoir
from rc.train     import build_classifier, featurize
from sklearn.model_selection import cross_val_score

def perturb_eval(traces, labels, gi=0.6, gf=0.4, n=4,
                 eps_levels=(0.0, 0.05, 0.10, 0.15, 0.20),
                 n_draws=20, rng=None):
    rng = rng or np.random.default_rng(7)
    out = {}
    for eps in eps_levels:
        accs = []
        for _ in range(n_draws):
            d_gi = gi * (1 + rng.uniform(-eps, eps))
            d_gf = gf * (1 + rng.uniform(-eps, eps))
            r = Reservoir(n_neurons=n, n_features=traces[0].shape[1],
                          gi=d_gi, gf=d_gf, seed=rng.integers(1, 1000))
            X, y = featurize(traces, labels, r)
            acc = cross_val_score(build_classifier(), X, y, cv=3).mean()
            accs.append(acc)
        out[eps] = (float(np.mean(accs)), float(np.std(accs)))
    return out`}
          />
        </div>
      ),
      implementation: {
        intro: <>By end of Week 6 you should have two robustness plots and a paragraph in the README explaining what they mean.</>,
        estimatedHours: '4-5 hours',
        tasks: [
          {
            title: 'Implement and run noise sweep',
            description: <>Use the code above. Pick σ values in (0, 1σ_feature).</>,
            files: ['hpc-classifier/scripts/noise_sweep.py', 'hpc-classifier/results/noise.png'],
            successCheck: 'A plot of mean ± std accuracy across 5+ noise levels.',
          },
          {
            title: 'Implement and run parameter perturbation',
            description: <>Same shape, but perturb (G_i, G_f) instead of inputs.</>,
            files: ['hpc-classifier/scripts/param_perturb.py', 'hpc-classifier/results/perturb.png'],
            successCheck: 'A plot showing accuracy as a function of perturbation magnitude.',
          },
          {
            title: 'Write the robustness paragraph',
            description: <>2 short paragraphs in the README: what you measured, what you found, comparison to the paper's 11% / 1 mV figures.</>,
            files: ['hpc-classifier/README.md'],
            successCheck: 'A reader knows your model\'s noise tolerance and hyperparameter sensitivity after a 60-second read.',
          },
        ],
      },
    },
  ],
}
