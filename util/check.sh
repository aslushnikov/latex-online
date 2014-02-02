#!/bin/sh
echo Read README.md to figure out dependencies\\n

echo Checking essential utils..

if command -v node >/dev/null; then
    echo Node.js: YES
else
    echo Node.js: NO
    echo Install Node.js to run the app
fi

md5_osx=`command -v md5`
md5sum=`command -v md5sum`
if [ "$md5_osx" -o "$md5sum" ];  then
    echo md5: YES
else
    echo md5: NO
    echo Install md5sum of md5 to use the application
    exit 1
fi

if command -v curl >/dev/null; then
    echo curl: YES
else
    echo curl: NO
    echo Install CURL to use the application
    exit 1
fi

if command -v bc >/dev/null; then
    echo bc: YES
else
    echo bc: NO
    echo Install BC to use the application
    exit 1
fi

if command -v git >/dev/null; then
    echo git: YES
else
    echo git: NO
    echo Install GIT to use the application
    exit 1
fi

if command -v pdflatex >/dev/null; then
    echo pdflatex: YES
else
    echo pdflatex: NO
    echo Install pdflatex to use the application
    exit 1
fi

if command -v rubber >/dev/null; then
    echo rubber: YES
else
    echo rubber: NO
    echo Install rubber to use the application
    exit 1
fi

BASEDIR=`dirname $0`
if [ -d $BASEDIR/../tmp ]; then
    echo "TMP dir($BASEDIR/../tmp): YES"
else
    mkdir $BASEDIR/../tmp
    echo "TMP dir($BASEDIR/../tmp): NO. Created."
fi

echo Checking recommended utils..
if command -v memcached >/dev/null; then
    echo memcached: YES
else
    echo memcached: NO
    echo You will lack caching ability of the application
    echo Install memcached to get all features
fi

echo SUCCESS!
echo Don\'t forget to run "npm install" to update all node dependencies of the app
