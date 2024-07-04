#!/bin/bash
#
#  _          _                  ___        _ _
# | |    __ _| |_ _____  __     / _ \ _ __ | (_)_ __   ___
# | |   / _` | __/ _ \ \/ /____| | | | '_ \| | | '_ \ / _ \
# | |___ (_| | |_  __/>  <_____| |_| | | | | | | | | |  __/
# |_____\__,_|\__\___/_/\_\     \___/|_| |_|_|_|_| |_|\___|
#
# WEB Site: latex.aslushnikov.com
# Issues/bugs: https://github.com/aslushnikov/latex-online
#
# Command-line interface for latex-online service
#

function cleanup {
    rm $dumpHeaders 2>/dev/null
    rm $outputFile 2>/dev/null
    rm $tarball 2>/dev/null
}

function usage {
   echo "Usage:
  bash $0 [-d host] [-o output] [-g] main.tex [file1] [file2]...

Description:
  This is a command line interface for Latex-Online service.

Options:
  -d HOST - use custom HOST instead of latexonline.cc
  -h, --help - show this help
  -g - pass git tracked files instead of file1, file2, etc.
  -o - output filename or, if a directory name is given, where
      to put the file with a default name
  -f - force compiling. Will recompile file not relying on cache
  -c - select compiler command. Available options are lualatex, xelatex and pdflatex (default)

Examples:
  1. If you've got a simple tex file FOO.TEX that doesn't rely on any other files.
  You can compile it via command
      laton FOO.TEX

  2. If you're including image MY_KITTY.JPG in FOO.TEX
      laton FOO.TEX MY_KITTY.JPG

  3. If you've got a git repo that includes plenty of different
  images/tex/other files, and main file like DIPLOMA.TEX, then
      laton -g DIPLOMA.TEX

Please file all questions, bugs and feature requests to https://github.com/aslushnikov/latex-online
">&2
}

trap cleanup EXIT

if (( $# < 1 )); then
    usage
    exit 1
fi

if  [[ ($1 == '-h') || ($1 == '--help') ]]; then
    usage
    exit 1;
fi

host="https://texlive2020.latexonline.cc"
command="pdflatex"
GIT_TRACKED=false
while getopts "fd:c:go:" flag
do
    if [ $flag == "d" ]; then
        host=$OPTARG
    elif [[ $flag == "c" ]]; then
        if [[ $OPTARG =~ "pdflatex"|"xelatex"|"lualatex" ]]; then
            command=$OPTARG
        else
            echo "Only pdflatex, xelatex and lualatex compilers are supported."
            exit 1
        fi
    elif [[ $flag == "g" ]]; then
        GIT_TRACKED=true
    elif [[ $flag == "o" ]]; then
        OUTPUT=$OPTARG
    elif [[ $flag == "f" ]]; then
        FORCE=true
    fi
done

shift $((OPTIND-1))
target=$1
shift
base=$(basename $target)
extension=${base##*.}
pdfFileName=${base%.*}.pdf

if [[ $OUTPUT ]]; then
    # if it is a directory, then append path
    if [[ -d $OUTPUT ]]; then
        pdfFileName=${OUTPUT%/}/$pdfFileName
    else
        pdfFileName=${OUTPUT%/}
    fi
fi

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
curl -L --post301 --post302 --post303 -D $dumpHeaders -F file=@$tarball "$host/data?target=$target&force=$FORCE&command=$command" > $outputFile

httpResponse=`cat $dumpHeaders | grep ^HTTP | tail -1 | cut -f 2 -d ' '`

if [[ $httpResponse != 2* ]];
then
    echo Errors during compiling TeX document: $httpResponse
    # if so then output is not pdfFile but plain text one with errors
    # trap will clean the file
    cat $outputFile >&2
    exit 1
    # and we should remove it after
else
    cp $outputFile $pdfFileName
    echo Success! $pdfFileName is written
fi


