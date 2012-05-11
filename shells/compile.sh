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

function compile {
    opts="-interaction nonstopmode"
    if [[ "$1" == "draft" ]]; then
        pdflatex $opts -draftmode $target >/dev/null
    else
        pdflatex $opts ${target##*/} >&2
        #pdflatex $opts $target > /dev/null
    fi
}

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
has_toc=`grep -l '\tableofcontents' $target | wc -l`
if [[ ${has_toc// /} -gt 0 ]]; then
    compile "draft"
    compile
else
    compile
fi
cd - > /dev/null

# if no PDF created, then exitcode 1
pdfCreated=$rootdir/${target%.*}.pdf
if [[ ! -e $pdfCreated ]]; then
    exit 1
else
    echo $pdfCreated
fi

