import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


import numpy as np
from rc.features  import featurize
from sklearn.model_selection import cross_val_score
from sklearn.preprocessing  import StandardScaler        # zero-mean, unit-variance scaling
from sklearn.linear_model   import LogisticRegression    # the actual classifier
from sklearn.pipeline       import Pipeline              # chain preprocessing + classifier
from rc.data      import load_all_traces 
from rc.reservoir import Reservoir

traces, labels, classes = load_all_traces("data/raw")

# standard deviation of Gaussian distributions we will use for noise
sigmas = [0.0, 0.05, 0.1, 0.2, 0.5, 1.0]

# number of tests with each sigma
n_repeats = 5
rng = np.random.default_rng(42)

# build the reservoir using paper's hyperparameters
r = Reservoir(
    n_neurons=4,
    n_features=4,
    gi=0.6,
    gf=0.4,
    sparsity=0.7,
    seed=0,
)

# project each trace through the reservoir, then collapse to a feature vector
y = labels

# Build the classifier pipeline.
#
# A Pipeline chains preprocessing and a model into ONE object. When fit,
# each step runs left to right; when predicting, the same chain is replayed.
#
#   step 1: StandardScaler. For each of the 12 feature columns, subtract
#           the column mean and divide by the column std (both computed at
#           fit time). Result: every feature has mean 0, std 1.
#
#   step 2: LogisticRegression. Linear classifier. Learns one weight
#           vector per class plus a bias; predicts argmax(softmax(W·x + b)).
#           max_iter=1000 stops convergence warnings on cleanly separable
#           data (default 100 sometimes fails to converge).
#
# Why use a Pipeline instead of scaling X up-front?
# Because cross_val_score below splits X into 5 folds. With a Pipeline, the
# scaler is fit ONLY on the 4 training folds of each split, then applied to
# the held-out fold. If you scaled X before CV, the scaler would see test
# data during fit. That's data leakage, and it makes accuracy look better
# than it really is. Pipeline prevents that.
clf = Pipeline([
    ("scaler", StandardScaler()),
    ("lr",     LogisticRegression(max_iter=1000)),
])


results = {}  # { sigma : (mean_acc, std_acc) }
for sigma in sigmas:
    accs = []
    for rep in range(n_repeats):
        # add Gaussian noise of std=sigma to each trace (in z-scored space)
        noisy = [t + rng.normal(0, sigma, t.shape) for t in traces]
        X = featurize(noisy, r)
        acc = cross_val_score(clf, X, y, cv=5).mean()
        accs.append(acc)
    results[sigma] = (np.mean(accs), np.std(accs))

print(f"{'sigma':>6} {'mean acc':>10} {'± std':>8}")
for sigma, (mean, std) in results.items():
    print(f"{sigma:>6.2f} {mean:>10.4f} {std:>8.4f}")

import matplotlib.pyplot as plt
sigmas_out, means, stds = zip(*[(s, m, sd) for s, (m, sd) in results.items()])
plt.errorbar(sigmas_out, means, yerr=stds, marker="o", capsize=4)
plt.xlabel("input noise σ (z-scored units)")
plt.ylabel("5-fold CV accuracy")
plt.title("Noise sweep - accuracy vs Gaussian input noise")
plt.grid(alpha=0.3)
plt.savefig("results/noise.png", dpi=150, bbox_inches="tight")
plt.show()