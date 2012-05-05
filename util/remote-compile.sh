#!/bin/bash
#
# Use the tool to remotely compile .TEX files.
# Example usage:
#   bash remote-compile.sh foo.tex
#
# This will produce foo.pdf in the current folder.
#
# NOTE Only .TEX files are allowed
#
# Tool is written by Andrey Lushnikov
#

if [ $# -ne 1 ]; then
    echo Usage: bash remote-compile.sh foo.tex
    exit 1
fi

filename=$(basename $1)
extension=${filename##*.}
filename=${filename%.*}

if [ $extension != "tex" ];
then
    echo "Only files with .tex extensions are allowed"
    exit 1
fi

curl -f -F file=@$1 latex.aslushnikov.com/data > $filename.pdf
if [ $? -ne 0 ];
then
    echo Errors during compiling TeX document
else
    echo $filename.pdf is written
fi
