#ifndef WEIGHTS_Q15_H
#define WEIGHTS_Q15_H
#include <stdint.h>
/* seed=0, N=4, d=4, sparsity=0.7 — matches Phase 1 classify */
static const int16_t W[4][4] = {
  { 1, 1, 1, 1 },
  { 0, 0, 1, 0 },
  { 1, 0, 0, 1 },
  { 0, 1, 0, 1 }
};

static const int16_t Wr[4][4] = {
  { 0, 0, 0, 0 },
  { 0, 1, 0, 0 },
  { 0, 0, 0, 0 },
  { 0, 0, 0, 1 }
};

static const int16_t GI_Q15 = 19661;
static const int16_t GF_Q15 = 13107;
#endif
