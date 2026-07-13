#include "classify.h"
#include "readout.h"
#include "reservoir_q15.h"
#include <math.h>

/* Match rc/features.py: concat(mean, std, last) over time for each neuron. */
void trace_features(const int16_t *R, int T, float feat[12]) {
    float mean[4], stdv[4], last[4];

    /* Per neuron i: stats over the T timesteps of that neuron's column */
    for (int i = 0; i < 4; i++) {
        /* mean of dequantized Q15 values */
        double sum = 0.0;
        for (int t = 0; t < T; t++) {
            sum += (double)R[t * 4 + i] / (double)SCALE;
        }
        mean[i] = (float)(sum / (double)T);

        /* population std: sqrt(mean((x - mean)^2)) */
        double var = 0.0;
        for (int t = 0; t < T; t++) {
            double v = (double)R[t * 4 + i] / (double)SCALE - (double)mean[i];
            var += v * v;
        }
        stdv[i] = (float)sqrt(var / (double)T);

        /* value at final timestep */
        last[i] = (float)R[(T - 1) * 4 + i] / (float)SCALE;
    }

    /* Pack into feat[12] in sklearn training order */
    for (int i = 0; i < 4; i++) {
        feat[i] = mean[i];       /* indices 0..3 */
        feat[4 + i] = stdv[i];   /* indices 4..7 */
        feat[8 + i] = last[i];   /* indices 8..11 */
    }
}

/* Apply readout.h: scale features, score each class, return argmax. */
int classify(const float feat[12]) {
    /* StandardScaler.transform */
    float z[READOUT_N_FEATURES];
    for (int i = 0; i < READOUT_N_FEATURES; i++) {
        z[i] = (feat[i] - READOUT_MEAN[i]) / READOUT_SCALE[i];
    }

    /* One logit per class; pick largest */
    int best = 0;
    float best_logit = -1e30f;
    for (int c = 0; c < READOUT_N_CLASSES; c++) {
        float logit = READOUT_INTERCEPT[c];
        for (int i = 0; i < READOUT_N_FEATURES; i++) {
            logit += READOUT_COEF[c][i] * z[i];
        }
        if (logit > best_logit) {
            best_logit = logit;
            best = c;
        }
    }
    return best; /* 0=benign, 1=branch_abuse, 2=cache_thrash, 3=row_hammer */
}
