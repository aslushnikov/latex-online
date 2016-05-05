#!/bin/bash
set -e

# Run memcached
memcached -u daemon&
# Cleanup www folder
rm -rf /var/www
# Copy and install the latest & greatest Latex-Online
git clone https://github.com/aslushnikov/latex-online /var/www
cd /var/www
npm install .
export NODE_ENV=development && export VERSION=$(git rev-parse HEAD) && node app.js
