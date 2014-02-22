#!/bin/bash
set -e

memcached -u daemon&
git pull origin master
npm install .
export NODE_ENV=production && export VERSION=$(git rev-parse HEAD) && node app.js
