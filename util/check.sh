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

if command -v pdflatex >/dev/null; then
    echo pdflatex: YES
else
    echo pdflatex: NO
    echo Install pdflatex to use the application
    exit 1
fi

if [ -d ../tmp ]; then
    echo TMP dir: YES
else
    mkdir ../tmp
    echo TMP dir: NO. Created.
fi

echo \\nChecking recommended utils..
if command -v memcached >/dev/null; then
    echo memcached: YES
else
    echo memcached: NO
    echo You will lack caching ability of the application
    echo Install memcached to get all features
fi

echo \\nSUCCESS!
echo Don\'t forget to run "npm install" to update all node dependencies of the app
