#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>



// `static inline` tells the compiler: only visible in this file (`static`), and please inline calls at the call site rather than emitting a real function call (`inline`)
// using this an the PRNG instead of rand()
static inline uint32_t xorshift32(uint32_t *state) { // state is a pointer to an int
    uint32_t x = *state; // read by value
    x ^= x << 13;
    x ^= x >> 17;
    x ^= x << 5;
    *state = x;
    return x;
}




int main(int argc, char *argv[]) {

    // default: 200,000,000 (200M). branches are cheap, so we need many to produce a multi-second trace.
    size_t iterations;
    if (argc > 1) {
        iterations = strtoul(argv[1], NULL, 10);
    } else {
        iterations = 200000000;
    }

    // seed the PRNG state
    uint32_t state = 0xABCDEF01;

    volatile uint64_t sink = 0;

    for (size_t i = 0; i < iterations; i++){
        uint32_t val = xorshift32(&state);
        // We need exactly one bit of randomness per branch
        if (val & 1) { // the two arms must do different work or the compiler will merge them and there will be no branch at all
            sink += i;
        } else {
            sink -= 1;
        }
    }

    return (int)(sink & 0xff);
}
