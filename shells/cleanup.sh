#!/bin/bash
#
# Removes given directory, supposed to be used to cleanup temporary
# directory
#
# Usage
#   bash cleanup.sh [tmpdir]
#
# Output
#   Exitcode 0 on success and 1 on error

if [[ $# != 1 ]]; then
    echo "Not enough arguments!"
    echo "Usage: bash cleanup.sh [tmpdir]"
    exit 1
fi

tmpdir=$1
rm -rf $tmpdir

