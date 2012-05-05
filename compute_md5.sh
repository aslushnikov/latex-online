#!/bin/bash

function compute_md5 {
    if command -v md5 >/dev/null; then
        echo `cat $1 | md5`
    elif command -v md5sum > /dev/null; then
        echo `cat $1 | md5sum - | cut -d ' ' -f1`
    fi
}

