<!-- links to social media icons -->
<!-- icons with padding -->
[1.1]: http://i.imgur.com/tXSoThF.png (twitter icon with padding)
<!-- icons without padding -->
[1.2]: http://i.imgur.com/wWzX9uB.png (twitter icon without padding)
<!-- links to your social media accounts -->
[1]: http://www.twitter.com/latex_online
<!-- Please don't remove this: Grab your social icons from https://github.com/carlsednaoui/gitsocial -->

# About LaTeX.Online [![alt text][1.1]][1]

This service is developed to compile latex documents online. It can build PDF directly from GIT repository with TeX sources or from any link to TeX file. 

In addition, the service provides command-line utility (for compiling local documents), API and Stand-Alone version. See more below.

[Latex-Online](http://latexonline.cc)

## Contents

- [Latex-Online](#latex-online)
    - [Capabilities](#capabilities)
    - [API](#api)
        - [Compile url](#compile-url)
        - [Compile text](#compile-text)
        - [Compile git repo](#compile-git-repo)
        - [Optional request arguments](#optional-request-arguments)
    - [Command-line interface](#command-line-interface)
        - [Installation](#installation)
        - [Example 1: compile single file](#example-1-compile-single-file)
        - [Example 2: compile files with dependencies](#example-2-compile-files-with-dependencies)
        - [Example 3: compile local git repo](#example-3-compile-local-git-repo)
    - [How it works?](#how-it-works)
        - [1. Given a link to a `.TEX` file, compile it](#1-given-a-link-to-a-tex-file-compile-it)
        - [2. Given a `.TEX` file content, compile it](#2-given-a-tex-file-content-compile-it)
        - [3. Given a tarball with files structure, compile it](#3-given-a-tarball-with-files-structure-compile-it)
        - [4. Given a git repo, compile it](#4-given-a-git-repo-compile-it)
    - [DEPLOYMENT](#deployment)
        - [Deploy with Docker](#deploy-with-docker)
        - [Deploy manually](#deploy-manually)
            - [Dependencies](#dependencies)
            - [Installation](#installation)
            - [Running](#running)

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
latexonline.cc/compile?url=https://raw.githubusercontent.com/aslushnikov/latex-online/master/sample/sample.tex
```

**Limitation:** this command will ignore all includes during compiling

### Compile text

**Format:**

```
/compile?text=<tex file content>
```

**Example:**
```
latexonline.cc/compile?text=%5Cdocumentclass%5B%5D%7Barticle%7D%0A%5Cusepackage%5BT1%5D%7Bfontenc%7D%0A%5Cusepackage%7Blmodern%7D%0A%5Cusepackage%7Bamssymb%2Camsmath%7D%0A%5Cusepackage%7Bifxetex%2Cifluatex%7D%0A%5Cusepackage%7Bfixltx2e%7D%20%25%20provides%20%5Ctextsubscript%0A%25%20use%20microtype%20if%20available%0A%5CIfFileExists%7Bmicrotype.sty%7D%7B%5Cusepackage%7Bmicrotype%7D%7D%7B%7D%0A%5Cifnum%200%5Cifxetex%201%5Cfi%5Cifluatex%201%5Cfi%3D0%20%25%20if%20pdftex%0A%20%20%5Cusepackage%5Butf8%5D%7Binputenc%7D%0A%5Celse%20%25%20if%20luatex%20or%20xelatex%0A%20%20%5Cusepackage%7Bfontspec%7D%0A%20%20%5Cifxetex%0A%20%20%20%20%5Cusepackage%7Bxltxtra%2Cxunicode%7D%0A%20%20%5Cfi%0A%20%20%5Cdefaultfontfeatures%7BMapping%3Dtex-text%2CScale%3DMatchLowercase%7D%0A%20%20%5Cnewcommand%7B%5Ceuro%7D%7B%E2%82%AC%7D%0A%5Cfi%0A%5Cusepackage%5Ba4paper%5D%7Bgeometry%7D%0A%5Cifxetex%0A%20%20%5Cusepackage%5Bsetpagesize%3Dfalse%2C%20%25%20page%20size%20defined%20by%20xetex%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20unicode%3Dfalse%2C%20%25%20unicode%20breaks%20when%20used%20with%20xetex%0A%20%20%20%20%20%20%20%20%20%20%20%20%20%20xetex%5D%7Bhyperref%7D%0A%5Celse%0A%20%20%5Cusepackage%5Bunicode%3Dtrue%5D%7Bhyperref%7D%0A%5Cfi%0A%5Chypersetup%7Bbreaklinks%3Dtrue%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20bookmarks%3Dtrue%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20pdfauthor%3D%7B%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20pdftitle%3D%7B%7D%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20colorlinks%3Dtrue%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20urlcolor%3Dblue%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20linkcolor%3Dmagenta%2C%0A%20%20%20%20%20%20%20%20%20%20%20%20pdfborder%3D%7B0%200%200%7D%7D%0A%5Csetlength%7B%5Cparindent%7D%7B0pt%7D%0A%5Csetlength%7B%5Cparskip%7D%7B6pt%20plus%202pt%20minus%201pt%7D%0A%5Csetlength%7B%5Cemergencystretch%7D%7B3em%7D%20%20%25%20prevent%20overfull%20lines%0A%5Csetcounter%7Bsecnumdepth%7D%7B0%7D%0A%0A%5Cauthor%7B%7D%0A%5Cdate%7B%7D%0A%0A%5Cbegin%7Bdocument%7D%0A%5Csection%7BHello%20World%7D%5Clabel%7Bhello-world%7D%0A%0AThis%20is%20your%20first%20%5Cemph%7BC%7D%20program%3A%0A%0A%5Cbegin%7Bverbatim%7D%0A%23include%20%3Cstdio.h%3E%0A%0Aint%20main(void)%20%0A%7B%0A%20%20printf(%22hello%2C%20world%5Cn%22)%3B%0A%20%20return%200%3B%0A%7D%0A%5Cend%7Bverbatim%7D%0A%0ALet's%20write%20some%20math%3A%0A%5C%5B%20%5Cfrac%7Bdf(x)%7D%7Bdx%7D%3D%5Clim_%7Bh%20%5Cto%200%7D%7B%5Cfrac%7Bf(x%2Bh)-f(x)%7D%7Bh%7D%7D%20%5C%5D%0A%5Cend%7Bdocument%7D
```

### Compile git repo

**Format:**

```
/compile?git=<repo>&target=<target file>
```

This will fetch git `repo` and compile the `target`. `target` should be a relative path to the repository root.

**Example:**

```
latexonline.cc/compile?git=https://github.com/aslushnikov/diplom-latex&target=diplom.tex
```

### Optional request arguments

For every compilation request you can pass the following additional arguments:

- `force=true` This will force cache skipping and document recompilation
- `command=xelatex` This will compile document with `xelatex` compiler. Other available options are:
    - `pdflatex`
    - `xelatex`
    - `lualatex`
- `download=sample.pdf` This will initiate downloading of the resulting PDF
    into the file with the name "sample.pdf"

## Command-line interface

The command-line interface makes it possible to edit TeX documents in
`vim`/`emacs` and compile them whenever you want from the command-line. To do so, you will
need a tool called `laton`.

### Installation


```
curl -L https://raw.githubusercontent.com/aslushnikov/latex-online/master/util/latexonline > laton && chmod 755 laton
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

### 2. Given a `.TEX` file content, compile it

1. Given content is saved locally
2. The hash sum of the file in counted in some way
3. Check in cache if we've got a PDF for the hashsum
4. If yes, then just return the precompiled PDF from cache
5. If no, then compile the file, cache the result and return it to user

### 3. Given a tarball with files structure, compile it

1. The tarball is saved locally
2. The hash sum of the tarball is counted in some way
3. Check in cache if we've got a PDF for the hashsum
4. If yes, then just return the precompiled PDF from cache
5. If no, then extract file structure from the tarball, compile it,
    cache the result and return it to user

### 4. Given a git repo, compile it

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

A Docker image is hosted and auto-updated on [hub.docker.com](https://hub.docker.com/r/aslushnikov/latex-online/)

1. `docker pull aslushnikov/latex-online`
2. `docker run -d -p 2700:2700 -t aslushnikov/latex-online`

### Deploy manually


#### Dependencies

- `pdflatex` command to compile documents
- `bc` to estimate some values in scripts
- `curl` to fetch documents from web
- `node.js` to run server
- `npm` to install node dependencies
- `memcached` for caching compiled documents
- `md5` or `md5sum` utility to hash documents according to their value
- `python3` to run the `latexrun` build system

#### Installation

1. `git clone git@github.com:aslushnikov/latex-online.git` to clone repo
2. `sh util/check.sh` to check if all dependencies are satisfied and create
   `tmp/` dir
3. `npm install` to install node dependencies

Installation of `pdflatex` is beyond the scope of the document.

#### Running

1. `node app.js` - runs node server
2. `memcached` - runs local memcached instance
