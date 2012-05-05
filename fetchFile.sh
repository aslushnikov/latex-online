#!/bin/bash

source ./compute_md5.sh

cd tmp
timestamp=`date +%s`
filename=$timestamp.tex
mv $1 $filename
echo $filename

echo $(compute_md5 $filename)
