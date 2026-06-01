#include <stddef.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define N_INTS  (1024 * 1024)              // 1M ints
#define N_BYTES (N_INTS * sizeof(int))     // 4 MB


int main(int argc, char* argv[]) {

    size_t iterations;
    if (argc > 1) {
        iterations = strtoul(argv[1], NULL, 10);
    } else {
        iterations = 100;
    }

    int* a = malloc(N_BYTES);
    int* b = malloc(N_BYTES);
    int* c = malloc(N_BYTES);
    if (!a || !b || !c) return 1;

    memset(a, 0, N_BYTES);
    memset(b, 0, N_BYTES);
    memset(c, 0, N_BYTES);

    volatile uint64_t sink = 0;

    for (size_t j = 0; j < iterations; j++) {
        for (size_t i = 0; i < N_INTS; i++) {
            c[i] = a[i] + b[i];
            sink += c[i];
        }
    }

    free(a);
    free(b);
    free(c);

    return (int)(sink & 0xff);
}
