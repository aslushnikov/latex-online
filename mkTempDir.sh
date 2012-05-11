#!/bin/bash

case $1 in
    */) mktemp -d $1latex-XXXXXXXX;;
    *) mktemp -d $1/latex-XXXXXXXX;;
esac

