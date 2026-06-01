#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <stdint.h>
#include <string.h>


#define BUF_BYTES (256UL * 1024 * 1024)  // 256 MB - many rows to walk through
#define ROW_BYTES (8UL * 1024)           // 8 KB - typical LPDDR5 row size


int main(int argc, char *argv[]) {

    size_t iterations;
    if (argc > 1) {
        iterations = strtoul(argv[1], NULL, 10);
    } else {
        iterations = 50;
    }



    // aligned_alloc with ROW_BYTES alignment and BUF_BYTES size.
    // align the buffer to ROW_BYTES (8 KB) not 64 B, so the strides line up with DRAM row boundaries.
    uint8_t* buffer = aligned_alloc(ROW_BYTES, BUF_BYTES);

    if (buffer == NULL) {
        return 1;
    }

    // force kernel to physically back every page.
    memset(buffer, 0, BUF_BYTES);  //  BUF_BYTES is the size of the allocation

    volatile uint64_t sink = 0;

    for (size_t i = 0; i < iterations; i++) {
        for (size_t j = 0; j < BUF_BYTES; j += ROW_BYTES) {
            sink += buffer[j];
            buffer[j] = (uint8_t)sink;
        }
    }
    free(buffer);
    return (int)(sink & 0xff);
}
