# Latex Compiler Service

This is a small service developed to
compile simple latex documents online using only
a link to the plain TeX document.

You can think of it as a latex build server, that builds
things on demand. Probably it will evolve to a full-featured
latex build server (no plans about it -- just dreams).

# Purpose

I keep the latex source of my diploma on github, and I thought
it would be cool to have a link that will show the pdf of the text.
It probably could be done by adding the pdf to the repo, but that's not
THAT pure way we all are striving for...

This project is a solution that's going to satisfy my needs

# Dependencies

- `curl` to fetch documents from web
- `pdflatex` command to compile documents
- `node.js` to run server
- `express.js` for routing & rendering
- `memcached` for caching compiled documents

# Installation

Under the condition that you've got pdflatex installed, the following
sequence will bring the thing to your machine

* Clone the repo
* `npm install`
* `node app.js` - runs node server
* `memcached` - runs local memcached instance

# Usage

Suppose you've got running it locally, there are couple of options of using the
service:

* Human interface: go to `localhost:2700` and enter url in the field
* 'API': just request `localhost:2700/compile?url=...` to get a response with
  pdf

# Current state of the art

Unfortunately I failed to find a working node-memcached module that
would support binary data storing, so at the moment it uses some module that is
not reliable. Beware: having caching option turned on may cause the service to
be laggy.

Btw, caching could be easily turned off, and in this configuration everything
works fine but kinda slow.

