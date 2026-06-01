#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>

#define BUF_BYTES (64UL * 1024 * 1024) // 64mb is greater than any L3 cache the Cortex-A78AE has
#define STRIDE 64 // one cache line on Cortex-A78AE is 64 bytes


int main(int argc, char *argv[]) {
    size_t iterations;
    // use user provided iterations if provided. default to 200
    if (argc > 1) {
        // str to UL
        // string to parse, pointer to first un-parsed character, base
        iterations = strtoul(argv[1], NULL, 10);
    } else {
        iterations = 200;
    }

    // like malloc, but the returned address is a multiple of `alignment`
    uint8_t* buffer = aligned_alloc(64, BUF_BYTES);

    if (buffer == NULL) {
        return 1;
    }

    // memset every byte to 0. this forces the kernel to actually back each page with physical memory before the timing loop starts.
    memset(buffer, 0, BUF_BYTES);

    // volatile: don't cache or optimize the code
    volatile uint64_t sink = 0;

    for (size_t k = 0; k < iterations; k++) {
        for (size_t i = 0; i < BUF_BYTES; i += 64) {
            // need to both load and store. one without the other can be optimized away
            sink += buffer[i]; // compiler: must load buffer[i], sink is volatile
            buffer[i] = (uint8_t)sink; // compiler: must store, depends on sink
        }
    }

    free(buffer);

    // the *value* doesn't matter - but the dependency on sink is what stops the compiler 
    // from concluding the whole program is dead and deleting it.
    return (int)(sink & 0xff); // compiler: must compute, sink is in return

}
