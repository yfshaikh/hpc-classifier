#!/bin/bash

# validate args
# $# is the total number of args
if [[ $# -ne 2 ]]; then
	echo "error: invalid number of arguments"
	exit 1
fi

PROGRAM="$1"
OUT="$2"

# -I 1 means sample every 1ms
# -x "," is csv separator
# -e <4 events> 
# -- $PROGRAM is the program to monitor
# 2> "$OUT" means redirect stderr to the output file

perf stat -I 1 -x "," -e branch-misses,cache-misses,bus-cycles,instructions -- "$PROGRAM" 2> "$OUT"

echo "ran perf successfully"
