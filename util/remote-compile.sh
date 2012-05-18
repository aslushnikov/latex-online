#!/bin/bash
#
# Use the tool to remotely compile .TEX files.
# Example usage:
#   bash remote-compile.sh [-h host] main.tex [file1] [file2]...
#
# This will produce main.pdf in the current folder.
# Files file1, file2 etc are treated as a supporting files
# for the tex file, like images, other tex files etc
#
# NOTE The first file must be .TEX
#
# Options:
#   -h HOST - use HOST instead of latex.aslushnikov.com
#   -g - pass git tracked files instead of file1, file2, etc.
#
# Example
#   1. If you've got a simple tex file FOO.TEX that doesn't rely on any other files.
#   You can compile it via command
#       bash remote-compile.sh FOO.TEX
#
#   2. If you're including image MY_KITTY.JPG in FOO.TEX
#       bash remote-compile.sh FOO.TEX MY_KITTY.JPG
#
#   3. If you've got a big paper that includes plenty of different
#   files like images/tex/other, and main file like DIPLOMA.TEX, then
#       bash remote-compile.sh -g DIPLOMA.TEX
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
GIT_TRACKED=false
while getopts "h:g" flag
do
    if [ $flag == "h" ]; then
        host=$OPTARG
    elif [[ $flag == "g" ]]; then
        GIT_TRACKED=true
    fi
done

shift $((OPTIND-1))
target=$1
shift
base=$(basename $target)
extension=${base##*.}
pdfFileName=${base%.*}.pdf

if [ $extension != "tex" ];
then
    echo "Only files with .tex extensions are allowed"
    exit 1
fi

tarball=`mktemp latexTarball-XXXXXX`
if [[ $GIT_TRACKED == true ]]; then
    supportingFiles=`git ls-files`
else
    supportingFiles=$@
fi
tar -cj $target $supportingFiles > $tarball

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


