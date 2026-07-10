import numpy as np

def trace_features(R):
    """(T, N) reservoir state -> 1-D feature vector of length 3N."""
    # concatenate per-neuron mean, std, and last value
    return np.concatenate([R.mean(axis=0), R.std(axis=0), R[-1]])

def featurize(traces, reservoir):
    """list of (T, n_features) arrays + reservoir -> (n_traces, 3N) matrix"""
    feature_vectors = []
    for t in traces:
        state = reservoir.run(t)              # (T, N) reservoir state trajectory
        f = trace_features(state)     # (3N,) feature vector: mean + std + last per neuron
        feature_vectors.append(f)
    X = np.stack(feature_vectors)     # (n_traces, 3N)
    return X