import numpy as np

def trace_features(R):
    """(T, N) reservoir state -> 1-D feature vector of length 3N."""
    # concatenate per-neuron mean, std, and last value
    return np.concatenate([R.mean(axis=0), R.std(axis=0), R[-1]])