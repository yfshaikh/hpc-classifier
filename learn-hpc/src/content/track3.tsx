import type { Track } from '../lib/types'
import { Callout, Figure, H2, H3, Lead, LI, Math, Mi, Mono, P, Term, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { NonlinearityCurve } from '../components/widgets/NonlinearityCurve'
import { RcSimulator } from '../components/widgets/RcSimulator'
import { WeightMatrix } from '../components/widgets/WeightMatrix'

export const track3: Track = {
  id: 'rc-theory',
  index: 3,
  title: 'Reservoir computing — theory',
  subtitle: 'Why random nonlinear projection works',
  accent: 'signal',
  glyph: '03',
  outcome: 'A working intuition for what every term in Eq. 1 does and why they matter.',
  lessons: [
    {
      id: 'big-idea',
      title: 'The big idea: random projection makes classes separable',
      kicker: 'Untrained layers do useful work',
      minutes: 7,
      body: (
        <div className="lesson">
          <Lead>
            Suppose you have a 4-dimensional time-series — your HPC trace. The benign and
            adversarial classes are entangled in that space; no straight line separates them.
            What reservoir computing claims: project the time-series into a much higher-dimensional
            space using a fixed random nonlinear map, and the classes become close to linearly
            separable. Then a simple linear readout finishes the job.
          </Lead>

          <H2>Why "random" can work</H2>
          <P>
            The intuition comes from random feature methods (random Fourier features,
            extreme learning machines, kernel approximations). For many natural class boundaries,
            a sufficiently large random nonlinear projection approximates a useful kernel — without
            you having to choose or train the kernel. You just need <em>enough</em> dimensions and{' '}
            <em>enough</em> nonlinearity.
          </P>
          <P>
            RC adds two extra ingredients: <Term>recurrence</Term> (the projection has memory of
            past inputs, via <Mi>R[n−1]</Mi>) and <Term>sparsity / binary weights</Term> (cheap to
            run in hardware). The paper's reservoir has just <Mi>N = 4</Mi> neurons — small. The
            memory and nonlinearity are doing the heavy lifting, not raw dimensionality.
          </P>

          <H2>What gets trained</H2>
          <UL>
            <LI><strong>W</strong> (input weights, <Mi>N × d</Mi>): random {`{0, 1}`}, fixed at init.</LI>
            <LI><strong>Wr</strong> (reservoir weights, <Mi>N × N</Mi>): random sparse {`{0, 1}`}, fixed at init.</LI>
            <LI><strong>Wo</strong> (readout): trained via logistic regression on labeled data.</LI>
          </UL>

          <Figure title="W and Wr at typical settings" caption="Toggle N, d, sparsity, reseed. Notice that for any draw, the multiplies become free additions.">
            <WeightMatrix />
          </Figure>

          <Callout tone="insight" title="Why this is cheap to train">
            Only the readout is trained, and it's a linear layer. Training is just a logistic
            regression — closed-form-ish, fast, no backprop. You can retrain on new classes in
            seconds.
          </Callout>
        </div>
      ),
      quiz: [
        {
          q: 'In RC, what trains and what stays random?',
          options: [
            'Everything trains',
            'Only the input weights train',
            'Only the readout (output) layer trains; W and Wr are random and fixed',
            'Only Wr trains',
          ],
          answer: 2,
          explain: 'The reservoir is a fixed random nonlinear projector. Only the linear readout is fit to data.',
        },
      ],
    },
    {
      id: 'nonlinearity',
      title: 'The nonlinearity',
      kicker: 'Squashing keeps things bounded',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            Without a nonlinearity, the reservoir is just a linear filter on the input — no amount
            of random weights can make linearly-inseparable classes separable. The nonlinearity is
            what makes RC interesting.
          </Lead>

          <H2>What H(·) does</H2>
          <P>
            On the chip, <Mi>H</Mi> is a common-source amplifier with a saturating transfer
            function — roughly a sigmoid. In your software version, use <Mono>tanh</Mono>. It maps
            (−∞, +∞) → (−1, +1), is smooth, and is centered at zero (which helps gradient-free
            training stability).
          </P>

          <H3>Interactive: the activation curve</H3>
          <Figure title="H(x) = tanh(x)" caption="Drag the slider to probe input values. Note how the curve saturates beyond |x| ≈ 2.">
            <NonlinearityCurve />
          </Figure>

          <H2>Why saturation matters</H2>
          <P>
            With recurrent feedback, an unbounded nonlinearity would let the reservoir state blow
            up. Saturation provides a "soft clamp" — once <Mi>R_k</Mi> reaches ±1, further input
            growth has diminishing effect. The reservoir stays in a bounded operating region where
            small perturbations to <Mi>X</Mi> produce small perturbations to <Mi>R</Mi> — a
            necessary condition for stable training.
          </P>

          <Callout tone="note" title="What the paper uses">
            In Section III-B the paper shows the common-source amplifier with resistive
            feedforward. The transfer curve is close to tanh near zero but rolls off differently at
            saturation. For your NumPy version, tanh is the right approximation.
          </Callout>
        </div>
      ),
    },
    {
      id: 'recurrence',
      title: 'Recurrent feedback and memory',
      kicker: 'Why R[n−1] is in the equation',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            HPC traces are a time-series — the meaning of a single sample depends on what came
            before. A feedforward classifier would have to manually engineer features from history
            (rolling means, FFTs). The reservoir gets memory for free, because its current state
            depends on its previous state.
          </Lead>

          <Math>
            R_k[n] = H( <Mi>G_i</Mi> W_k · X[n] + <Mi>G_f</Mi> Wr_k · R[n−1] )
          </Math>

          <H2>The role of G_f</H2>
          <UL>
            <LI><Mi>G_f = 0</Mi> — no feedback. The reservoir becomes memoryless. Past samples can't affect the current state. RC degenerates to a fixed random projection of a single sample.</LI>
            <LI><Mi>G_f</Mi> small (~0.1) — short memory. Past samples decay quickly. Good for tasks that depend on recent context.</LI>
            <LI><Mi>G_f</Mi> moderate (~0.4 — paper) — useful memory horizon of tens of samples.</LI>
            <LI><Mi>G_f &gt; 1</Mi> — feedback amplifies. Reservoir becomes unstable (in the linear region) and bounces around — the echo state property is violated.</LI>
          </UL>

          <H3>Play with it</H3>
          <Figure title="reservoir state under a step input" caption="Watch what the per-neuron traces do as you push G_f past 0.7.">
            <RcSimulator />
          </Figure>

          <H2>Why sparse {`{0,1}`} Wr still has memory</H2>
          <P>
            You might expect a matrix of zeros and ones to be a poor memory device. But each
            non-zero entry on the diagonal creates a "memory cell" — that neuron's state feeds back
            into itself with gain <Mi>G_f</Mi>. Off-diagonal entries couple neurons. Even a small
            sparse Wr generates a rich state space.
          </P>
        </div>
      ),
      quiz: [
        {
          q: 'What happens to the reservoir if G_f = 0?',
          options: [
            'It becomes a linear classifier',
            'It loses memory — the current state depends only on the current input',
            'It outputs all zeros',
            'Training accuracy goes to 100%',
          ],
          answer: 1,
          explain: 'With no feedback term, R[n] depends only on H(G_i W X[n]) — no R[n-1]. The reservoir cannot remember anything.',
        },
      ],
    },
    {
      id: 'stability',
      title: 'Stability and the echo state property',
      kicker: 'Why G_f near 0.4 — and not 0.9',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            The "echo state property" (ESP) is a fancy name for a simple requirement: the reservoir
            must forget. Any initial condition should wash out over time, so the state depends only
            on the input history, not where you started. If ESP fails, your trained classifier is
            non-reproducible.
          </Lead>

          <H2>The math (informally)</H2>
          <P>
            In a linear recurrent system <Mi>R[n] = A R[n−1]</Mi>, stability is governed by the
            largest absolute eigenvalue of <Mi>A</Mi> — the <Term>spectral radius</Term>. If it's
            below 1, perturbations decay. If above 1, they grow. The nonlinearity gives some
            wiggle room, but in practice you want{' '}
            <Mi>spectral_radius(Wr) × G_f &lt; 1</Mi>.
          </P>

          <H2>For the paper's Wr</H2>
          <P>
            Because Wr is sparse with <Mi>{`{0, 1}`}</Mi> entries (paper says "sparsely filled
            identity matrix"), its largest eigenvalue is just <Mi>max(Wr_ii) = 1</Mi>. So the
            stability constraint becomes <Mi>G_f &lt; 1</Mi>. The paper picks{' '}
            <Mi>G_f = 0.4</Mi> — comfortably stable, but enough feedback to give the reservoir useful
            memory.
          </P>

          <H2>What instability looks like in your simulator</H2>
          <P>
            In the widget above, crank <Mi>G_f</Mi> up to 1.1. The reservoir state stops settling
            and instead oscillates without tracking the input. That's a violated ESP — the model
            is no longer learning a function of <Mi>X</Mi>, it's learning a function of (X, initial
            condition).
          </P>

          <H3>The robustness payoff</H3>
          <P>
            A stable reservoir is also what makes the paper's classifier robust to noise. Bounded
            inputs produce bounded states; small perturbations to inputs produce proportionally
            small perturbations to states. You'll quantify this in Module 7.
          </P>

          <Callout tone="insight" title="Picking your operating point">
            Your job in Phase 1 is not to derive optimal hyperparameters from scratch — the paper
            already did. Your job is to <strong>reproduce</strong> that they're optimal for your
            data and to <strong>understand</strong> why moving off them hurts.
          </Callout>
        </div>
      ),
      videos: [
        {
          title: 'Hinton — Lecture 8.4: Echo State Networks',
          url: 'https://www.youtube.com/watch?v=vlRwUV_sGcs',
          duration: '10 min',
          note: 'concise; good once you have the intuition above',
        },
        {
          title: 'Lukoševičius — A Practical Guide to Applying Echo State Networks (PDF)',
          url: 'https://www.ai.rug.nl/minds/uploads/PracticalESN.pdf',
          note: 'paper, not video, but the single best reference if you want depth',
        },
      ],
    },
  ],
}
