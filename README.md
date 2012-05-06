# Latex-Online

## Try it

[Latex-Online](http://latex.aslushnikov.com)

Thanks to [@udalov](https://github.com/udalov) for deployment server

## About

This is a small service developed to
compile simple latex documents online using only a link to the source TeX
document. You give it a link, it gives you a PDF.

Additionally the service could be used for *remote compiling* of latex documents.
See "usage" section for a bit more information.

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
* A tool `utils/remote-compile.sh` to remotely compile a tex document.

### Remote compiling
Suppose you're writing a small paper in tex and wish to compile it, but
you're too lazy to install all this TeX-related stuff. Fine, you can use the
service to compile your document!

Just download `util/remote-compile.sh` and run it like this:
```
bash remote-compile.sh foo.tex
```
After compiling the file a `foo.pdf` will be created in the same dir with
`foo.tex`

*NOTE* Only files with `.tex` extension are allowed

## What's next

* Improve `remote-compile` tool
    - Show compilation errors if any
    - Add support for command line arguments like -o (As I am not proficient in
      `BASH` scripting, I will appreciate any help with the feature.)
* Add some statistics on API usage

