# Latex Compiler Service

This is a small service developed to
compile simple latex documents online using only
a link to the plain TeX document.

You can think of it as a latex build server, that builds
things on demand. Probably it will evolve to a full-featured
latex build server (no plans about it -- just dreams).

# Purpose

I keep the latex source of my diploma on github, and I thought
it would be cool to have an a link that will show the pdf of the text.
It probably could be done by adding the pdf to the repo, but that's not
THAT pure way we all are striving for.

# Dependencies

- `curl` to fetch documents from web
- `pdflatex` command to compile documents
- `node.js` to run server
- `express.js` for routing & rendering
- `memcached` running local instance for caching compiled documents

# Current state of the art

Unfortunately I failed to find a working node-memcached module that
would support binary data storing, so at the moment it uses some module that is
not reliable and that's why it lags.

Btw, caching could be easily turned off, and in this configuration everything
works fine but kinda slow.

