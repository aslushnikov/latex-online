#!/bin/bash

# Usage
#   bash compile.sh ./tmp/lusha.RNDSuffix/file.tex [./tmp/lusha.RNDSuffix]
# if the second argument (output directory) is not specified,
# then the result will be stored in the same dir as .tex file is

#####################
# F U N C T I O N S #
#####################

function compile {
    outputStream="/dev/null"
    opts="-interaction nonstopmode -output-directory $tmpdir"
    if [[ "$1" == "draft" ]]; then
        pdflatex $opts -draftmode $filename >/dev/null
    else
        pdflatex $opts $filename >&2
    fi

}

##############
# START HERE #
##############

filename=$1
tmpdir=$2
if $tmpdir; then
    tmpdir=${1%/*.*}
    #echo "Getting tmp dir from file name. tmpdir=$tmpdir"
fi
noExtension=${filename%.*}

has_toc=`grep -l '\tableofcontents' $filename | wc -l`
if [ $has_toc == "1" ]; then
    compile "draft"
    compile
else
    compile
fi
# if no PDF created, then report error with stdout stream
if [[ ! -e $noExtension.pdf ]]; then
    echo "No pdf created"
    exit 1
fi

echo $noExtension.pdf

