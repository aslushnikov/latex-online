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

if [[ $# != 2 ]]; then
    echo "Not enough arguments!" >&2
    echo "Usage: bash compile.sh [rootdir] [target]" >&2
    exit 1
fi

rootdir=${1%/}
target=$2

cd $rootdir
cd $(dirname $target)
basename=`basename $target`
OUTPUT=$(latexrun -Wall $basename)

# if no PDF created, then exitcode 1
pdfCreated=$(pwd)/${basename%.*}.pdf
if [[ ! -e $pdfCreated ]]; then
    >&2 echo $OUTPUT
    exit 1
else
    echo $pdfCreated
fi

