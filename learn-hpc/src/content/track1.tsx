import type { Track } from '../lib/types'
import { Callout, Compare, Figure, H2, H3, Lead, LI, Mono, P, Term, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { HpcTraceViewer } from '../components/widgets/HpcTraceViewer'
import { PerfCommandBuilder } from '../components/widgets/PerfCommandBuilder'

export const track1: Track = {
  id: 'hpcs',
  index: 1,
  title: 'HPCs as a security signal',
  subtitle: 'What hardware counters are and how to read them',
  accent: 'signal',
  glyph: '01',
  outcome: 'A working perf pipeline that emits clean HPC CSVs from any program.',
  lessons: [
    {
      id: 'what-is-an-hpc',
      title: 'What is a hardware performance counter?',
      kicker: 'A free-running tally in the CPU',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            Every modern CPU has a tiny set of dedicated registers that count microarchitectural
            events as they happen — cache misses, branch mispredictions, retired instructions.
            They tick in hardware, so reading them is almost free. This is your signal.
          </Lead>
          <P>
            On ARM Cortex-A57 (the Jetson Nano's CPU), the unit is called the{' '}
            <Term>PMU — Performance Monitoring Unit</Term>. It exposes a handful of programmable
            counters (typically 6 on A57) plus a dedicated cycle counter. You pick the events you
            want to count, the PMU does the counting, and software reads the totals at intervals.
          </P>

          <H2>What events look like</H2>
          <P>
            Each event has a hex code and a friendly name. <Mono>cache-misses</Mono> increments every
            time a memory load goes to L1/L2/L3 and misses. <Mono>branch-misses</Mono> increments every
            time the branch predictor was wrong. <Mono>bus-cycles</Mono> tracks system-bus activity. None
            of this requires instrumentation in your program — the events happen as a side effect of
            running.
          </P>
          <P>
            That's the key property for security: a program <em>cannot easily hide</em> its HPC
            footprint without changing what it actually does. A cache-timing attack has a cache
            footprint. A Spectre training loop has a branch-mispredict footprint. The signal exists
            whether or not the program wants it to.
          </P>

          <H2>Benign vs adversarial traces</H2>
          <P>
            Below: synthetic traces shaped like what you'll see on the Nano. Toggle between events
            and reseed to feel the distribution. Pay attention to the <em>variance</em>, not just
            the mean — the spikes are the tell.
          </P>
          <Figure title="benign vs adversarial HPC traces" caption="One trace per workload, sampled every 1 ms.">
            <HpcTraceViewer />
          </Figure>

          <Callout tone="insight">
            A linear classifier on the means alone would do okay. But the time-series structure —
            the bursts, the autocorrelations — is what RC is designed to exploit. That's why we
            don't just average the counters and call it a day.
          </Callout>
        </div>
      ),
      quiz: [
        {
          q: 'Roughly how cheap is it to read an HPC?',
          options: [
            'Comparable to a syscall (~1 µs)',
            'A few CPU cycles — it\'s just a register read',
            'It depends on cache state',
            'It requires a kernel context switch every time',
          ],
          answer: 1,
          explain: 'Once configured, the PMU counters are memory-mapped registers. Reading them is essentially a load instruction — a few cycles.',
        },
        {
          q: 'Why are HPCs harder for malware to hide than logs or syscalls?',
          options: [
            'They are encrypted',
            'They are produced as a side effect of execution; obscuring them requires changing what the program does',
            'They run in EL3',
            'Only signed code can read them',
          ],
          answer: 1,
          explain: 'HPCs are an inherent byproduct of the work the CPU is doing. Hiding the footprint means changing the work itself — which usually means the malware no longer functions.',
        },
      ],
      videos: [
        {
          title: 'Brendan Gregg — perf at Netflix (Kernel Recipes 2017)',
          url: 'https://www.youtube.com/watch?v=UVM3WX8Lq2k',
          duration: '60 min',
          note: 'the most useful single video on Linux perf',
        },
      ],
    },
    {
      id: 'perf-tool',
      title: 'perf — the Linux interface to HPCs',
      kicker: 'One command does most of what you need',
      minutes: 7,
      body: (
        <div className="lesson">
          <Lead>
            Linux exposes the PMU through the <Mono>perf</Mono> command. It hides the PMU registers
            behind named events and gives you sane output formats. For this project you only need
            one mode: <Mono>perf stat -I</Mono> — periodic counting.
          </Lead>

          <H2>The shape of a useful command</H2>
          <CodeBlock
            lang="bash"
            caption="periodic HPC sampling under perf stat"
            code={`perf stat \\
  -e branch-misses,cache-misses,bus-cycles,instructions \\
  -I 1 \\
  -x , \\
  -- ./benign 2> trace.csv`}
          />
          <UL>
            <LI><Mono>-e</Mono> — comma-separated event list. Stick to 4 on the Nano.</LI>
            <LI><Mono>-I 1</Mono> — print counts every 1 ms.</LI>
            <LI><Mono>-x ,</Mono> — CSV-ish output (separator <Mono>,</Mono>).</LI>
            <LI><Mono>-- ./benign</Mono> — the program to monitor. <Mono>2&gt; trace.csv</Mono> because perf writes to stderr.</LI>
          </UL>

          <H3>Try assembling one</H3>
          <Figure title="perf command builder" caption="Toggle events, set interval, see the command.">
            <PerfCommandBuilder />
          </Figure>

          <H2>Listing available events</H2>
          <P>
            Not every event exists on every CPU. List what your kernel exposes for your CPU with:
          </P>
          <CodeBlock lang="bash" code={`perf list hw cache`} />
          <P>
            Take the named events you find here. Don't try to use Intel event names on ARM — you'll
            get "event syntax error". The exact names you'll see on Cortex-A57 include{' '}
            <Mono>branch-instructions</Mono>, <Mono>branch-misses</Mono>, <Mono>cache-references</Mono>,{' '}
            <Mono>cache-misses</Mono>, <Mono>bus-cycles</Mono>, <Mono>cycles</Mono>,{' '}
            <Mono>instructions</Mono>.
          </P>

          <Callout tone="warn" title="paranoid mode = no events">
            On stock Ubuntu/L4T, <Mono>/proc/sys/kernel/perf_event_paranoid</Mono> defaults to 2 or 3.
            That blocks non-root from reading most events. Either run perf with sudo, or:{' '}
            <Mono>{`sudo sh -c 'echo -1 > /proc/sys/kernel/perf_event_paranoid'`}</Mono> (resets on reboot
            — make permanent in <Mono>/etc/sysctl.d/</Mono> if you go that route).
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>This is the bulk of Week 1: get a clean, scripted HPC trace pipeline.</>,
        estimatedHours: '4-6 hours',
        tasks: [
          {
            title: 'Pick your 4 events',
            description: (
              <>
                Run <Mono>perf list hw cache</Mono> on the Nano. Confirm{' '}
                <Mono>branch-misses</Mono>, <Mono>cache-misses</Mono>, <Mono>bus-cycles</Mono>, and{' '}
                <Mono>instructions</Mono> all exist. If one doesn't, document the substitute and why.
              </>
            ),
            files: ['hpc-classifier/data/events.txt'],
            successCheck: 'A text file with the 4 chosen events, one per line, with one-sentence rationale each.',
          },
          {
            title: 'Write the collection script',
            description: (
              <>
                A shell script that takes a program path, runs it under <Mono>perf stat -I 1</Mono>{' '}
                with the 4 chosen events, and writes the raw output to a CSV. Strip perf's leading
                lines so each row is just <Mono>timestamp,counter0,counter1,counter2,counter3</Mono>.
              </>
            ),
            files: ['hpc-classifier/scripts/collect.sh'],
            successCheck: './collect.sh ./hello.out hello_trace.csv produces a CSV with one row per ms.',
          },
          {
            title: 'Sanity-check on a known workload',
            description: (
              <>
                Run it against something obvious like <Mono>dd if=/dev/zero of=/dev/null bs=1M count=100</Mono> or a
                tight integer loop you wrote. Inspect the CSV — counts should be roughly stable,
                values plausible (millions to billions for cycles).
              </>
            ),
            successCheck: 'You can describe each column\'s shape in 1 sentence and explain why.',
          },
        ],
      },
      videos: [
        {
          title: 'Brendan Gregg — Linux perf examples (page, not video)',
          url: 'https://www.brendangregg.com/perf.html',
          note: 'reference. Bookmark it.',
        },
      ],
    },
    {
      id: 'multiplexing',
      title: 'Event multiplexing and counter limits',
      kicker: 'Why 4 events, not 14',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            Cortex-A57 has 6 programmable PMU counters. So can't you just monitor 6 events at once?
            Yes, technically. But there's a subtler trap: ask for too many and the kernel will
            silently rotate them, giving you scaled estimates instead of true counts.
          </Lead>

          <H2>What multiplexing does</H2>
          <P>
            If you ask perf for more events than the PMU has counters, the kernel time-multiplexes:
            it counts a subset for a slice of time, swaps to another subset, scales the result up
            to estimate the full count. The output is a guess. For training a classifier on
            1 ms windows this guess is noisy enough to confuse the model.
          </P>

          <Compare
            leftTitle="14 events requested"
            rightTitle="4 events requested"
            leftTone="attack"
            rightTone="signal"
            left={
              <>
                <P>PMU has 6 counters. Kernel rotates 14 events through them.</P>
                <P>perf reports counts scaled by <em>(time event was active / total time)</em>.</P>
                <P>Per-window counts contain estimation noise from the rotation pattern.</P>
              </>
            }
            right={
              <>
                <P>4 events fit in 6 hardware counters with headroom.</P>
                <P>No multiplexing. Counts are exact.</P>
                <P>Classifier sees clean signal.</P>
              </>
            }
          />

          <H2>The paper's choice (and yours)</H2>
          <P>
            The paper used <strong>4 events</strong>: branch-misses, cache-misses, bus-cycles,
            instructions. Stick to those for Phase 1. There is a real research question in "which
            4?" but it is a different research question, and you don't need to answer it to build
            this project.
          </P>

          <Callout tone="note" title="A subtler version of the same problem">
            Even within 4 events, if your program is very short (sub-ms), perf gives you junk for
            the first window because the counters haven't accumulated yet. Drop the first few rows
            from every trace, or use longer programs.
          </Callout>
        </div>
      ),
      quiz: [
        {
          q: 'What does perf do when you ask for more events than the PMU has counters?',
          options: [
            'Errors out',
            'Time-multiplexes the events and scales counts to estimates',
            'Crashes the kernel',
            'Only counts the first N events',
          ],
          answer: 1,
          explain: 'perf rotates events through the available counters and scales — so you get estimates, not exact counts. For our 1 ms windows, that noise is meaningful.',
        },
      ],
    },
    {
      id: 'sanity',
      title: 'Sanity-checking your traces',
      kicker: 'Trust nothing until you see the shape',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            The single biggest time sink on Week 1 is collecting bad data and then training a
            classifier on it. Spend an hour staring at plots before training anything.
          </Lead>

          <H2>What "good" data looks like</H2>
          <UL>
            <LI>Each column has values in the right order of magnitude (1e6 - 1e9 for cycles per ms, 1e3 - 1e6 for branch misses).</LI>
            <LI>Within a single workload trace, the values aren't completely flat — there's some structure.</LI>
            <LI>Between benign and adversarial, mean or variance shifts visibly.</LI>
            <LI>Sample count matches the wall-clock duration × 1 kHz (1 sample per ms).</LI>
          </UL>

          <H2>What broken data looks like</H2>
          <UL>
            <LI>A column of all zeros (event was wrong, kernel paranoid, or program didn't run long enough).</LI>
            <LI>A column with a single huge value at the start (perf startup transient).</LI>
            <LI>NaN or "&lt;not counted&gt;" rows (multiplexing failure).</LI>
            <LI>Two columns that look identical (you accidentally listed the same event twice).</LI>
          </UL>

          <Callout tone="insight" title="Make plotting trivial">
            Write a 20-line matplotlib script you can run on any trace CSV. Make plotting the
            default thing you do after collecting. If it's a chore, you'll skip it; if it's one
            command, you'll catch problems early.
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>Build the muscle of "always look at the trace first."</>,
        estimatedHours: '2 hours',
        tasks: [
          {
            title: 'Write a trace-plotter',
            description: (
              <>
                Takes a CSV path and an optional <Mono>--save</Mono> flag. Plots all four columns
                in a 2×2 grid. Title it with the source program name and sample count. No fancy
                styling — just speed.
              </>
            ),
            files: ['hpc-classifier/scripts/plot_trace.py'],
            successCheck: 'plot_trace.py hello_trace.csv shows 4 plots in <2 s.',
          },
          {
            title: 'Define the trace data format',
            description: (
              <>
                Decide and document: column order, header row or not, units, sample rate. Write it
                in a README in the data directory. Future-you will thank present-you.
              </>
            ),
            files: ['hpc-classifier/data/README.md'],
            successCheck: 'A new contributor could load and interpret a trace from the README alone.',
          },
        ],
      },
    },
  ],
}
