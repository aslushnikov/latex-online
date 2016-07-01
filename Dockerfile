# Latex-Online container
#
# VERSION       1

# use the ubuntu base image provided by dotCloud
FROM node:argon

MAINTAINER Andrey Lushnikov aslushnikov@gmail.com

# Sorted list of used packages.
run apt-get update && apt-get install -y \
    bc \
    biber \
    curl \
    fontconfig \
    git-core \
    latex-xcolor \
    memcached \
    preview-latex-style \
    python3.4 \
    texlive-bibtex-extra \
    texlive-fonts-extra \
    texlive-generic-extra \
    texlive-lang-cyrillic \
    texlive-lang-french \
    texlive-lang-german \
    texlive-lang-spanish \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-math-extra \
    texlive-science \
    texlive-xetex

COPY ./util/check.sh /
RUN sh /check.sh

COPY ./docker-entrypoint.sh /
EXPOSE 2700
CMD ["./docker-entrypoint.sh"]

