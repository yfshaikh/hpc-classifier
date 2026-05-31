#!/usr/bin/env python3
"""plot_trace.py — quick 2x2 plot of a perf -I 1 -x , trace CSV."""

import sys
import pandas as pd
import matplotlib.pyplot as plt


save_path = None

# 1. Parse CLI args: required input path, optional --save <path>.
# sys.argv[0] is always the script name itself
if len(sys.argv) == 1 or len(sys.argv) > 3:
    sys.exit("Usage: python3 plot_trace.py <input_path> [<save_path>]")
elif len(sys.argv) == 2:
    input_path = sys.argv[1]
else:
    input_path = sys.argv[1]
    save_path = sys.argv[2]
    

# 2. Read the CSV with pandas.
#    - No header row in the file
#    - Provide column names explicitly
#    - Tell pandas to treat "<not counted>" as missing data

cols = ["timestamp",  "count", "unit", "event", "run_ns", "enabled%", "_a", "_b"]
df = pd.read_csv(input_path, na_values=['<not counted>'], names=cols)


# 3. Clean up:
#    - Coerce the count column to numeric
#    - Drop rows where count is NaN (the first window)
#    - Optionally strip the ":u" suffix from event names for prettier titles

df['count'] = pd.to_numeric(df['count'], errors='coerce')
df = df.dropna(subset=['count'])


# 4. Pivot long -> wide:
#    - Each row in source = one (timestamp, event, count) triple
#    - Goal: index by timestamp, one column per event

wide = df.pivot(index='timestamp', columns='event', values='count')


# 5. Plot:
#    - 2x2 subplot grid (figure, axes)
#    - For each event column, plot (timestamp, count) into one subplot
#    - Title each subplot with the event name
#    - tight_layout(), then either savefig(path) or show()

# create the figure + 4 axes
fig, axes = plt.subplots(2, 2, figsize=(10, 6))


for ax, col in zip(axes.flat, wide.columns):
    ax.plot(wide.index, wide[col])
    ax.set_title(col)
    ax.set_xlabel('time (s)')
    ax.set_ylabel('count')

plt.tight_layout()


if save_path:               
    plt.savefig(save_path, dpi=120, bbox_inches='tight')
    print(f"loaded {len(df)} rows · {len(wide.columns)} events" + (f" → {save_path}" if save_path else ""))
else:
    plt.show()

# 6. Print a one-line summary: rows loaded, events found, output path.

