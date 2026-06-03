import pandas as pd
import numpy as np
import os
import glob

def load_trace(csv_path):
    # 1. read CSV with the same names + na_values you used in plot_trace.py
    cols = ["timestamp",  "count", "unit", "event", "run_ns", "enabled%", "_a", "_b"]
    df = pd.read_csv(csv_path, na_values=['<not counted>'], names=cols)
    # 2. coerce 'count' to numeric, drop NaN rows
    df['count'] = pd.to_numeric(df['count'], errors='coerce')
    df = df.dropna(subset=['count'])
    # 3. pivot to wide (one row per timestamp, one column per event)
    wide = df.pivot(index='timestamp', columns='event', values='count')
    # 4. drop any remaining NaN rows
    wide = wide.dropna()
    # 5. convert to numpy array, drop first N rows (startup transient)
    X = wide.to_numpy()
    X = X[5:]
    # 5b. skip too-short / broken traces (perf-failure leftovers, etc.)
    if len(X) < 20:
        return None
    # 6. z-score normalize per column
    X = (X - X.mean(axis=0)) / X.std(axis=0)
    # 7. return the (T-N, 4) array
    return X

def load_all_traces(root_dir):
    traces = []
    labels = []
    # 1. list subdirectories of root_dir, sorted (these are class names)
    dirs = os.listdir(root_dir)
    classes = sorted(dirs)
    # 2. for each subdir, glob *.csv files
    skipped = 0
    for i, cls in enumerate(classes):
        path_to_csv = os.path.join(root_dir, cls, "*.csv")
        for csv in glob.glob(path_to_csv):
            trace = load_trace(csv)
            if trace is None:
                skipped += 1
                continue
            traces.append(trace)
            labels.append(i)
    print(f"Loaded {len(traces)} traces ({skipped} short/broken CSVs skipped)")
    return traces, np.array(labels), classes
    # 3. for each CSV, call load_trace, append to traces list
    # 4. assign label = subdir index
    # 5. return (list_of_arrays, np.array(labels), list_of_class_names)
