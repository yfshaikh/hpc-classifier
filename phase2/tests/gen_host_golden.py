"""Generate baked Q15 trace + golden int16 states for host C bit-exact test.

Mirrors phase2/rc/reservoir_q15.c (float32 LUT path).
Run from repo root:
  /opt/anaconda3/bin/python phase2/tests/gen_host_golden.py
"""
import os
import sys
import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../.."))
sys.path.insert(0, ROOT)

from rc.reservoir import Reservoir

SCALE = 32768
N_TAB, LO, HI = 256, -3.0, 3.0
RES_N, RES_D = 4, 4
TRACE_LEN = 32


def to_q15(x):
    return np.clip(np.round(np.asarray(x, dtype=np.float64) * SCALE), -32768, 32767).astype(np.int16)


def build_tanh_table():
    xs = np.linspace(LO, HI, N_TAB)
    return to_q15(np.tanh(xs))


def tanh_q15(x, table):
    """Match C: float32 clip/lerp, then to_q15."""
    x = np.float32(x)
    x = np.clip(x, np.float32(LO), np.float32(HI))
    pos = (x - np.float32(LO)) / np.float32(HI - LO) * np.float32(N_TAB - 1)
    i = np.floor(pos).astype(np.int32)
    i = np.minimum(i, N_TAB - 2)
    frac = pos - np.float32(i)
    a = table[i].astype(np.float32) / np.float32(SCALE)
    b = table[i + 1].astype(np.float32) / np.float32(SCALE)
    y = (np.float32(1) - frac) * a + frac * b
    return to_q15(np.float64(y))


def step(x_q15, r, W, Wr, GI, GF, table):
    r_out = np.zeros(RES_N, dtype=np.int16)
    for i in range(RES_N):
        s = np.int64(0)
        for j in range(RES_D):
            s += np.int64(W[i, j]) * np.int64(x_q15[j])
        new_c = (s * np.int64(GI)) >> 15
        old_c = ((np.int64(Wr[i, i]) * np.int64(r[i])) * np.int64(GF)) >> 15
        pre = new_c + old_c
        r_out[i] = tanh_q15(np.float32(pre) / np.float32(SCALE), table)
    return r_out


def run(X_q15, W, Wr, GI, GF, table):
    T = X_q15.shape[0]
    R = np.zeros((T, RES_N), dtype=np.int16)
    r = np.zeros(RES_N, dtype=np.int16)
    for t in range(T):
        r = step(X_q15[t], r, W, Wr, GI, GF, table)
        R[t] = r
    return R


def emit_trace_h(X_q15, path):
    flat = ", ".join(str(int(v)) for v in X_q15.reshape(-1))
    text = f"""#ifndef TRACE_Q15_H
#define TRACE_Q15_H
#include <stdint.h>
#define TRACE_LEN {X_q15.shape[0]}
#define TRACE_D {RES_D}
static const int16_t TRACE[TRACE_LEN * TRACE_D] = {{
  {flat}
}};
#endif
"""
    open(path, "w").write(text)


def emit_golden_h(R, path):
    flat = ", ".join(str(int(v)) for v in R.reshape(-1))
    text = f"""#ifndef GOLDEN_R_H
#define GOLDEN_R_H
#include <stdint.h>
#define GOLDEN_LEN {R.shape[0]}
#define GOLDEN_N {RES_N}
static const int16_t GOLDEN_R[GOLDEN_LEN * GOLDEN_N] = {{
  {flat}
}};
#endif
"""
    open(path, "w").write(text)


def main():
    res = Reservoir(4, 4, 0.6, 0.4, 0.7, seed=0)
    W = res.W.astype(np.int16)
    Wr = res.Wr.astype(np.int16)
    GI, GF = int(to_q15(0.6)), int(to_q15(0.4))
    table = build_tanh_table()

    rng = np.random.default_rng(0)
    X = np.clip(rng.normal(0, 0.5, (TRACE_LEN, 4)), -1.0, 1.0)
    X_q15 = to_q15(X)
    R = run(X_q15, W, Wr, GI, GF, table)

    out_dir = os.path.join(ROOT, "phase2", "tests")
    os.makedirs(out_dir, exist_ok=True)
    emit_trace_h(X_q15, os.path.join(out_dir, "trace_q15.h"))
    emit_golden_h(R, os.path.join(out_dir, "golden_R.h"))
    print(f"wrote trace_q15.h + golden_R.h  shape R={R.shape}")
    print("first row R:", R[0])


if __name__ == "__main__":
    main()
