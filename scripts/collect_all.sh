#!/bin/bash
# Bulk-collect HPC traces for every workload class.
# Usage: ./scripts/collect_all.sh [N_PER_CLASS]
#
# Run from the project root. Assumes:
#   - workloads/bin/{cache_thrash,branch_abuse,row_hammer,matmul,memstream}
#     are compiled (run `make -C workloads` first).
#   - data/raw/<class>/ directories will be created if missing.

set -e

N_PER_CLASS=${1:-30}
OUT=data/raw
BIN=workloads/bin

# pick a random integer in [lo, hi] (inclusive)
rand_in() {
    local lo=$1 hi=$2
    echo $((lo + RANDOM % (hi - lo + 1)))
}

# run N collections of one binary into one class directory
collect_class() {
    local cls=$1
    local prog=$2
    local lo=$3
    local hi=$4
    local name=${5:-$cls}   # filename prefix; defaults to class name
    mkdir -p "$OUT/$cls"
    for i in $(seq 1 $N_PER_CLASS); do
        local iters=$(rand_in $lo $hi)
        local out_csv="$OUT/$cls/${name}_${i}.csv"
        printf "[%s] run %2d/%d  (iter=%-12d) -> %s\n" \
               "$cls" "$i" "$N_PER_CLASS" "$iters" "$out_csv"
        ./scripts/collect.sh "$prog" "$out_csv" "$iters"
    done
}

# adversarial workloads
collect_class cache_thrash  $BIN/cache_thrash    40         60
collect_class branch_abuse  $BIN/branch_abuse    100000000  300000000
collect_class row_hammer    $BIN/row_hammer      200        800

# benign workloads — both share the "benign" class directory
collect_class benign        $BIN/matmul          3000       10000  matmul
collect_class benign        $BIN/memstream       50         150    memstream

echo
echo "Done. Class counts:"
for d in "$OUT"/*/; do
    echo "  $(basename "$d"): $(ls "$d" | wc -l)"
done
