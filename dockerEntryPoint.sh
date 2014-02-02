#!/bin/bash
set -e

memcached -u daemon&
git pull origin master
export NODE_ENV=production && node app.js
