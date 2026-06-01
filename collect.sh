#!/bin/bash

# validate args
# $# is the total number of args
if [[ $# -lt 2 ]]; then
	echo "error: invalid number of arguments. usage: collect.sh <program> <out> <args>"
	exit 1
fi

PROGRAM="$1"
OUT="$2"
ARGS=("${@:3}") # all args starting from the third one. these are the arguments passed to the program

# -I 1 means sample every 1ms
# -x "," is csv separator
# -e <4 events> 
# -- $PROGRAM is the program to monitor
# 2> "$OUT" means redirect stderr to the output file

perf stat -I 1 -x "," -e branch-misses,cache-misses,bus-cycles,instructions -- "$PROGRAM" "$ARGS[@]" 2> "$OUT"

echo "ran perf successfully"
