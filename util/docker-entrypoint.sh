#!/bin/bash
set -e

# Cleanup www folder
rm -rf /var/www
# Copy and install the latest & greatest Latex-Online
git clone https://github.com/aslushnikov/latex-online /var/www
cd /var/www
npm ci .

export NODE_ENV=production
export VERSION=$(git rev-parse HEAD)

# use forever to manage service
npm install -g forever
forever --killTree app.js
