import numpy as np

SCALE = 32768  # or 1 << 15


class ReservoirQ15:
    def __init__(self, n_neurons, n_features, gi, gf, sparsity, seed):
        self.rng = np.random.default_rng(seed)
        self.gi = gi
        self.gf = gf
        self.n_neurons = n_neurons
        self.W = (self.rng.random((n_neurons, n_features)) < sparsity).astype(np.float64)
        self.Wr = (self.rng.random((n_neurons, n_neurons)) < sparsity).astype(np.float64) * np.eye(n_neurons)
    def step(self, x_q15, r_prev_q15):
        GI_Q15 = self.to_q15(self.gi)
        GF_Q15 = self.to_q15(self.gf)

        new_contribution = (self.W.astype(np.int32) @ x_q15.astype(np.int32))
        # int64: Wx can be ~4*32768; times GI overflows int32 before >> 15
        new_contribution = (new_contribution.astype(np.int64) * np.int64(GI_Q15)) >> 15

        old_contribution = (self.Wr.astype(np.int32) @ r_prev_q15.astype(np.int32))
        old_contribution = (old_contribution.astype(np.int64) * np.int64(GF_Q15)) >> 15

        pre = new_contribution.astype(np.int64) + old_contribution.astype(np.int64)

        pre = self.from_q15(pre)
        pre = np.tanh(pre)
        pre = self.to_q15(pre)

        return pre
    def run(self, X):
        """
        take a whole trace X with shape (T, 4) and return the state movie R with shape (T, N)

        Loop over time:
            Start r_prev at zeros (as Q15 ints).
            For each timestep n:
                x_q15 = to_q15(X[n])
                r_prev = step(x_q15, r_prev) ← your Q15 step
                store that state in row n of R
            Return R as floats (via from_q15 on each row, or convert the whole array) so featurize / float compare work.
        In short: run = “call step once per row of X.”

        Note: X is clipped to [-1, 1] first. Z-scored HPC values can be larger than 1,
        but Q15 cannot represent that; clipping keeps float-vs-Q15 comparisons fair
        and matches what to_q15 can store.
        """
        # Bound inputs to the Q15 representable range
        X = np.clip(X, -1.0, 1.0)

        # X has shape (T, 4) — convert each row to Q15 inside
        T = X.shape[0]
        R = np.zeros((T, self.n_neurons))
        r_prev = np.zeros(self.n_neurons, dtype=np.int16)
        for n in range(T):
            pre = self.step(self.to_q15(X[n]), r_prev)
            r_prev = pre
            R[n] = self.from_q15(r_prev) # store floats in R
        return R


    def to_q15(self, x):
        """float (or array) in ~[-1,1] -> int16 Q15."""
        i = np.round(x * SCALE)
        i = np.clip(i, -32768, 32767).astype(np.int16)
        return i

    def from_q15(self, i):
        """int16 Q15 -> float."""
        # TODO: divide by SCALE
        return i / SCALE