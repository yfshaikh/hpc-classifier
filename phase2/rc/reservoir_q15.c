#include "reservoir_q15.h"
#include "tanh_q15.h"
#include <math.h>

#define MIN(a, b) ((a) < (b) ? (a) : (b))

static float float_clip(float x, float lower, float upper) {
    if (x > upper) return upper;
    if (x < lower) return lower;
    return x;
}

int16_t to_q15(float x) {
    int i = (int)roundf(x * (float)SCALE);
    if (i > 32767) i = 32767;
    if (i < -32768) i = -32768;
    return (int16_t)i;
}

/* Float-domain LUT matching scripts/gen_tanh_table.py::tanh_lut */
int16_t tanh_q15(float x) {
    x = float_clip(x, TANH_Q15_XMIN, TANH_Q15_XMAX);
    float pos = (x - TANH_Q15_XMIN) / (TANH_Q15_XMAX - TANH_Q15_XMIN) * (float)(TANH_Q15_N - 1);
    int i = (int)pos;
    i = MIN(i, TANH_Q15_N - 2);
    float frac = pos - (float)i;
    float a = (float)TANH_Q15[i] / (float)SCALE;
    float b = (float)TANH_Q15[i + 1] / (float)SCALE;
    float y = (1.0f - frac) * a + frac * b;
    return to_q15(y);
}

/* One reservoir timestep.
 *   x — this sample's 4 HPC features (Q15)
 *   r — in/out state: previous neuron values in, updated values out (Q15)
 *
 * Per neuron i (same as Python):
 *   pre = gi * (W[i] · x) + gf * (Wr[i][i] * r[i])
 *   r[i] = tanh(pre)
 * Linear part stays integer (wide mul + >> 15); tanh via LUT. */
void reservoir_step(const int16_t x[4], int16_t r[4]) {
    for (int i = 0; i < RES_N; i++) {
        /* W @ x for this neuron: sum_j W[i][j] * x[j]  (W is 0/1) */
        int64_t sum = 0;
        for (int j = 0; j < RES_D; j++) {
            sum += (int32_t)W[i][j] * (int32_t)x[j];
        }
        /* (sum * gi) in Q15; int64 avoids overflow before the shift */
        int64_t new_c = (sum * (int64_t)GI_Q15) >> 15;
        /* Wr is diagonal — only Wr[i][i] feeds back r[i] */
        int64_t old_c = (((int64_t)Wr[i][i] * (int32_t)r[i]) * (int64_t)GF_Q15) >> 15;
        int64_t pre = new_c + old_c;
        /* pre is still Q15-scaled; LUT wants float in ~[-3, 3] */
        r[i] = tanh_q15((float)pre / (float)SCALE);
    }
}

/* Run the reservoir over a full trace.
 *   X — row-major T×4 input (already Q15)
 *   T — number of timesteps
 *   R — row-major T×4 output state movie (Q15), filled here
 *
 * Starts r at zeros, then for each time t: step, then store r into row t of R. */
void reservoir_run(const int16_t *X, int T, int16_t *R) {
    int16_t r[RES_N] = {0}; /* running state across time */
    for (int t = 0; t < T; t++) {
        reservoir_step(&X[t * RES_D], r); /* X row t → update r */
        for (int i = 0; i < RES_N; i++) {
            R[t * RES_N + i] = r[i]; /* snapshot state into output movie */
        }
    }
}
