# Latex-Online

## Try it

[Latex-Online](http://latex.aslushnikov.com)

Thanks to [@udalov](https://github.com/udalov) for deployment server

## About

This is a small service developed to
compile latex documents online. You give it a link, it gives you a PDF.

Additionally the service could be used for *remote compiling* of latex documents.
See "usage" section for a bit more information.

## Capabilities

- Compile `.TEX` file via link. (Limitation: includes will be ignored)
- Compile GIT repo via link.
- Compile local files or git repo with the help of `remote-compile.sh` tool.
- REST API for compiling

## API

### HTTP Response Code

The service will return HTTP.2xx on success and compiled PDF file. Otherwise
a HTTP.4xx code will be returned with a compilation error log in response body.

### Compile single file

```/compile?url=<url to tex file>```

*Example:*
```
latex.aslushnikov.com/compile?url=https://raw.github.com/aslushnikov/latex-online/master/sample/sample.tex
```

*Limitation:* this command will ignore all includes during compiling

### Compile git repo

```/compile?git=<repo>&target=<target file>```
This will fetch git `repo` and compile the `target`.

`target` should be a relative path to the target file in your git repo.

*Example:*
```
latex.aslushnikov.com/compile?git=https://github.com/aslushnikov/diplom-latex&target=diplom.tex
```

## Remote compiling

Suppose you're writing a paper in tex and wish to compile it, but
you're too lazy to install all this TeX-related stuff. Fine, you can use the
service to compile your document!

To do so, you will need a tool called `remote-compile.sh`. You can obtain it
[here](https://raw.github.com/aslushnikov/latex-online/master/util/remote-compile.sh)

For convenience, you can make the script executeable with the command
```
chmod 755 remote-compile.sh
```

### 1. Compile single file

If you've got a single file (say `main.tex`) that doesn't have any includes,
then you can compile it like this:
```
bash remote-compile.sh main.tex
```
After compiling file `main.pdf` will be created in the current dir

### 2. Compile files with dependencies

If your paper includes some files, you have to declare them to the
`remote-tool.sh`.

```
bash remote-compile.sh main.tex some-image.jpg some-cool-file.tex
```

*NB* The first file should be the file you want to compile, all others are
supporting files.

### 3. Compile local git repo

In case you store all your `.tex` and supporting files in a git repo, you
can compile the project with the command
```
bash remote-compile.sh -g main.tex
```
The script will behave as if `main.tex` includes each file stored in your git repo.

## DEPLOYMENT

This part is for you if you'd like to deploy the service on your
own machine

### Dependencies

- `pdflatex` command to compile documents
- `curl` to fetch documents from web
- `node.js` to run server
- `npm` to install node dependencies
- `memcached` for caching compiled documents
- `md5` or `md5sum` utility to hash documents according to their value

### Installation

1. `git clone git@github.com:aslushnikov/latex-online.git` to clone repo
2. `sh util/check.sh` to check if all dependencies are satisfied and create
   `tmp/` dir
3. `npm install` to install node dependencies

Installation of `pdflatex` is beyond the scope of the document.

### Running

1. `node app.js` - runs node server
2. `memcached` - runs local memcached instance


# TODO List

* Add optional query arguments
    - `strict-mode` if true, then return PDF if and only if it doesn't have
      errors
    - `download` if true, return file in attachment and not to the browser
    - `cache` if false, do not cache response
* Add some statistics on API usage

