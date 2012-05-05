#!/bin/bash

base=$(basename $1 .tex)

curl -F file=@$1 localhost:2700/data > $base.pdf
echo $base.pdf is written
