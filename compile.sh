#!/bin/bash
#
# Compiles given source, running pdflatex on it couple of times
#
# Usage
#   bash compile.sh [tmpdir] [target]
#
# Output
#   On success returns name of produced PDF, otherwise
#   exits with code 1

#####################
# F U N C T I O N S #
#####################

function compile {
    opts="-interaction nonstopmode -output-directory $tmpdir"
    if [[ "$1" == "draft" ]]; then
        pdflatex $opts -draftmode $target >/dev/null
    else
        pdflatex $opts $target >&2
    fi
}

##############
# START HERE #
##############

if [[ $# != 2 ]]; then
    echo "Not enough arguments!"
    echo "Usage: bash compile.sh [tmpdir] [target]"
    exit 1
fi

tmpdir=${1%/}
target=$2

has_toc=`grep -l '\tableofcontents' $target | wc -l`
if [[ ${has_toc// /} -gt 1 ]]; then
    compile "draft"
    compile
else
    compile
fi

# if no PDF created, then exitcode 1
pdfCreated=$tmpdir/`basename $target`
pdfCreated=${pdfCreated%.*}.pdf
if [[ ! -e $pdfCreated ]]; then
    exit 1
else
    echo $pdfCreated
fi

