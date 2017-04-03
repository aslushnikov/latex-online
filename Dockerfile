# Latex-Online container
#
# VERSION       1

# use the ubuntu base image provided by dotCloud
FROM node:7

MAINTAINER Andrey Lushnikov aslushnikov@gmail.com

# Sorted list of used packages.
run apt-get update && apt-get install -y \
    biber \
    cm-super \
    fontconfig \
    git-core \
    latex-xcolor \
    preview-latex-style \
    python3 \
    texlive-bibtex-extra \
    texlive-fonts-extra \
    texlive-generic-extra \
    texlive-lang-all \
    texlive-lang-swedish \
    texlive-latex-base \
    texlive-latex-extra \
    texlive-math-extra \
    texlive-science \
    texlive-xetex

COPY ./docker-entrypoint.sh /
EXPOSE 2700
CMD ["./docker-entrypoint.sh"]

