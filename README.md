# Latex-Online

## Try it

[Latex-Online](http://latex.aslushnikov.com)

Thanks to [@udalov](https://github.com/udalov) for deployment server

## Contents

- [Latex-Online](#latex-online)
    - [Try it](#try-it)
    - [Contents](#contents)
    - [About](#about)
    - [Capabilities](#capabilities)
    - [API](#api)
        - [Compile url](#compile-url)
        - [Compile git repo](#compile-git-repo)
        - [Optional request arguments](#optional-request-arguments)
    - [Command-line interface](#command-line-interface)
        - [Installation](#installation)
        - [Example 1: compile single file](#example-1-compile-single-file)
        - [Example 2: compile files with dependencies](#example-2-compile-files-with-dependencies)
        - [Example 3: compile local git repo](#example-3-compile-local-git-repo)
    - [How it works?](#how-it-works)
        - [1. Given a link to a `.TEX` file, compile it](#1-given-a-link-to-a-tex-file-compile-it)
        - [2. Given a tarball with files structure, compile it](#2-given-a-tarball-with-files-structure-compile-it)
        - [3. Given a git repo, compile it](#3-given-a-git-repo-compile-it)
    - [DEPLOYMENT](#deployment)
        - [Deploy with Docker](#deploy-with-docker)
        - [Deploy manually](#deploy-manually)
            - [Dependencies](#dependencies)
            - [Installation](#installation)
            - [Running](#running)

## About

This is a small service developed to
compile latex documents online. The slogan is: "You give it a link, it gives you
PDF.", but the service evolved and now you can give it a git repo as well.

Additionally the service has a command-line utility that allows you for compiling
local documents.
See "usage" section for more information.

## Capabilities

- Compile `.TEX` file via link. (Limitation: includes will be ignored)
- Compile GIT repo via link.
- Compile local files or git repo via command-line interface.
- REST API for compiling.

## API

**HTTP Response Codes**

The service will return HTTP.2xx on success and compiled PDF file. Otherwise
a HTTP.4xx code will be returned with a compilation error log in response body.

### Compile url

**Format:**

```
/compile?url=<url to tex file>
```

**Example:**

```
latex.aslushnikov.com/compile?url=https://raw.github.com/aslushnikov/latex-online/master/sample/sample.tex
```

**Limitation:** this command will ignore all includes during compiling

### Compile git repo

**Format:**

```
/compile?git=<repo>&target=<target file>
```

This will fetch git `repo` and compile the `target`. `target` should be a relative path to the repository root.

**Example:**

```
latex.aslushnikov.com/compile?git=https://github.com/aslushnikov/diplom-latex&target=diplom.tex
```

### Optional request arguments

For every compilation request you can pass the following additional arguments:

- `force=true` This will force cache skipping and document recompilation
- `download=sample.pdf` This will initiate downloading of the resulting PDF
    into the file with the name "sample.pdf"

## Command-line interface

The command-line interface makes it possible to edit TeX documents in
`vim`/`emacs` and compile them whenever you want from the command-line. To do so, you will
need a tool called `laton`.

### Installation


```
curl https://raw.github.com/aslushnikov/latex-online/master/util/laton > laton && chmod 755 laton
```

This command will result in a `laton` script created in a current directory. Put it somewhere
your $PATH references to make it available around the system.

### Example 1: compile single file

If you've got a single file (say `main.tex`) that doesn't have any includes,
then you can compile it like this:

```
laton main.tex
```

After compiling file `main.pdf` will be created in the current dir

### Example 2: compile files with dependencies

If your paper includes some files, you have to declare them to the
`laton`.

```
laton main.tex some-image.jpg some-cool-file.tex
```

*NB* The first file should be the file you want to compile, all others are
supporting files.

### Example 3: compile local git repo

In case you store all your `.tex` and supporting files in a git repo, you
can compile the project with the command

```
laton -g main.tex
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
own machine. There are two ways to do it:
- easy one, with the help of awesome project [Docker](http://www.docker.io/)
- the hard one - to do everything manually.

### Deploy with Docker

Recently a Dockerfile was added which you can just build and run.

1. `docker build -t latex .`
2. `docker run -d -p 2700:2700 -t latex`

### Deploy manually


#### Dependencies

- `pdflatex` command to compile documents
- `bc` to estimate some values in scripts
- `curl` to fetch documents from web
- `node.js` to run server
- `npm` to install node dependencies
- `memcached` for caching compiled documents
- `md5` or `md5sum` utility to hash documents according to their value
- `rubber` latex build system is used to build files

#### Installation

1. `git clone git@github.com:aslushnikov/latex-online.git` to clone repo
2. `sh util/check.sh` to check if all dependencies are satisfied and create
   `tmp/` dir
3. `npm install` to install node dependencies

Installation of `pdflatex` is beyond the scope of the document.

#### Running

1. `node app.js` - runs node server
2. `memcached` - runs local memcached instance
