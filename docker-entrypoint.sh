#!/bin/bash
set -e

# Run memcached
memcached -u daemon&
# Cleanup www folder
rm -rf /var/www
# Copy and install the latest & greatest Latex-Online
git clone https://github.com/aslushnikov/latex-online /var/www
# make latexrun available globally
ln -s /var/www/latexrun/latexrun /usr/local/bin/latexrun
cd /var/www
npm install .
export NODE_ENV=production && export VERSION=$(git rev-parse HEAD) && node app.js
