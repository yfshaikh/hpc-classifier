#ifndef CLASSIFY_H
#define CLASSIFY_H
#include <stdint.h>

/* Featurize + classify on top of a Q15 reservoir state movie.
 * Used by host test (test_infer) and later by MCU firmware.
 */

/* Collapse reservoir trajectory into a 12-D feature vector.
 *
 * In:
 *   R  — row-major int16 Q15 states, length T*4, from reservoir_run()
 *        layout: R[t*4 + neuron], neuron in 0..3
 *   T  — number of timesteps (e.g. 100)
 * Out:
 *   feat[12] — floats, same layout as rc/features.py:
 *              [mean0..mean3, std0..std3, last0..last3]
 *              std uses population form (divide by T), like numpy default ddof=0
 */
void trace_features(const int16_t *R, int T, float feat[12]);

/* Run frozen StandardScaler + LogisticRegression (weights in readout.h).
 *
 * In:  feat[12] from trace_features()
 * Out: class index 0..3  (see READOUT_CLASS_NAMES in readout.h)
 */
int classify(const float feat[12]);

#endif
