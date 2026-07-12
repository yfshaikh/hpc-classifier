import numpy as np
import os

N, LO, HI = 256, -3.0, 3.0
SCALE = 32768

def to_q15(x):
    """float (or array) in ~[-1,1] -> int16 Q15."""
    i = np.round(x * SCALE)
    i = np.clip(i, -32768, 32767).astype(np.int16)
    return i

def from_q15(i):
    """int16 Q15 -> float."""
    return i / SCALE

def build_table():
    xs = np.linspace(LO, HI, N) # [LO, HI] is the interval, N is the number of steps
    return to_q15(np.tanh(xs))


# for a given x, find nearby table entries, linearly interpolate between them, return the estimate
def tanh_lut(x, table):
    x = np.clip(x, LO, HI)
    pos  = (x - LO) / (HI - LO) * (N - 1)   # map x from [-3, 3] onto a continuous index in [0, 255]
    i    = np.floor(pos).astype(np.int16)   # left neighbor index
    i    = np.minimum(i, N - 2)                    # room for i+1
    frac = pos - i                          # how far you are toward the right neighbor

    a = from_q15(table[i])                  # dequantize the two Q15 table entries to float
    b = from_q15(table[i + 1])
    y = ((1 - frac) * a) + (frac * b)              # float approx of tanh(x)
    return y

def rms_vs_numpy(table):
    xs = np.linspace(LO, HI, 10001)
    err = tanh_lut(xs, table) - np.tanh(xs)
    return float(np.sqrt(np.mean(err ** 2)))

def emit_header(table, path):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    body = ", ".join(str(int(v)) for v in table)
    text = f"""/* auto-generated — do not edit */
                #ifndef TANH_Q15_H
                #define TANH_Q15_H
                #include <stdint.h>
                #define TANH_Q15_N {N}
                #define TANH_Q15_XMIN ({LO}f)
                #define TANH_Q15_XMAX ({HI}f)
                static const int16_t TANH_Q15[TANH_Q15_N] = {{
                {body}
                }};
                #endif
            """
    with open(path, "w") as f:
        f.write(text)

if __name__ == "__main__":
    table = build_table()
    rms = rms_vs_numpy(table)
    print(f"RMS = {rms:.6f}  pass={rms < 0.005}")
    emit_header(table, "phase2/rc/tanh_q15.h")