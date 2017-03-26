set -e

relativePath=$(dirname $0)
if [[ $relativePath != "." ]]; then
    echo "ERROR: startDevServer.sh should be launched from its directory only!"
    exit 1;
fi
docker pull aslushnikov/latex-online
MY_PATH=$(pwd)
docker run \
    -ti                         `: # attach pseudo-tty and interactive mode. Make Ctrl-C exit container` \
    --rm                        `: # remove container on exit` \
    --name latexdev             `: # name container latex` \
    -v $MY_PATH/:/src           `: # mount current code into /src folder` \
    -w /src                     `: # use /src as a working directory` \
    -p 2701:2701                `: # bind host port 2701 to containers 2701` \
    --env NODE_ENV='development'`: # launch in DEV environment` \
    --env PORT=2701             `: # define service HTTP port` \
    aslushnikov/latex-online    `: # run image latex2` \
    /bin/bash -c "ln -sf /src/latexrun/latexrun /usr/local/bin/latexrun; node node_modules/nodemon/bin/nodemon.js -e js,jade app.js"
