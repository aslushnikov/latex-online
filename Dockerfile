# Latex-Online container
#
# VERSION       1

# use the ubuntu base image provided by dotCloud
FROM ubuntu

MAINTAINER Andrey Lushnikov aslushnikov@gmail.com

# install node and memcached
RUN echo "deb http://us.archive.ubuntu.com/ubuntu/ precise universe" >> /etc/apt/sources.list
RUN apt-get update
RUN apt-get install -y python-software-properties python python-setuptools ruby rubygems
RUN apt-get install -y memcached
#Add node repository to sources.list and update apt
RUN add-apt-repository ppa:chris-lea/node.js && apt-get update
RUN apt-get install -y nodejs

# copy latex.online source files into sandbox
ADD . /var/www
RUN cd /var/www ; npm install

# we want to run in production mode
ENV NODE_ENV production

# LaTeX 2012
run add-apt-repository -y ppa:texlive-backports/ppa
run apt-get update

# Utilities which are used by Latex.Online
run apt-get install -y bc
run apt-get install -y curl
run apt-get install -y git-core
RUN apt-get install -y rubber
# install packages
run apt-get install -y \
        fontconfig \
        texlive-latex-base \
        texlive-xetex \
        latex-xcolor \
        texlive-math-extra \
        texlive-latex-extra \
        texlive-fonts-extra \
        texlive-lang-cyrillic \
        biblatex

WORKDIR /var/www
ENTRYPOINT ["/bin/bash"]

EXPOSE 2700

