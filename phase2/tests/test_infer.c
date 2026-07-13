/* Host-side end-to-end inference check (not firmware).
 *
 * Proves: baked TRACE → reservoir_run → trace_features → classify
 * matches GOLDEN_CLASS_* from readout.h, before we flash the MCU.
 *
 * Build / run from repo root:
 *   gcc -O2 -Iphase2/rc -o phase2/tests/test_infer \
 *     phase2/tests/test_infer.c \
 *     phase2/rc/reservoir_q15.c \
 *     phase2/rc/classify.c -lm
 *   ./phase2/tests/test_infer
 */
#include <stdio.h>
#include <stdint.h>
#include "reservoir_q15.h"
#include "classify.h"
#include "readout.h"
#include "trace_benign.h"
#include "trace_attack.h"

/* Run one baked trace through the full pipeline; return 0 if class matches expect. */
static int run_one(const char *tag, const int16_t *X, int T, int expect) {
    int16_t R[100 * 4]; /* buffer for state movie; TRACE_LEN is 100 */
    if (T > 100) {
        printf("T too large\n");
        return 1;
    }

    /* In:  X = Q15 input trace (T×4). Out: R = Q15 reservoir states (T×4). */
    reservoir_run(X, T, R);

    /* In: R. Out: feat[12] = mean/std/last per neuron. */
    float feat[12];
    trace_features(R, T, feat);

    /* In: feat. Out: class index. */
    int cls = classify(feat);

    printf("%s: pred=%d (%s)  expect=%d  %s\n",
           tag, cls, READOUT_CLASS_NAMES[cls], expect,
           cls == expect ? "OK" : "FAIL");
    return cls != expect; /* 0 = success for this trace */
}

int main(void) {
    int bad = 0;
    /* Stage-1 headers + Stage-2 golden labels */
    bad += run_one("TRACE_BENIGN", TRACE_BENIGN, TRACE_BENIGN_LEN, GOLDEN_CLASS_BENIGN);
    bad += run_one("TRACE_ATTACK", TRACE_ATTACK, TRACE_ATTACK_LEN, GOLDEN_CLASS_ATTACK);

    if (bad == 0) {
        printf("PASS: host inference matches golden classes\n");
        return 0;
    }
    printf("FAIL: %d mismatch(es)\n", bad);
    return 1;
}
