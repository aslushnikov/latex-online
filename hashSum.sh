#!/bin/bash
#
# The script to return hashsum of the resource
#
# Usage
#   bash hashSum.sh [-fg] [file|gitrepo]
#
# Options
#   -f Count hash sum for a file. md5 or md5sum will be used
#   -g Get SHA1 of the repo without downloading the files
#
# Output
#   Returns hashsum on success, exitcode != 0 on error
#
# Exitcodes
#   1 Given file doesn't exist. Could be returned only with -f option
#   2 No md5 or md5sum tools found
#   3 Repository is not accessible
#   255 not enough arguments

# Takes filename as argument, outputs its md5

#####################
# F U N C T I O N S #
#####################

function compute_file_md5 {
    if [[ -e $1 ]]; then
        if command -v md5 >/dev/null; then
            echo `cat $1 | md5`
        elif command -v md5sum > /dev/null; then
            echo `cat $1 | md5sum - | cut -d ' ' -f1`
        else
            echo "No md5 or md5sum tools found" >&2
            exit 2
        fi
    else
        echo "File doesn't exist" >&2
        exit 1
    fi
}

function compute_git_md5 {
    git ls-remote $1 2> /dev/null | grep master | grep -o '[0-9a-f]*'
    if [[ $? != 0 ]]; then
        echo "remote repo is not accessible" >&2
        exit 3
    fi
}

##############
# START HERE #
##############

if [[ $# != 2 ]]; then
    echo "Not enough arguments!"
    echo "Usage: bash hashSum.sh [-fg] [filename|path to git]"
    exit -1
fi

while getopts "f:g:" flag
do
    if [[ $flag == 'f' ]]; then
        compute_file_md5 $OPTARG
    elif [[ $flag == 'g' ]]; then
        compute_git_md5 $OPTARG
    fi
done
