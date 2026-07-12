/* Host bit-exact test: C reservoir vs Python golden (LUT path).
 *
 * Build from repo root:
 *   gcc -O2 -Iphase2/rc -Iphase2/tests -o phase2/tests/test_host \
 *       phase2/tests/test_host.c phase2/rc/reservoir_q15.c
 *   ./phase2/tests/test_host
 */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include "reservoir_q15.h"
#include "trace_q15.h"
#include "golden_R.h"

int main(void) {
    int16_t R[TRACE_LEN * RES_N];
    reservoir_run(TRACE, TRACE_LEN, R);

    int mismatches = 0;
    for (int i = 0; i < TRACE_LEN * RES_N; i++) {
        if (R[i] != GOLDEN_R[i]) {
            if (mismatches < 8) {
                printf("mismatch[%d]: got %d want %d\n", i, (int)R[i], (int)GOLDEN_R[i]);
            }
            mismatches++;
        }
    }

    if (mismatches == 0) {
        printf("PASS: bit-exact match on %d int16 states\n", TRACE_LEN * RES_N);
        return 0;
    }
    printf("FAIL: %d / %d mismatches\n", mismatches, TRACE_LEN * RES_N);
    return 1;
}
