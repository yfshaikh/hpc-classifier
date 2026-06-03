import numpy as np





# N = 4 (reservoir neurons)
# d = 4 (your 4 HPC features)
# G_i = 0.6
# G_f = 0.4
# W: random {0, 1} matrix of shape (N, d), sparsity ~0.7
# Wr: sparse diagonal {0, 1} matrix of shape (N, N)

class Reservoir:
    def __init__(self, n_neurons, n_features, gi, gf, sparsity, seed):
        # build self.W   shape (N, d), {0,1} float
        # build self.Wr  shape (N, N), diagonal {0,1} float
        self.rng = np.random.default_rng(seed)
        self.gi = gi
        self.gf = gf
        self.n_neurons = n_neurons
        # rng.random((N, d)) => array of uniform floats in [0, 1), shape (N, d)
        # < sparsity => boolean array of same shape, True where the uniform draw is below threshold
        # If you set sparsity to 0.7, ~70% of W will be 1s and ~30% will be 0s.
        # .astype(np.float64) → converts True/False to 1.0/0.0 floats
        self.W = (self.rng.random((n_neurons, n_features)) < sparsity).astype(np.float64)

        # Wr is a "sparsely filled identity matrix" - zeros off the diagonal, random {0, 1} on the diagonal
        self.Wr = (self.rng.random((n_neurons, n_neurons)) < sparsity).astype(np.float64) * np.eye(n_neurons)


    def run(self, X):
        # X has shape (T, d)
        T = X.shape[0]
        R = np.zeros((T, self.n_neurons))
        r_prev = np.zeros((self.n_neurons,))
        for n in range(T):
            pre = self.gi * (self.W @ X[n]) + self.gf * (self.Wr @ r_prev)
            r_prev = np.tanh(pre)
            R[n] = r_prev
        return R



if __name__ == "__main__":
    # Test 1: zero input → zero state forever
    r = Reservoir(n_neurons=4, n_features=4, gi=0.6, gf=0.4, sparsity=0.7, seed=0)
    R = r.run(np.zeros((100, 4)))
    print("Test 1 (zero input):", "PASS" if np.allclose(R, 0) else "FAIL")
    print("  R shape:", R.shape, "expected (100, 4)")

    # Test 2: same seed → identical outputs
    r1 = Reservoir(4, 4, 0.6, 0.4, 0.7, seed=42)
    r2 = Reservoir(4, 4, 0.6, 0.4, 0.7, seed=42)
    X = np.random.default_rng(0).normal(0, 1, (50, 4))
    print("Test 2 (same seed):", "PASS" if np.allclose(r1.run(X), r2.run(X)) else "FAIL")

    # Test 3: different seed → different outputs
    r3 = Reservoir(4, 4, 0.6, 0.4, 0.7, seed=99)
    print("Test 3 (different seed):", "PASS" if not np.allclose(r1.run(X), r3.run(X)) else "FAIL")

    # Test 4: state bounded in [-1, +1] even with large inputs
    big_X = np.random.default_rng(0).normal(0, 100, (50, 4))
    print("Test 4 (tanh bounds):", "PASS" if np.all(np.abs(r1.run(big_X)) <= 1.0) else "FAIL")
