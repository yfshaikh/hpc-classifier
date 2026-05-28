import type { Track } from '../lib/types'
import { Attack, Callout, Figure, H2, H3, Lead, LI, Mono, P, Term, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { CacheAccessPattern } from '../components/widgets/CacheAccessPattern'

export const track2: Track = {
  id: 'workloads',
  index: 2,
  title: 'Synthetic adversarial workloads',
  subtitle: 'Writing programs with attack-shaped HPC signatures',
  accent: 'attack',
  glyph: '02',
  outcome: 'Three small C programs whose HPC traces look distinct from benign baseline.',
  lessons: [
    {
      id: 'why-synthetic',
      title: 'Why synthetic instead of real malware',
      kicker: 'Sidestepping a distribution problem',
      minutes: 4,
      body: (
        <div className="lesson">
          <Lead>
            Distributing real malware is a legal and safety mess. You don't need to. The classifier
            doesn't care whether the attack-shaped trace came from real malware or from a C program
            you wrote to mimic the shape — it learns the distribution you give it.
          </Lead>

          <H2>What we steal from the malware literature</H2>
          <UL>
            <LI>
              The <strong>shapes</strong> of HPC perturbations: cache-miss bursts (timing
              side-channels), branch-mispredict storms (Spectre training), DRAM row-activation
              spikes (Rowhammer).
            </LI>
            <LI>
              The <strong>variance</strong>: real attacks tend to have higher per-window variance
              than benign workloads doing steady work.
            </LI>
            <LI>
              The <strong>multi-modal structure</strong>: real attacks alternate between phases
              (priming, attacking, exfiltrating). Our synthetic programs will too.
            </LI>
          </UL>

          <H2>What we don't get from synthetic workloads</H2>
          <UL>
            <LI>Realistic system noise (other processes, kernel interrupts, etc. — that's fine; perf captures real system noise around your synthetic program).</LI>
            <LI>The "evasive" properties of advanced malware that tries to look benign — but that's a research frontier the original paper barely touches either.</LI>
          </UL>

          <Callout tone="warn" title="Be honest in the write-up">
            Your contribution is reproducing the algorithm and pipeline. You did not detect novel
            malware. Stating this clearly in your README protects you against the critique and
            preserves the value of what you actually built.
          </Callout>
        </div>
      ),
    },
    {
      id: 'cache-thrasher',
      title: 'The cache thrasher',
      kicker: 'Maximising cache-miss signature',
      minutes: 7,
      body: (
        <div className="lesson">
          <Lead>
            Cache-timing side-channels work by repeatedly evicting a target line and timing whether
            the victim reloads it. The HPC signature is a tall sustained spike in{' '}
            <Mono>cache-misses</Mono> while other counters remain modest.
          </Lead>

          <H2>How real cache attacks behave</H2>
          <P>
            Attacks like <Attack>Flush+Reload</Attack> use the <Mono>clflush</Mono> instruction to
            push a chosen line out of cache, then measure access time on reload to infer whether
            the victim touched it. ARM doesn't have <Mono>clflush</Mono>, but the equivalent is
            achieved by accessing addresses that collide in the same cache set.
          </P>

          <H3>Access patterns and what they do to L1</H3>
          <Figure title="cache access patterns" caption="Try the thrasher — see the miss rate jump.">
            <CacheAccessPattern />
          </Figure>

          <H2>The synthetic version</H2>
          <P>
            A cache thrasher is the simplest of the three. Allocate a buffer larger than the L3
            cache. Stride through it in increments equal to a cache line (64 bytes). Repeat.
            Almost every load misses L1; many miss L2; some miss L3. Your{' '}
            <Mono>cache-misses</Mono> counter rockets up.
          </P>
          <CodeBlock
            lang="c"
            caption="workloads/cache_thrash.c — minimum viable thrasher"
            code={`#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define BUF_BYTES (64UL * 1024 * 1024)  // 64 MB > any reasonable L3
#define STRIDE    64                     // one cache line

int main(int argc, char **argv) {
    size_t iters = (argc > 1) ? strtoul(argv[1], NULL, 10) : 200;
    uint8_t *buf = aligned_alloc(64, BUF_BYTES);
    if (!buf) return 1;
    memset(buf, 0, BUF_BYTES);

    volatile uint64_t sink = 0;
    for (size_t k = 0; k < iters; k++) {
        for (size_t i = 0; i < BUF_BYTES; i += STRIDE) {
            sink += buf[i];          // forces a load
            buf[i] = (uint8_t)sink;  // forces a store; defeats elision
        }
    }

    free(buf);
    return (int)(sink & 0xff);
}`}
          />

          <Callout tone="note" title="Why the volatile sink">
            Without the dependence on <Mono>sink</Mono> and the store to <Mono>buf[i]</Mono>, the
            compiler will happily delete the entire loop body. Always read AND write through a
            volatile to keep the optimizer honest in microbenchmarks.
          </Callout>

          <H2>Compile and verify the signature</H2>
          <CodeBlock
            lang="bash"
            code={`gcc -O2 -o cache_thrash workloads/cache_thrash.c
./collect.sh ./cache_thrash thrash_trace.csv
python scripts/plot_trace.py thrash_trace.csv`}
          />
          <P>
            Compare against a benign trace (from a sequential loop). The cache-misses column
            should be 5-50× higher in the thrasher, with bus-cycles also elevated. If it isn't,
            check whether your buffer actually exceeds L3 and whether <Mono>-O2</Mono> ate your loop.
          </P>
        </div>
      ),
      quiz: [
        {
          q: 'Why does the thrasher use stride = 64 bytes?',
          options: [
            'Memory pages are 64 B',
            'A cache line is typically 64 B — striding by one line touches a new line each step',
            'malloc rounds to 64 B',
            'It\'s the smallest aligned access',
          ],
          answer: 1,
          explain: 'Cache lines are usually 64 B on ARM and x86. Striding by exactly that means every access lands on a new line and most miss.',
        },
      ],
      implementation: {
        intro: <>You're building the first of three synthetic workloads. Get the toolchain and one workload nailed before you replicate to two more.</>,
        estimatedHours: '3 hours',
        tasks: [
          {
            title: 'Implement cache_thrash.c',
            description: <>Use the snippet above as a starting point. Make it parameterized by iteration count via argv[1].</>,
            files: ['hpc-classifier/workloads/cache_thrash.c'],
            successCheck: 'Compiles with gcc -O2 and runs for 1-5 s on the Nano.',
          },
          {
            title: 'Add a Makefile',
            description: <>One target per workload, plus an <Mono>all</Mono>. Don't get fancy — 20 lines.</>,
            files: ['hpc-classifier/workloads/Makefile'],
            successCheck: 'make all builds every workload binary in workloads/bin/.',
          },
          {
            title: 'Collect and plot',
            description: <>Run collect.sh against the thrasher. Inspect the trace. Save the CSV with a descriptive name.</>,
            files: ['hpc-classifier/data/raw/cache_thrash_001.csv'],
            successCheck: 'The plotted cache-misses column is visibly higher than your benign sanity check from Week 1.',
          },
        ],
      },
    },
    {
      id: 'branch-mispredict',
      title: 'The branch-mispredict abuser',
      kicker: 'A Spectre-shaped HPC signature, harmless edition',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            Spectre attacks rely on training the branch predictor with a long sequence of
            attacker-controlled branches, then luring it into mispredicting toward attacker-chosen
            speculative code. The HPC signature: branch-misses spike while instructions retired
            stays modest (lots of speculative work gets thrown away).
          </Lead>

          <H2>Reproducing the shape</H2>
          <P>
            The synthetic version: a tight loop with a branch whose outcome depends on data the
            predictor can't learn (a hash or a pseudo-random sequence). The predictor is wrong
            almost every iteration. We don't actually exploit anything — there is no victim, no
            leaked secret. We just trigger the counter.
          </P>
          <CodeBlock
            lang="c"
            caption="workloads/branch_abuse.c"
            code={`#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>

static inline uint32_t xorshift(uint32_t *s) {
    uint32_t x = *s;
    x ^= x << 13; x ^= x >> 17; x ^= x << 5;
    *s = x; return x;
}

int main(int argc, char **argv) {
    size_t iters = (argc > 1) ? strtoul(argv[1], NULL, 10) : 200000000UL;
    uint32_t s = 0xABCDEF01;
    volatile uint64_t acc = 0;

    for (size_t i = 0; i < iters; i++) {
        // Branch outcome is data-dependent and effectively random
        // -> predictor can\'t learn it -> mispredicts at ~50%.
        if (xorshift(&s) & 1) {
            acc += i;
        } else {
            acc ^= i;
        }
    }
    return (int)(acc & 0xff);
}`}
          />

          <H2>Why this works</H2>
          <UL>
            <LI>The branch is taken or not based on a pseudo-random bit — no spatial or temporal pattern for the predictor to latch onto.</LI>
            <LI>The two arms do different work (<Mono>+=</Mono> vs <Mono>^=</Mono>) so the compiler can't merge them.</LI>
            <LI>The volatile sink prevents dead-code elimination.</LI>
          </UL>

          <Callout tone="insight" title="What you should see">
            On the Nano, branch-misses for this program will be on the order of <strong>10⁸ per
            second</strong>. For a benign program of similar duration, expect 10⁶ at most.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>The second synthetic workload. Should feel quicker now that the toolchain exists.</>,
        estimatedHours: '1-2 hours',
        tasks: [
          {
            title: 'Implement branch_abuse.c',
            description: <>Use the snippet. Tune <Mono>iters</Mono> so the runtime is 1-3 s on the Nano.</>,
            files: ['hpc-classifier/workloads/branch_abuse.c'],
            successCheck: 'Trace shows branch-misses elevated ~100× vs benign baseline.',
          },
        ],
      },
    },
    {
      id: 'benign-baseline',
      title: 'Building a benign baseline',
      kicker: 'Half your dataset is "normal"',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            A classifier is only as good as its negative class. If your benign baseline is "one
            tight integer loop," you've taught the model to detect anything that is not a tight
            integer loop. Make benign diverse.
          </Lead>

          <H2>What to include</H2>
          <UL>
            <LI>
              <strong>Compute-bound</strong> — matrix multiply, FFT, integer hash loop. Steady
              instructions retired, low cache-misses, moderate branch activity.
            </LI>
            <LI>
              <strong>Memory-bound (benign)</strong> — sequential copies, naïve image filters,
              string operations. Memory traffic without the variance pattern of an attack.
            </LI>
            <LI>
              <strong>Control-flow-rich (benign)</strong> — parsing, sorting. Branch activity that
              the predictor handles fine — high branches, low branch-misses.
            </LI>
          </UL>

          <H2>Sources</H2>
          <P>
            The paper uses the MiBench, CHStone, and Phoronix benchmark suites for benign. MiBench
            in particular is small, portable, easy to build, and free. You don't need all of it —
            pick 4-6 programs that span the three categories above.
          </P>

          <H2>Collecting at scale</H2>
          <P>
            Write a small driver script that, for each workload, runs it N times under perf with
            different seeds or input sizes and emits one CSV per run. Aim for{' '}
            <strong>50-100 traces per class</strong> for Phase 1.
          </P>

          <Callout tone="warn" title="Keep one fold for testing">
            Reserve 20% of your collected traces as a held-out test set <em>before</em> looking at any
            metric. If you use the test set during hyperparameter selection, you've leaked
            information and your final accuracy will be optimistic.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>Build the benign half of the dataset.</>,
        estimatedHours: '3-4 hours',
        tasks: [
          {
            title: 'Pick benign programs',
            description: (
              <>
                Choose 4-6 from MiBench (basicmath, qsort, susan, dijkstra, FFT, stringsearch are
                good starting points). Build them on the Nano. Verify each runs to completion in
                1-5 s.
              </>
            ),
            files: ['hpc-classifier/workloads/benign/'],
            successCheck: 'Each benign binary in workloads/benign/bin/ runs cleanly.',
          },
          {
            title: 'Implement the row-buffer hammer',
            description: (
              <>
                The third adversarial workload. Allocate a buffer many MB in size; access addresses
                that differ by exactly the DRAM row size (typically 8 KB on the Nano's LPDDR4).
                Same defensive volatile-sink pattern as the thrasher.
              </>
            ),
            files: ['hpc-classifier/workloads/row_hammer.c'],
            successCheck: 'Trace shows elevated bus-cycles relative to cache-misses (the distinguishing pattern for row-buffer pressure).',
          },
          {
            title: 'Write the batch collector',
            description: (
              <>
                A Python script that walks <Mono>workloads/bin/</Mono>, runs each binary under
                collect.sh N times, and writes CSVs to <Mono>data/raw/CLASS/PROGRAM_RUN.csv</Mono>.
              </>
            ),
            files: ['hpc-classifier/scripts/collect_all.py'],
            successCheck: 'A single command produces 50+ traces per class.',
          },
        ],
      },
      videos: [
        {
          title: 'SoK: HPCs for Security — IEEE Security & Privacy talk',
          url: 'https://www.classcentral.com/course/youtube-sok-the-challenges-pitfalls-and-perils-of-using-hardware-performance-counters-for-security-148360',
          duration: '20 min',
          note: 'a critical look at the field — worth knowing the standard pushback',
        },
      ],
    },
  ],
}
