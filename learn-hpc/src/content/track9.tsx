import type { Track } from '../lib/types'
import { Callout, Compare, Figure, H2, H3, Lead, LI, Math, Mi, Mono, P, UL } from '../components/ui/primitives'
import { CodeBlock } from '../components/ui/CodeBlock'
import { QFormatCalc } from '../components/widgets/QFormatCalc'

export const track9: Track = {
  id: 'fixed-point',
  index: 9,
  title: 'Fixed-point & quantization (Phase 2 prep)',
  subtitle: 'From float64 NumPy to int16 bare-metal C',
  accent: 'attack',
  glyph: '09',
  outcome: 'A quantized reservoir.c that matches the NumPy reference within target tolerance.',
  lessons: [
    {
      id: 'why-fixed-point',
      title: 'Why fixed-point matters',
      kicker: 'Floats are expensive on small MCUs',
      minutes: 5,
      body: (
        <div className="lesson">
          <Lead>
            Your STM32F4 has a hardware FPU, so you <em>could</em> just use floats and skip this
            module. But Phase 2 is your chance to learn the fundamentals of embedded ML — and on
            the M0/M3 chips most TinyML lives on, there is no FPU. Fixed-point is the skill.
          </Lead>

          <Compare
            leftTitle="float on M0/M3"
            rightTitle="fixed-point on M0/M3"
            leftTone="warn"
            rightTone="signal"
            left={
              <UL>
                <LI>Soft-float library — every multiply is ~100 cycles.</LI>
                <LI>~4 KB of additional flash for the math library.</LI>
                <LI>Energy disaster: the paper's 50× advantage is real for a reason.</LI>
              </UL>
            }
            right={
              <UL>
                <LI>Multiply is a single instruction (<Mono>MUL</Mono>, ~1-3 cycles).</LI>
                <LI>No soft-float library needed.</LI>
                <LI>Comparable energy to the analog reservoir per inference.</LI>
              </UL>
            }
          />

          <H2>Why your F4 deserves the exercise anyway</H2>
          <P>
            Even on the F4, doing the project in fixed-point teaches you the part of TinyML that
            float would let you skip. If you ever want to deploy on a smaller MCU (M0, M0+),
            you'll need it.
          </P>
        </div>
      ),
    },
    {
      id: 'q-format',
      title: 'Q-format — integers that pretend to be fractions',
      kicker: 'The fundamental trick',
      minutes: 7,
      body: (
        <div className="lesson">
          <Lead>
            Q-format stores a real number x as an integer x · 2^n. You agree on n in advance —
            "this is a Q15 number" means the integer is x · 2^15 and lives in an int16. All
            arithmetic is then integer arithmetic with strategic shifts.
          </Lead>

          <H2>Notation</H2>
          <UL>
            <LI><strong>Q15</strong> — 15 fractional bits, 1 sign bit. Fits in int16. Range: [−1, +1 − 2^−15].</LI>
            <LI><strong>Q31</strong> — 31 fractional bits, 1 sign bit. Fits in int32. Range: [−1, +1 − 2^−31].</LI>
            <LI><strong>Q7</strong> — 7 fractional bits, 1 sign bit. Fits in int8. Range: [−1, +1 − 2^−7].</LI>
          </UL>

          <H3>Try it</H3>
          <Figure title="Q-format calculator" caption="Slide a float. Watch the integer, binary, hex, and quantization error change.">
            <QFormatCalc />
          </Figure>

          <H2>The two key operations</H2>
          <P><strong>Addition.</strong> Same format → just add the integers. No shift.</P>
          <Math>
            x + y → x_int + y_int (both Q15)
          </Math>

          <P>
            <strong>Multiplication.</strong> Multiplying two Q15 numbers produces a Q30 number,
            which fits in a wider int. To bring it back to Q15, shift right by 15.
          </P>
          <Math>
            x · y → (x_int * y_int) &gt;&gt; 15 (cast to int32 for the multiply!)
          </Math>

          <Callout tone="warn" title="The bug everyone hits">
            <Mono>int16_t a * int16_t b</Mono> in C may produce an int16 (depending on integer
            promotion rules) which then overflows. Always cast at least one operand to int32:
            <Mono> (int32_t)a * b &gt;&gt; 15</Mono>. Add static analysis to catch missed casts.
          </Callout>
        </div>
      ),
    },
    {
      id: 'quantizing-rc',
      title: 'Quantizing the reservoir',
      kicker: 'Every value chooses a Q-format',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            With a 4-neuron reservoir, you have just a handful of state values and weights. Pick
            the Q-format for each, propagate it through the math, and you have a working int16
            implementation. Compare against NumPy to verify.
          </Lead>

          <H2>Choosing Q-formats</H2>
          <UL>
            <LI><strong>W, Wr</strong> — {`{0, 1}`}. Integers in {`{0, 1}`}. No Q-format needed; treat as bool.</LI>
            <LI><strong>X (input HPC sample)</strong> — pre-normalize to [−1, +1]. Then Q15.</LI>
            <LI><strong>R (reservoir state)</strong> — output of tanh, lives in [−1, +1]. Q15.</LI>
            <LI><strong>G_i, G_f</strong> — known constants. Q15.</LI>
            <LI><strong>Pre-activation (G_i W X + G_f Wr R)</strong> — could exceed [−1, +1]. Use Q14 or wider int for the intermediate.</LI>
          </UL>

          <H2>The C inference</H2>
          <CodeBlock
            lang="c"
            caption="phase2/rc/reservoir_q15.c"
            code={`#include <stdint.h>
#include "tanh_q15.h"   // precomputed lookup table

#define N 4
#define D 4

// All Q15 constants
#define GI_Q15  19661   // round(0.6 * 32768)
#define GF_Q15  13107   // round(0.4 * 32768)

// {0,1} weights, packed for compactness (1 bit each)
static const uint8_t W[N]  = { 0b1010, 0b0101, 0b1100, 0b0011 };
static const uint8_t Wr[N] = { 0b1000, 0b0100, 0b0010, 0b0001 };  // diagonal

// Returns reservoir state in q15. Caller manages r_prev across timesteps.
void reservoir_step(const int16_t x_q15[D],
                    int16_t r_q15[N],
                    int16_t r_prev_q15[N])
{
    for (int k = 0; k < N; k++) {
        int32_t input_term = 0;
        for (int j = 0; j < D; j++) {
            if (W[k] & (1U << j)) {
                input_term += x_q15[j];
            }
        }
        // input_term is Q15 (sum of Q15 values). Apply G_i: Q15 * Q15 -> Q30, shift down.
        int32_t scaled_input = ((int32_t)GI_Q15 * input_term) >> 15;

        int32_t fb_term = 0;
        for (int j = 0; j < N; j++) {
            if (Wr[k] & (1U << j)) {
                fb_term += r_prev_q15[j];
            }
        }
        int32_t scaled_fb = ((int32_t)GF_Q15 * fb_term) >> 15;

        int32_t pre = scaled_input + scaled_fb;
        // Clamp to int16 range before lookup
        if (pre >  32767) pre =  32767;
        if (pre < -32768) pre = -32768;

        r_q15[k] = tanh_q15((int16_t)pre);
    }
}`}
          />

          <H2>The tanh table</H2>
          <P>
            <Mono>tanh(x)</Mono> in fixed-point is best implemented as a lookup table with linear
            interpolation. A 257-entry int16 table for inputs in [−4, +4] gives well under 1%
            error. Generate it once in Python and hard-code it.
          </P>
          <CodeBlock
            lang="python"
            caption="scripts/gen_tanh_table.py"
            code={`import numpy as np

N = 257
x = np.linspace(-4, 4, N)
y = np.tanh(x)
y_q15 = np.round(y * 32767).astype(np.int16)

with open("phase2/rc/tanh_q15.h", "w") as f:
    f.write("#pragma once\\n#include <stdint.h>\\n")
    f.write(f"#define TANH_N {N}\\n")
    f.write("static const int16_t TANH_TABLE[TANH_N] = {\\n  ")
    for i, v in enumerate(y_q15):
        f.write(f"{v},")
        if i % 12 == 11: f.write("\\n  ")
    f.write("\\n};\\n")
    # caller does the lerp; expose the input range
    f.write("#define TANH_XMIN_Q15 (-32768 * 4)\\n")
    f.write("#define TANH_XMAX_Q15 ( 32767 * 4)\\n")`}
          />

          <Callout tone="insight" title="The verification protocol">
            Run the same trace through both the NumPy reference and the C version (on host or
            target). Diff the reservoir state at every timestep. Acceptable: within ±2 Q15 LSBs
            (about 0.00006 in float terms). If you diverge by more, the bug is almost always in
            a shift count or an integer-promotion case.
          </Callout>
        </div>
      ),
    },
    {
      id: 'numpy-to-target',
      title: 'NumPy → bare-metal STM32',
      kicker: 'The full Phase 2 sequence',
      minutes: 6,
      body: (
        <div className="lesson">
          <Lead>
            Even with the algorithm quantized, getting it on the F4 is a multi-step process. Don't
            skip the host-C step in the middle — it's the cheapest place to debug.
          </Lead>

          <H2>The 4 stops</H2>
          <UL>
            <LI><strong>NumPy reference</strong> — float64, the source of truth.</LI>
            <LI><strong>NumPy quantized</strong> — simulate Q15 arithmetic in NumPy with explicit shifts. Verify match with reference within tolerance.</LI>
            <LI><strong>Host C (x86 or your laptop's ARM)</strong> — same C code that will run on the F4, compiled for your machine. Loops, no peripherals.</LI>
            <LI><strong>Target C (STM32F4)</strong> — same C plus UART for I/O and DWT for cycle counting.</LI>
          </UL>

          <H2>Why the host-C step matters</H2>
          <P>
            On the host, you have a real debugger, gigabytes of RAM, no flash limits, instant
            rebuild. Catching off-by-one shifts here costs minutes. Catching them after you've
            flashed the F4 costs hours.
          </P>

          <H3>The minimum-viable F4 firmware</H3>
          <CodeBlock
            lang="c"
            caption="phase2/firmware/main.c"
            code={`#include "stm32f4xx_hal.h"
#include "rc/reservoir_q15.h"
#include "trace_data.h"   // a benign and an adversarial trace baked into flash

UART_HandleTypeDef huart2;
static void uart_print(const char *s);

int main(void) {
    HAL_Init();
    SystemClock_Config();
    MX_USART2_UART_Init();
    SCB->DEMCR |= SCB_DEMCR_TRCENA_Msk;
    DWT->CTRL  |= DWT_CTRL_CYCCNTENA_Msk;

    int16_t r[N]      = {0};
    int16_t r_prev[N] = {0};

    DWT->CYCCNT = 0;
    for (int t = 0; t < TRACE_LEN; t++) {
        reservoir_step(&TRACE_BENIGN[t * D], r, r_prev);
        for (int k = 0; k < N; k++) r_prev[k] = r[k];
    }
    uint32_t cycles = DWT->CYCCNT;

    char buf[64];
    snprintf(buf, sizeof buf, "benign  cycles=%lu\\r\\n", cycles);
    uart_print(buf);
    snprintf(buf, sizeof buf, "final r=[%d,%d,%d,%d]\\r\\n", r[0], r[1], r[2], r[3]);
    uart_print(buf);

    while (1) HAL_Delay(1000);
}`}
          />

          <Callout tone="warn" title="Energy measurement is its own project">
            Cycle counting tells you latency. For energy, you'll need either an INA219 on the
            supply line, a low-side shunt + multimeter, or an external power profiler. Decide on a
            method <em>before</em> you start firmware work — it shapes how you structure the
            inference loop (do many inferences in a row, measure average).
          </Callout>
        </div>
      ),
      implementation: {
        intro: <>Phase 2 is much longer than a single weekend. This task list is the spine of multiple weekends — start at the top, work through. Don't move on until each step passes its verification.</>,
        estimatedHours: 'Phase 2 — multiple weekends',
        tasks: [
          {
            title: 'Build a Q15 NumPy reference',
            description: <>Re-implement reservoir.run with explicit int16 storage and shift arithmetic in NumPy. Diff against float64 version on a trace; tolerance ≤ 1e-3.</>,
            files: ['hpc-classifier/rc/reservoir_q15_sim.py'],
            successCheck: 'Maximum absolute deviation from float64 reference < 1e-3 across a 1000-sample trace.',
          },
          {
            title: 'Generate the tanh table',
            description: <>Use the script above. Commit the generated header.</>,
            files: ['hpc-classifier/phase2/rc/tanh_q15.h', 'hpc-classifier/scripts/gen_tanh_table.py'],
            successCheck: 'Header compiles; lerp against scipy.special.tanh shows < 0.5% RMS error.',
          },
          {
            title: 'Write reservoir_q15.c, test on host',
            description: <>Compile with gcc, run on a baked-in test trace, diff against NumPy Q15 simulation.</>,
            files: ['hpc-classifier/phase2/rc/reservoir_q15.c', 'hpc-classifier/phase2/rc/reservoir_q15.h', 'hpc-classifier/phase2/tests/test_host.c'],
            successCheck: 'Host C output matches NumPy Q15 sim bit-exact on the test trace.',
          },
          {
            title: 'CubeMX project for F4',
            description: <>Use STM32CubeMX or CubeIDE to generate a minimum project: SYSCLK, USART2 (115200 8N1), DWT enabled.</>,
            files: ['hpc-classifier/phase2/firmware/'],
            successCheck: 'Empty firmware prints "hello" over UART on reset.',
          },
          {
            title: 'Bake a test trace into flash, run inference, log cycles',
            description: <>Use the main.c sketch above. Verify cycle count is plausible (a 4-neuron RC step should be hundreds of cycles, not millions).</>,
            successCheck: 'Cycle count per step < 1000 at -O2. UART output matches host C output.',
          },
          {
            title: 'Set up energy measurement',
            description: <>Cheapest path: INA219 on a breakout board, sampled over I2C from a host. Calibrate against a known load first.</>,
            successCheck: 'You can report mJ per inference with a number ±20% of the true value.',
          },
        ],
      },
      videos: [
        {
          title: 'Lecture 68: Fixed Point Arithmetic and Q Format',
          url: 'https://www.youtube.com/watch?v=lVa-AwaHbDQ',
          duration: '20 min',
          note: 'thorough Q-format walkthrough',
        },
        {
          title: 'Phil\'s Lab — STM32 videos (channel)',
          url: 'https://www.phils-lab.net/videos',
          note: 'firmware patterns when CubeMX feels overwhelming',
        },
        {
          title: 'Coursera — Intro to Embedded Machine Learning (Shawn Hymel)',
          url: 'https://www.coursera.org/learn/introduction-to-embedded-machine-learning',
          note: 'optional structured course; free to audit',
        },
      ],
    },
  ],
}
