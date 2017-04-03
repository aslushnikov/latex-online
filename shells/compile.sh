#!/bin/bash
#
# Compiles given source, running pdflatex on it couple of times
#
# Usage
#   bash compile.sh [rootdir] [target]
#
# Note: target is a relative to rootdir path
#
# Output
#   On success returns name of produced PDF, otherwise
#   exits with code 1

#####################
# F U N C T I O N S #
#####################

##############
# START HERE #
##############

if [[ $# != 4 ]]; then
    echo "Not enough arguments!" >&2
    echo "Usage: bash compile.sh [rootdir] [target] [outputFile] [logFile]" >&2
    exit 1
fi

rootdir=${1%/}
target=$2
outputFile=$3
logFile=$4

cd $rootdir
cd $(dirname $target)
basename=`basename $target`

PYTHONUNBUFFERED=true latexrun --verbose-cmd -Wall -o $outputFile $basename &>$logFile

# if no PDF created, then exitcode 1
if [[ ! -e $outputFile ]]; then
    echo "ERROR: failed to locate PDF file."
    exit 1
else
    echo "SUCCESS: created $outputFile"
fi

