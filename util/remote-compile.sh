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
# Options:
#   -h HOST - use HOST instead of latex.aslushnikov.com
#
# Tool is written by Andrey Lushnikov
#

function cleanup {
    rm $dumpHeaders
    rm $outputFile
}

trap cleanup EXIT

if [[ $# < 1 ]]; then
    echo Usage: bash remote-compile.sh foo.tex
    exit 1
fi

host="latex.aslushnikov.com"
while getopts "h:" flag
do
    if [ $flag == "h" ]; then
        host=$OPTARG
    fi
done

shift $((OPTIND-1))
filename=$1
echo $filename
base=$(basename $filename)
extension=${base##*.}
pdfFileName=${base%.*}.pdf

if [ $extension != "tex" ];
then
    echo "Only files with .tex extensions are allowed"
    exit 1
fi

# create tmp file for headers
dumpHeaders=`mktemp latexCurlHeaders-XXXXXX`
outputFile=`mktemp latexCurlOutput-XXXXXX`
curl -D $dumpHeaders -F file=@$filename $host/data > $outputFile

httpResponse=`cat $dumpHeaders | grep ^HTTP | tail -1 | cut -f 2 -d ' '`

if [[ $httpResponse != 2* ]];
then
    echo Errors during compiling TeX document
    # if so then output is not pdfFile but plain text one with errors
    cat $outputFile
    # and we should remove it after
else
    cp $outputFile $pdfFileName
    echo Success! $pdfFileName is written
fi


