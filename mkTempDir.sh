#!/bin/bash
#
# Creates a directory with unique name in a given path
#
# Usage:
#   bash mkTempDir.sh [path]
#
# Output:
#   outputs name of created directory

if [[ $# != 1 ]]; then
    echo "Not enough arguments!" >&2
    echo "Usage: bash mkTempDir.sh [path]" >&2
    exit 1
fi

mktemp -d ${1%/}/latex-XXXXXXXX

