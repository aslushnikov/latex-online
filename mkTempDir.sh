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
    echo "Usage: bash mkTempDir.sh [path]"
    exit 1
fi

mktemp -d ${1%/}/latex-XXXXXXXX

