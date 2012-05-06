#!/bin/bash

function clean {
    if [ -e $timestamp.pdf ];
    then
        mv $timestamp.pdf _$timestamp.pdf
        rm $timestamp.*
        mv _$timestamp.pdf $timestamp.pdf
    else
        rm $timestamp.*
    fi
}

function compile {
    errlog=$1.errlog
    pdflatex -interaction nonstopmode $filename > $errlog
    # if no PDF created, then report error with stdout stream
    if [ ! -e $timestamp.pdf ];
    then
        cat $errlog
        rm $errlog
        clean
        exit 1
    else
        rm $errlog
    fi
}

cd tmp
filename=$1
timestamp=`basename $filename .tex`

compile

has_toc=`grep -l '\tableofcontents' $filename | wc -l`
if [ $has_toc == "1" ]; then
    compile
fi

clean
echo $timestamp.pdf

