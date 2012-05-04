#!/bin/sh

function compute_md5 {
    if command -v md5 >/dev/null; then
        echo `cat $1 | md5`
    elif commanv -v md5sum > /dev/null; then
        echo `cat $1 | md5sum - | cut -d ' ' -f1`
    fi
}

cd tmp
timestamp=`date +%s`
filename=$timestamp.tex
curl -f $1 > $filename 2> /dev/null
if [ $? == 22 ]; then
    echo Failed to fetch document >&2
    rm $filename
    exit 1
fi
echo $filename

echo $(compute_md5 $filename)
