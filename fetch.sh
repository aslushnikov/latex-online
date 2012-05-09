#!/bin/bash
# options:
# -f file - use file as a source
# -u url - use url as a source

#####################
# F U N C T I O N S #
#####################

# Takes filename as argument, outputs its md5
function compute_md5 {
    if command -v md5 >/dev/null; then
        echo `cat $1 | md5`
    elif command -v md5sum > /dev/null; then
        echo `cat $1 | md5sum - | cut -d ' ' -f1`
    fi
}

function fetchFile {
    echo fetching file $1 1>&2
    mv $1 $filename
}

function fetchUrl {
    echo "fetching url $1" >&2
    curl -f $1 > $filename 2> /dev/null
    if [ $? == 22 ]; then
        echo Failed to fetch document >&2
        exit 1
    fi
}

function cleanup {
    if [[ $? != 0 ]]; then
        rm -r $tmpdir
    fi
}

##############
# START HERE #
##############

trap cleanup EXIT

# initializing global variables
tmpdir=`mktemp -d -t latex ./tmp`
basename="source.tex"
filename=$tmpdir/$basename

foundSource=false
while getopts "f:u:" flag
do
    if [ $flag == "f" ]; then
        foundSource=true
        fetchFile $OPTARG
    elif [ $flag == "u" ]; then
        foundSource=true
        fetchUrl $OPTARG
    fi
done

if [[ $foundSource  == false ]]; then
    echo "You must use -f or -t option!" >&2
    exit 1
fi

echo $tmpdir
echo $filename
echo $(compute_md5 $filename)
