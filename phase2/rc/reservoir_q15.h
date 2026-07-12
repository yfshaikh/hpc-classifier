#ifndef RESERVOIR_Q15_H
#define RESERVOIR_Q15_H
#include <stdint.h>
#include "weights_q15.h"

#define RES_N 4
#define RES_D 4
#define SCALE 32768

void reservoir_run(const int16_t *X /* T*4 */, int T, int16_t *R /* T*4 */);
void reservoir_step(const int16_t x[4], int16_t r[4]);

int16_t to_q15(float x);
int16_t tanh_q15(float x);

#endif
