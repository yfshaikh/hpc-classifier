// Allocate three N×N integer arrays A, B, C (N maybe 256, integers maybe int32_t)
// Fill A and B with pseudo-random data (you have xorshift32 already — reuse it)
// Triple-nested loop: C[i][j] += A[i][k] * B[k][j] for iterations times
// The result goes into a volatile sink to defeat dead-code elim


#include <stddef.h>
#include <stdlib.h>
#include <stdint.h>
#define N 256



static inline uint32_t xorshift32(uint32_t *state) { // state is a pointer to an int
    uint32_t x = *state; // read by value
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    return x;
}


int main(int argc, char* argv[]) {
    size_t iterations;
    if (argc > 1) {
        iterations = strtoul(argv[1], NULL, 10);
    } else {
        iterations = 50;
    }

    int* a = malloc(N*N*sizeof(int));
    int* b = malloc(N*N*sizeof(int));
    int* c = malloc(N*N*sizeof(int));

    // seed the PRNG state
    uint32_t state = 0xABCDEF01;

    for (size_t i = 0; i < N; i++){
        for (size_t j = 0; j < N; j++) {
            a[N*i + j] = xorshift32(&state);
            b[N*i + j] = xorshift32(&state);
        }
    }

    volatile uint64_t sink = 0;

    for (size_t iter = 0; iter < iterations; iter++) {
        for (size_t i = 0; i < N; i++) {
            for (size_t j = 0; j < N; j++) {
                int sum = 0;
                for (size_t k = 0; k < N; k++) {
                    sum += a[N*i + k] * b[N*k + j];
                }
                c[N*i + j] = sum;
                sink += sum;
            }
        }
    }



    free(a);
    free(b);
    free(c);

    return (int)(sink & 0xff);

}
