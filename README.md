# Latex-Online

## Try it

[Latex-Online](http://latex.aslushnikov.com)

Thanks to [@udalov](https://github.com/udalov) for deployment server

## Contents

- [Try it](#try-it)
- [About](#about)
- [Capabilities](#capabilities)
- [API](#api)
    - [Compile url](#compile-url)
    - [Compile git repo](#compile-git-repo)
    - [Optional request arguments](#optional-request-arguments)
- [Remote compiling](#remote-compiling)
    - [1. Compile single file](#1-compile-single-file)
    - [2. Compile files with dependencies](#2-compile-files-with-dependencies)
    - [3. Compile local git repo](#3-compile-local-git-repo)
- [How it works?](#how-it-works)
    - [1. Given a link to a `.TEX` file, compile it](#1-given-a-link-to-a-tex-file-compile-it)
    - [2. Given a tarball with files structure, compile it](#2-given-a-tarball-with-files-structure-compile-it)
    - [3. Given a git repo, compile it](#3-given-a-git-repo-compile-it)
- [DEPLOYMENT](#deployment)
    - [Dependencies](#dependencies)
    - [Installation](#installation)
    - [Running](#running)
- [TODO List](#todo-list)

## About

This is a small service developed to
compile latex documents online. The slogan is: "You give it a link, it gives you
a PDF.", but the service has evolved and thus you can give it a git repo to
build as well.

Additionally the service could be used for *remote compiling* of latex documents.
See "usage" section for a bit more information.

## Capabilities

- Compile `.TEX` file via link. (Limitation: includes will be ignored)
- Compile GIT repo via link.
- Compile local files or git repo with the help of `remote-compile.sh` tool.
- REST API for compiling

## API

**HTTP Response Codes**

The service will return HTTP.2xx on success and compiled PDF file. Otherwise
a HTTP.4xx code will be returned with a compilation error log in response body.

### Compile url

```/compile?url=<url to tex file>```

**Example:**
```
latex.aslushnikov.com/compile?url=https://raw.github.com/aslushnikov/latex-online/master/sample/sample.tex
```

**Limitation:** this command will ignore all includes during compiling

### Compile git repo

```/compile?git=<repo>&target=<target file>```
This will fetch git `repo` and compile the `target`.

`target` should be a relative path to the target file in your git repo.

**Example:**
```
latex.aslushnikov.com/compile?git=https://github.com/aslushnikov/diplom-latex&target=diplom.tex
```

### Optional request arguments

For every request for compiling you can pass the following additional arguments:

- `force=true` This will force recompiling the document
- `download=sample.pdf` This will initiate downloading of the resulting PDF
    into the file with the name "sample.pdf"

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

## How it works?

In this section a brief description of the service from the inside is given.

Generally speaking the service is made out of two parts
- `Node.js` part which with the help of `express.js` provides the REST API, and
  with the help of `mc` bridges the gap with `memcached` instance
- `Bash` scripts which handle all the jobs related to the service (fetching
  files, hashSumming them, compiling e.t.c)

There are three types of requests:

1. Given a link to a `.TEX` file, compile it
2. Given a tarball with files structure, compile it
3. Given a git repo, compile it

Every request is handled in a bit special way

### 1. Given a link to a `.TEX` file, compile it

1. The URL of the given file is fetched and saved locally
2. The hash sum of the file is counted in some way
3. Check in cache if we've got a PDF for the hashsum
4. If yes, then just return the precompiled PDF from cache
5. If no, then compile the file, cache the result and return it to user

### 2. Given a tarball with files structure, compile it

1. The tarball is saved locally
2. The hash sum of the tarball is counted in some way
3. Check in cache if we've got a PDF for the hashsum
4. If yes, then just return the precompiled PDF from cache
5. If no, then extract file structure from the tarball, compile it,
    cache the result and return it to user

### 3. Given a git repo, compile it

This kind of request is handled in a bit different way, as we can
get a hashSum of the repo without cloning the entire repository.

1. Using `git ls-remote` extracting `sha1` of the master branch
3. Check in cache if we've got a PDF for the given `sha1`
4. If yes, then just return the precompiled PDF from cache
5. If no, then do a shallow copy of the given git repo
6. Compile it, cache the result and return it to user

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
- `rubber` latex build system is used to build files

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
* Add some statistics on API usage
