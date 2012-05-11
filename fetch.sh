#!/bin/bash
# options:
# -f file - use file as a source
# -u url - use url as a source
# -g git - shellow cloning of git repo

#####################
# F U N C T I O N S #
#####################

function fetchFile {
    echo fetching file $1 1>&2
    mv $1 $2
    echo $2
}

function fetchUrl {
    echo "fetching url $1" >&2
    curl -f $1 > $2 2> /dev/null
    if [ $? == 22 ]; then
        echo Failed to fetch document >&2
        exit 1
    fi
    echo $2
}

function fetchGit {
    echo "fetching git $1" >&2
    git clone --depth 1 $1 $2 > /dev/null 2> /dev/null
    if [[ $? != 0 ]]; then
        echo Failed to clone repository >&2
        exit 1
    fi
    echo $2
}

##############
# START HERE #
##############

# initializing global variables

if [[ $# != 3 ]]; then
    echo "Usage: bash fetch.sh [tmpdir] [-fug] [file]"
    exit 1
fi

tmpdir=${1%/}
shift

getopts "f:u:g:" flag
if [[ $flag == "f" ]]; then
    fetchFile $OPTARG $tmpdir/source.tex
elif [[ $flag == "u" ]]; then
    fetchUrl $OPTARG $tmpdir/source.tex
elif [[ $flag == "g" ]]; then
    fetchGit $OPTARG $tmpdir/git
else
    echo "Only [-fug] option allowed! Your option $flag didn't match"
    exit 1
fi

