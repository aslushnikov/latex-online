#!/bin/bash
#
# Fetches entities and puts them in a tmp directory
# Usage:
#   bash fetch.sh [tmpdir] [-fug] [file|url|git]
#
# Output:
#   returns name of the fetched entity on success relatively
#   to tmpdir, exits with code 1 on failure
#
# Options:
#   -f file - use file as a source
#   -u url - use url as a source
#   -g git - shellow cloning of git repo

#####################
# F U N C T I O N S #
#####################

function fetchFile {
    echo fetching file $1 1>&2
    mv $1 $tmpdir/tarball.tar.gz
    cd $tmpdir
    tar -xf tarball.tar.gz
    cd - > /dev/null
    echo UNPACKED
}

function fetchUrl {
    echo "fetching url $1" >&2
    curl -f $1 > $tmpdir/$2 2> /dev/null
    if [ $? == 22 ]; then
        echo Failed to fetch document >&2
        exit 1
    fi
    echo $2
}

function fetchGit {
    echo "fetching git $1" >&2
    git clone --depth 1 $1 $tmpdir/$2 > /dev/null 2> /dev/null
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
    echo "Not enough arguments!" >&2
    echo "Usage: bash fetch.sh [tmpdir] [-fug] [file]" >&2
    exit 1
fi

tmpdir=${1%/}
shift

getopts "f:u:g:" flag
if [[ $flag == "f" ]]; then
    fetchFile $OPTARG source.tex
elif [[ $flag == "u" ]]; then
    fetchUrl $OPTARG source.tex
elif [[ $flag == "g" ]]; then
    fetchGit $OPTARG git
else
    echo "Only [-fug] option allowed! Your option $flag didn't match" >&2
    exit 1
fi

