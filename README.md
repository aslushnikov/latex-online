# Latex-Online

## Try it

[Latex-Online](http://udalov.org:2700)

Thanks to [@udalov](https://github.com/udalov) for deployment server

## About

This is a small service developed to
compile simple latex documents online using only a link to the source TeX
document. You give it a link, it gives you a PDF.

## Dependencies

- `pdflatex` command to compile documents
- `curl` to fetch documents from web
- `node.js` to run server
- `npm` to install node dependencies
- `memcached` for caching compiled documents
- `md5` or `md5sum` utility to hash documents according to their value

## Installation

1. `git clone git@github.com:aslushnikov/latex-online.git` to clone repo
2. `sh util/check.sh` to check if all dependencies are satisfied and create
   `tmp/` dir
3. `npm install` to install node dependencies

Installation of `pdflatex` is beyond the scope of the document.

## Running

1. `node app.js` - runs node server
2. `memcached` - runs local memcached instance

## Using
* A small web interface has a box. Insert a URL there and click "submit" button
  to compile
* Just request `/compile?url=...` to get a response with pdf

