#!/bin/bash
#
# Use the tool to remotely compile .TEX files.
# Example usage:
#   bash remote-compile.sh [-h host] foo.tex
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
    rm $dumpHeaders 2>/dev/null
    rm $outputFile 2>/dev/null
    rm $tarball 2>/dev/null
}

trap cleanup EXIT

if [[ $# < 1 ]]; then
    echo "Usage: bash remote-compile.sh [-h host] foo.tex"
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
target=$1
base=$(basename $target)
extension=${base##*.}
pdfFileName=${base%.*}.pdf

if [ $extension != "tex" ];
then
    echo "Only files with .tex extensions are allowed"
    exit 1
fi
tarball=`mktemp latexTarball-XXXXXX`
tar -cz $@ > $tarball

# create tmp file for headers
dumpHeaders=`mktemp latexCurlHeaders-XXXXXX`
outputFile=`mktemp latexCurlOutput-XXXXXX`
curl -D $dumpHeaders -F file=@$tarball $host/data?target=$target > $outputFile

httpResponse=`cat $dumpHeaders | grep ^HTTP | tail -1 | cut -f 2 -d ' '`

if [[ $httpResponse != 2* ]];
then
    echo Errors during compiling TeX document
    # if so then output is not pdfFile but plain text one with errors
    cat $outputFile >&2
    exit 1
    # and we should remove it after
else
    cp $outputFile $pdfFileName
    echo Success! $pdfFileName is written
fi


