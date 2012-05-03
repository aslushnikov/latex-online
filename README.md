# Latex-Online

## About

This is a small service developed to
compile simple latex documents online using only a link to the source TeX
document. You give it a link, it gives you a PDF.

The service is *not deployed yet* anywhere

## Dependencies

- `pdflatex` command to compile documents
- `curl` to fetch documents from web
- `node.js` to run server
- `express.js` for routing & rendering
- `memcached` for caching compiled documents
- `md5` utility to hash documents according to their value

## Installation

1. `git clone git@github.com:aslushnikov/latex-online.git`
2. `npm install`

Installation of `pdflatex` is beyond the scope of the document.

## Running

1. `node app.js` - runs node server
2. `memcached` - runs local memcached instance

## Using
* A small web interface has a box. Insert a URL there and click "submit" button
  to compile
* Just request `/compile?url=...` to get a response with pdf

