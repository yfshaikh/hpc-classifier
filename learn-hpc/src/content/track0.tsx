import type { Track } from '../lib/types'
import { Callout, DataTable, Figure, H2, H3, Lead, LI, Math, Mi, Mono, P, Term, UL } from '../components/ui/primitives'
import { RoadmapTimeline } from '../components/widgets/RoadmapTimeline'

export const track0: Track = {
  id: 'overview',
  index: 0,
  title: 'Overview & the paper',
  subtitle: 'What you\'re building and why',
  accent: 'data',
  glyph: '00',
  outcome: 'Understand the paper, your modifications, and the 7-week shape of Phase 1.',
  lessons: [
    {
      id: 'the-paper',
      title: 'The paper in 5 minutes',
      kicker: 'The thing you\'re reproducing',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            Chandrasekaran et al. (2022) built a tiny analog chip that watches a CPU's hardware
            performance counters and decides, in real time, whether that CPU is running malware.
            You are going to do a software-only version of the same idea — and learn embedded ML
            on the way.
          </Lead>

          <H2>The setup</H2>
          <P>
            Most CPUs expose <Term>hardware performance counters (HPCs)</Term> — special registers
            that count low-level events: <Mono>cache-misses</Mono>, <Mono>branch-misses</Mono>,{' '}
            <Mono>bus-cycles</Mono>, <Mono>instructions retired</Mono>, and so on. They are read
            cheaply because the hardware does the counting. Malware tends to leave different
            HPC fingerprints than normal software — different ratios of cache misses, weird branch
            patterns, anomalous bus traffic — because it is doing different things.
          </P>
          <P>
            The paper's bet is: <strong>feed HPC time-series into a small classifier and you can
            distinguish malware from benign workloads without static analysis, without signature
            databases, in microwatts.</strong>
          </P>

          <H2>The classifier: reservoir computing</H2>
          <P>
            Reservoir computing (RC) is a kind of recurrent neural network with a twist: the input
            and recurrent weights are <strong>random and never trained</strong>. Only a small linear
            layer at the output is trained. The reservoir is just a fixed nonlinear projector of the
            input time-series into a high-dimensional space where the classes become linearly
            separable. The paper's reservoir update is:
          </P>
          <Math>
            R_k[n] = H( <Mi>G_i</Mi> · W_k · X[n] + <Mi>G_f</Mi> · Wr_k · R[n−1] )
          </Math>
          <UL>
            <LI><Mi>X[n]</Mi> is the HPC sample at timestep n (4 counters, sampled every 1 ms).</LI>
            <LI><Mi>W, Wr</Mi> are random matrices with entries restricted to {'{0, 1}'} — multiplies become free additions.</LI>
            <LI><Mi>H(·)</Mi> is a saturating nonlinearity (in the chip, an amp; for us, <Mono>tanh</Mono>).</LI>
            <LI><Mi>G_i, G_f</Mi> are scalar gains. The paper picks <Mi>G_i = 0.6</Mi>, <Mi>G_f = 0.4</Mi>, <Mi>N = 4</Mi>.</LI>
          </UL>

          <H2>Why this matters</H2>
          <P>
            They built it in 65 nm CMOS. The whole classifier — analog reservoir, ADC, digital
            readout — drew <strong>38 µW at 1.2 V</strong> while detecting malware and Spectre-class
            attacks at <strong>~96 %</strong> accuracy. That is roughly <strong>50× less energy</strong> than
            running the same model digitally on an ARM Cortex-M3.
          </P>

          <Callout tone="insight" title="The point of the project for you">
            You will not be fabbing silicon. You will build the software version on a Jetson Nano,
            then (optionally) port quantized inference to an STM32F4. The goal is not to recreate
            the paper's chip — it's to learn embedded ML, HPC instrumentation, reservoir computing,
            and quantization by doing every piece by hand on tiny models.
          </Callout>
        </div>
      ),
      quiz: [
        {
          q: 'In the paper\'s RC, which matrices are trained?',
          options: ['W and Wr only', 'Only the output (readout) weights', 'All of W, Wr, and the readout', 'Nothing — it\'s rule-based'],
          answer: 1,
          explain: 'Only the output linear layer is trained. The input weights W and recurrent weights Wr are random and fixed — that is what makes RC cheap to train.',
        },
        {
          q: 'Why are weights restricted to {0, 1}?',
          options: ['To save flash space', 'To avoid floating-point math at runtime — multiplies become free adds', 'To make the network sparse', 'To keep accuracy high'],
          answer: 1,
          explain: 'With {0,1} weights, multiplication by W becomes "include this input or don\'t" — addition only. Massive energy/area saving in hardware.',
        },
      ],
      videos: [
        {
          title: 'Reservoir computing in 10 minutes — Chelsea Russell (TREND 2020)',
          url: 'https://www.youtube.com/watch?v=RQugL0oNMxU',
          duration: '20 min',
          note: 'plain-language intuition for what a reservoir is',
        },
        {
          title: 'Tiny ML, Harvard Style — Vijay Janapa Reddi (Stanford MLSys #57)',
          url: 'https://www.youtube.com/watch?v=489HEmRXzOE',
          duration: '60 min',
          note: 'situates this project inside the broader TinyML field',
        },
      ],
    },
    {
      id: 'modifications',
      title: 'Your modifications (and why)',
      kicker: 'What you\'re changing from the paper',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            You are not building the chip. You are not redistributing malware. You are using
            commodity hardware and synthetic adversarial workloads. Each change is on purpose.
          </Lead>

          <H2>What changes</H2>
          <DataTable
            head={['paper', 'this project', 'why']}
            rows={[
              ['65 nm CMOS analog reservoir', 'NumPy on Jetson Nano', 'no fab; goal is to learn the algorithm, not the silicon'],
              ['Real Mirai / Trojan / Rootkit samples', 'Self-written synthetic adversarial C programs', 'safety, legality, reproducibility'],
              ['ARM Cortex-A53 + Intel i5 dataset', 'ARM Cortex-A57 on the Nano', 'what you actually have on hand'],
              ['Output layer synthesised + measured off-chip', 'sklearn LogisticRegression on a laptop', 'we don\'t care about output-layer energy in Phase 1'],
              ['Real-time inference at 40 kHz', 'Offline batch inference', 'real-time is a Phase 2 concern'],
            ]}
          />

          <H2>What does NOT change</H2>
          <UL>
            <LI>The algorithm — the same Eq. 1, same {'{0,1}'} weights, same operating point.</LI>
            <LI>The framing — benign workloads vs. adversarial-shaped workloads.</LI>
            <LI>The metric goals — accuracy ≥ 95 %, robust to ~10 % parameter perturbation, robust to ~1 mV-equivalent input noise.</LI>
            <LI>The intent — build something embeddable, not just a Jupyter notebook.</LI>
          </UL>

          <H2>The synthetic workloads</H2>
          <P>
            Instead of running real malware, you'll write three small C programs that exhibit
            attack-shaped HPC patterns without being attacks:
          </P>
          <UL>
            <LI><strong>cache thrasher</strong> — strides through memory in cache-line-sized jumps to maximise cache misses (signature of timing side-channels).</LI>
            <LI><strong>branch-mispredict abuser</strong> — tight loops with data-dependent unpredictable branches (signature of Spectre-style speculation training).</LI>
            <LI><strong>row-buffer hammer</strong> — DRAM access pattern that maximises row activations (signature of Rowhammer, without actually flipping bits in modern DRAM).</LI>
          </UL>
          <P>
            These won't fool an OS-level attacker, but they reproduce the part you need: HPC
            signatures that are clearly distinct from MiBench-style benign workloads.
          </P>

          <Callout tone="warn" title="What you give up">
            A skeptic could rightly say: "you didn't actually detect malware, you detected programs
            that look statistically similar to malware." That's true. The mitigation is to be
            explicit about it in your write-up. The skill ladder you're climbing — HPC
            instrumentation, RC implementation, embedded inference — is real regardless of whether
            your dataset is real-malware or paper-shaped-malware.
          </Callout>
        </div>
      ),
      quiz: [
        {
          q: 'Why use synthetic adversarial workloads instead of real malware?',
          options: ['Real malware would crash the Nano', 'Legality, safety, and reproducibility — and the algorithm doesn\'t care', 'There is no real malware for ARM', 'sklearn can\'t handle it'],
          answer: 1,
          explain: 'You sidestep distribution and safety concerns and keep the project reproducible. The classifier learns whatever distribution you train it on.',
        },
      ],
    },
    {
      id: 'roadmap',
      title: 'The 7-week shape of Phase 1',
      kicker: 'How weekends turn into a working classifier',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            Phase 1 is a series of seven weekend-sized chunks. Each weekend leaves you with a
            visible deliverable: a CSV, a plot, a model, a confusion matrix. Click through the
            weeks below.
          </Lead>

          <Figure title="phase 1 roadmap">
            <RoadmapTimeline />
          </Figure>

          <H2>How to use this app</H2>
          <UL>
            <LI>
              Each module starts with concepts and an interactive widget or two — get comfortable
              with the idea before writing any code.
            </LI>
            <LI>
              Then comes a <span className="text-warn-bright">"Now build it"</span> block — concrete
              tasks to implement that weekend, with suggested file names and a "done when" check.
            </LI>
            <LI>
              Each module ends with a small list of <span className="text-data-bright">videos</span>{' '}
              to go deeper. Optional; helpful when you get stuck.
            </LI>
            <LI>
              Mark lessons complete with the checkbox at the bottom — progress is saved locally
              in your browser.
            </LI>
          </UL>

          <Callout tone="insight" title="Phase 2 is deferred — on purpose">
            Module 9 (fixed-point and quantization) is the gateway to Phase 2 (STM32 bare metal).
            Don't open it until Phase 1 is solid. People who plan both phases up-front usually
            rush Phase 1.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>Before week 1, set up scaffolding so you're not yak-shaving once content starts.</>,
        estimatedHours: '2-3 hours',
        tasks: [
          {
            title: 'Create the project layout',
            description: (
              <>
                Mirror the structure described in <Mono>CURRICULUM.md</Mono>. Phase 1 only needs Python.
              </>
            ),
            files: ['hpc-classifier/data/', 'hpc-classifier/workloads/', 'hpc-classifier/rc/', 'hpc-classifier/notebooks/', 'hpc-classifier/README.md'],
            successCheck: 'Empty directories committed with .gitkeep, top-level README explains the project in 1 paragraph.',
          },
          {
            title: 'Pin the Python environment',
            description: (
              <>
                Use a virtualenv or conda. Pin <Mono>numpy</Mono>, <Mono>scipy</Mono>,{' '}
                <Mono>scikit-learn</Mono>, <Mono>matplotlib</Mono>, <Mono>pandas</Mono>.
              </>
            ),
            files: ['hpc-classifier/requirements.txt'],
            successCheck: 'pip install -r requirements.txt works on the Nano from a clean venv.',
          },
          {
            title: 'Confirm Jetson Nano basics',
            description: (
              <>
                Boot the Nano, SSH in, run <Mono>uname -a</Mono> and <Mono>cat /proc/cpuinfo</Mono>.
                You should see Cortex-A57. Confirm <Mono>perf</Mono> is installed (<Mono>which perf</Mono>);
                if not, <Mono>apt install linux-tools-common linux-tools-$(uname -r)</Mono>.
              </>
            ),
            successCheck: 'perf --version prints a version. You can SSH into the Nano reliably.',
          },
        ],
      },
      videos: [
        {
          title: 'Paul McWhorter — Jetson Nano series, Lesson 1',
          url: 'https://toptechboy.com/category/jetson-nano/',
          note: 'getting started if you haven\'t set up the Nano yet',
        },
      ],
    },
  ],
}
