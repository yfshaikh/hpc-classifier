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
# -x is csv separator
# -e <4 events> 
# -- $PROGRAM is the program to monitor

perf -I 1 -x -e 4 -- $PROGRAM | $OUT

echo "ran perf successfully"
