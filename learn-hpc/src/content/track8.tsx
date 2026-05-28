import type { Track } from '../lib/types'
import { Callout, Compare, H2, H3, Lead, LI, Mono, P, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'

export const track8: Track = {
  id: 'wrap',
  index: 8,
  title: 'Phase 1 wrap & Phase 2 go/no-go',
  subtitle: 'Decide whether to leave Python',
  accent: 'data',
  glyph: '08',
  outcome: 'A clean README documenting Phase 1 + a deliberate Phase 2 decision.',
  lessons: [
    {
      id: 'what-good-looks-like',
      title: 'What a finished Phase 1 looks like',
      kicker: 'The deliverable list',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            "I built it" is not enough. Future-you (and any LLM you bring in for Phase 2) needs to
            be able to reproduce, extend, and understand what you did. This is what good looks like.
          </Lead>

          <H2>The deliverable list</H2>
          <UL>
            <LI><strong>Working code</strong> — reservoir.py, features.py, train.py, scripts/, tests/.</LI>
            <LI><strong>Data hygiene</strong> — data/README explains the trace format. Actual CSVs gitignored.</LI>
            <LI><strong>Reproducible numbers</strong> — a single command reproduces every plot in results/.</LI>
            <LI><strong>Plots</strong> — sweep heatmap, confusion matrix, noise robustness, parameter robustness.</LI>
            <LI><strong>README</strong> — what the project is, how to run it, what numbers you got, what you'd do next.</LI>
          </UL>

          <H2>The README outline</H2>
          <CodeBlock
            lang="shell"
            caption="hpc-classifier/README.md"
            code={`# HPC classifier — modified replication of Chandrasekaran 2022

## What this is
- One paragraph: the paper, your modifications, why.

## Quick start
\`\`\`bash
make all
./scripts/collect_all.py
python scripts/classify.py
\`\`\`

## Phase 1 results
- 4-class CV accuracy: 0.XX ± 0.XX
- Operating point: G_i=0.6, G_f=0.4, N=4
- Noise tolerance: accuracy >= 0.90 up to 0.YYσ input noise
- Parameter robustness: accuracy >= 0.90 within ZZ% of nominal

## Caveats
- Synthetic adversarial workloads, not real malware.
- Trace-level classification, not per-sample.
- ...

## Phase 2 status
- [DECIDED YES / NO / DEFERRED]
- Rationale: ...

## File layout
...

## License & honesty
...`}
          />
        </div>
      ),
    },
    {
      id: 'phase2-decision',
      title: 'Should you do Phase 2?',
      kicker: 'A deliberate yes or no',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            Phase 2 is porting the trained classifier to bare-metal C on STM32F4 with fixed-point
            arithmetic and on-device latency / energy measurement. It's a lot of work. Don't drift
            into it — pick.
          </Lead>

          <Compare
            leftTitle="reasons NOT to"
            rightTitle="reasons to"
            leftTone="warn"
            rightTone="signal"
            left={
              <UL>
                <LI>Phase 1 accuracy is below 90% — fix that first, MCU work won't help.</LI>
                <LI>You're short on time this season — Phase 1 alone is a complete, defensible artifact.</LI>
                <LI>The thing you actually care about is the algorithm or the security framing, not the embedded part.</LI>
                <LI>You don't have a way to measure power on the F4 (no INA219 or shunt + multimeter setup).</LI>
              </UL>
            }
            right={
              <UL>
                <LI>You want to learn fixed-point math and quantization — Phase 2 is the most direct way.</LI>
                <LI>Your career direction is embedded ML — Phase 2 is the most-marketable part of the project.</LI>
                <LI>You have an STM32F4 on hand and time over a school break to focus.</LI>
                <LI>The paper's strongest claim is the energy number — without Phase 2, you can't verify the comparison.</LI>
              </UL>
            }
          />

          <H2>The middle path</H2>
          <P>
            "Yes, but later" is a real option. Document Phase 1 cleanly, mark Phase 2 as deferred,
            move on to other things for a few months. Coming back fresh is often better than
            grinding through.
          </P>

          <Callout tone="insight" title="If you say yes">
            Open Module 9. It's the first step. Don't start hardware work until you've internalized
            Q-format arithmetic on paper — half of fixed-point bugs are conceptual, not coding bugs.
          </Callout>

          <H3>If you say no — and want to extend Phase 1 instead</H3>
          <P>
            Alternative deepenings that don't require Phase 2:
          </P>
          <UL>
            <LI>Per-sample classification (paper-faithful), with the majority-vote at the trace level.</LI>
            <LI>Add a real benign benchmark suite (full MiBench) and one real adversarial workload from the security-research literature in a sandbox.</LI>
            <LI>Substitute different reservoir activation functions and quantify the trade-off.</LI>
          </UL>
        </div>
      ),
      implementation: {
        intro: <>This is the week of polishing rather than building. Don't skip it.</>,
        estimatedHours: '3-5 hours',
        tasks: [
          {
            title: 'Write the README',
            description: <>Use the outline above. Take screenshots of your plots. Include them.</>,
            files: ['hpc-classifier/README.md'],
            successCheck: 'A friend who hasn\'t seen the project can read it and explain what you built.',
          },
          {
            title: 'Add a "reproduce everything" script',
            description: <>One bash file that runs collection, training, sweep, perturbations, and writes all plots to results/.</>,
            files: ['hpc-classifier/scripts/reproduce.sh'],
            successCheck: 'A fresh clone + this script + your CSVs reproduces every number in the README.',
          },
          {
            title: 'Make the Phase 2 decision and write it down',
            description: <>Two paragraphs. What you decided, why. Commit it.</>,
            files: ['hpc-classifier/PHASE2.md'],
            successCheck: 'You don\'t have to re-decide next month.',
          },
        ],
      },
    },
  ],
}
