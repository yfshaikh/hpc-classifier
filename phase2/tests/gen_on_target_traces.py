"""bake ~100-sample Q15 traces for on-target inference.

Run from repo root:
  /opt/anaconda3/bin/python phase2/tests/gen_on_target_traces.py
"""
import os
import sys
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, ROOT)

from rc.data import load_trace

SCALE = 32768
TRACE_LEN = 100
# Fixed files so host and MCU always agree
BENIGN_CSV = os.path.join(ROOT, "data/raw/benign/matmul_1.csv")
ATTACK_CSV = os.path.join(ROOT, "data/raw/branch_abuse/branch_abuse_1.csv")
OUT_DIR = os.path.join(ROOT, "phase2/rc")


def to_q15(x):
    return np.clip(np.round(np.asarray(x) * SCALE), -32768, 32767).astype(np.int16)


def bake(csv_path, n=TRACE_LEN):
    X = load_trace(csv_path)
    if X is None:
        raise SystemExit(f"failed to load {csv_path}")
    X = X[:n]
    if len(X) < n:
        raise SystemExit(f"{csv_path}: only {len(X)} rows after load, need {n}")
    # Same clip as ReservoirQ15.run — Q15 cannot hold |z| > 1
    X = np.clip(X, -1.0, 1.0)
    return to_q15(X)


def emit_header(name, X_q15, path):
    flat = ", ".join(str(int(v)) for v in X_q15.reshape(-1))
    guard = name.upper() + "_H"
    text = f"""#ifndef {guard}
#define {guard}
#include <stdint.h>
/* auto-generated from {os.path.relpath(path, ROOT) if False else "CSV"} — do not edit */
#define {name.upper()}_LEN {X_q15.shape[0]}
#define {name.upper()}_D {X_q15.shape[1]}
static const int16_t {name.upper()}[{name.upper()}_LEN * {name.upper()}_D] = {{
  {flat}
}};
#endif
"""
    # fix: name for array - use cleaner names
    open(path, "w").write(text)


def emit_trace(symbol, csv_path, out_name):
    Xq = bake(csv_path)
    path = os.path.join(OUT_DIR, out_name)
    flat = ", ".join(str(int(v)) for v in Xq.reshape(-1))
    guard = out_name.replace(".", "_").upper()
    text = f"""#ifndef {guard}
#define {guard}
#include <stdint.h>
/* Source: {os.path.relpath(csv_path, ROOT)}
 * First {TRACE_LEN} z-scored samples, clipped to [-1,1], Q15.
 */
#define {symbol}_LEN {Xq.shape[0]}
#define {symbol}_D 4
static const int16_t {symbol}[{symbol}_LEN * {symbol}_D] = {{
  {flat}
}};
#endif
"""
    open(path, "w").write(text)
    print(f"wrote {path}  shape={Xq.shape}  sample[0]={Xq[0].tolist()}")


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    emit_trace("TRACE_BENIGN", BENIGN_CSV, "trace_benign.h")
    emit_trace("TRACE_ATTACK", ATTACK_CSV, "trace_attack.h")
    print("Stage 1 done.")


if __name__ == "__main__":
    main()
