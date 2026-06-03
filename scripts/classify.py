"""
CSV traces -> reservoir state -> feature vectors -> classifier
                            -> 5-fold CV accuracy + confusion matrix
"""

import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import numpy as np

# sklearn — the standard Python machine-learning library.
from sklearn.preprocessing  import StandardScaler        # zero-mean, unit-variance scaling
from sklearn.linear_model   import LogisticRegression    # the actual classifier
from sklearn.pipeline       import Pipeline              # chain preprocessing + classifier
from sklearn.model_selection import cross_val_score      # k-fold cross-validation
from sklearn.metrics        import confusion_matrix, classification_report

# Our own modules under rc/
from rc.data      import load_all_traces   # walks data/raw/, returns (traces, labels, class_names)
from rc.features  import trace_features    # (T, N) reservoir state -> (3N,) feature vector
from rc.reservoir import Reservoir         # implements Eq. 1 from the paper


def main():
    # load dataset
    traces, labels, classes = load_all_traces("data/raw")
    print(f"Loaded {len(traces)} traces across {len(classes)} classes: {classes}")

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
    feature_vectors = []
    for t in traces:
        state = r.run(t)              # (T, N) reservoir state trajectory
        f = trace_features(state)     # (3N,) feature vector: mean + std + last per neuron
        feature_vectors.append(f)
    X = np.stack(feature_vectors)     # (n_traces, 3N)
    y = labels
    print(f"Feature matrix shape: {X.shape}   (n_traces, 3*N)")

    # build the classifier pipeline
    clf = Pipeline([
        ("scaler", StandardScaler()),
        ("lr",     LogisticRegression(max_iter=1000)),
    ])

    # cross-validate 
    scores = cross_val_score(clf, X, y, cv=5)
    print(f"\n5-fold CV accuracy: {scores.mean():.3f}  ±  {scores.std():.3f}")
    print(f"  per-fold scores: {[f'{s:.3f}' for s in scores]}")

    # per-class report (training accuracy)
    clf.fit(X, y)
    y_pred = clf.predict(X)

    print("\nConfusion matrix (rows = true class, cols = predicted):")
    print(confusion_matrix(y, y_pred))
    print()
    print("Per-class precision / recall / F1 (training):")
    print(classification_report(y, y_pred, target_names=classes))


if __name__ == "__main__":
    main()
