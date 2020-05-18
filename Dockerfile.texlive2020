#####################################################################################
# Compile this dockerfile with
#        time sudo docker build -t aslushnikov/latex-online:latest -f Dockerfile .
# Run docker image
#       sudo docker run -d -p 2700:2700 --rm --name latex-online aslushnikov/latex-online:latest
#####################################################################################
# Latex-Online container

# Rely on official texlive base image.
# Description: https://gitlab.com/islandoftex/images/texlive
# Registry viewer: https://gitlab.com/islandoftex/images/texlive/container_registry
FROM registry.gitlab.com/islandoftex/images/texlive:TL2020-2020-05-17-04-19-src

MAINTAINER Andrey Lushnikov aslushnikov@gmail.com

# Install git & Node.JS
RUN apt-get clean && apt-get update && apt-get install -y git-core nodejs npm && \
    rm -rf /var/lib/apt/lists/*

COPY ./util/docker-entrypoint.sh /

EXPOSE 2700
CMD ["./docker-entrypoint.sh"]

