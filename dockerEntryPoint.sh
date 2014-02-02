#!/bin/bash
set -e

memcached -u daemon&
export NODE_ENV=production && node app.js
