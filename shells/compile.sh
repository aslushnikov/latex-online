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

if [[ $# != 5 ]]; then
    echo "Not enough arguments!" >&2
    echo "Usage: bash compile.sh [rootdir] [target] [command] [outputFile] [logFile]" >&2
    exit 1
fi

rootdir="${1%/}"
target="$2"
command="$3"
outputFile="$4"
logFile="$5"

export LC_ALL=C.UTF-8
cd $rootdir
LATEXRUN="$(dirname $0)"/../latexrun/latexrun
PYTHONUNBUFFERED=true $LATEXRUN --verbose-cmd --latex-cmd="${command}" -Wall -o "${outputFile}" "${target}" &>"${logFile}"

# if no PDF created, then exitcode 1
if [[ ! -e "${outputFile}" ]]; then
    echo "ERROR: failed to locate PDF file."
    exit 1
else
    echo "SUCCESS: created ${outputFile}"
fi

