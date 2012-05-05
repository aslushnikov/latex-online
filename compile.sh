#!/bin/bash

function compile {
    pdflatex -interaction nonstopmode $filename > /dev/null
}

cd tmp
filename=$1
timestamp=`basename $filename .tex`
compile

has_toc=`grep -l '\tableofcontents' $filename | wc -l`
if [ $has_toc == "1" ]; then
    compile
fi

mv $timestamp.pdf _$timestamp.pdf
rm $timestamp.*
mv _$timestamp.pdf $timestamp.pdf
echo $timestamp.pdf

