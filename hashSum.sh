#!/bin/bash

# Takes filename as argument, outputs its md5
function compute_file_md5 {
    if command -v md5 >/dev/null; then
        echo `cat $url | md5`
    elif command -v md5sum > /dev/null; then
        echo `cat $url | md5sum - | cut -d ' ' -f1`
    fi
}

function compute_git_md5 {
    git ls-remote $url | grep master | grep -o '[0-9a-f]*'
}

if [[ $# != 2 ]]; then
    echo "Usage: bash hashSum.sh -[f|g] [filename|path to git]"
    exit 1
fi

for url; do true; done

while getopts "fg" flag
do
    if [[ $flag == 'f' ]]; then
        compute_file_md5
    elif [[ $flag == 'g' ]]; then
        compute_git_md5
    fi
done
