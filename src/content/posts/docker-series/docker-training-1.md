---
title: "Docker Training 1 - Getting Started"
pubDate: "July 20 2021"
tags: ["docker-series"]
categories: [tutorial, docker]
series: docker-training
description: Getting started with docker. In this tutorial we will take a quick run at getting our environment set up in preparation for the rest of the series.
heroImage: /docker-training.webp
---

Before we can really dive into this project we need take care of a few things. First we need to get our environment setup to run docker. Then we need to go over a couple things about Dockerfiles and the Docker CLI 

## Installing Docker

### Mac

Mac install is pretty straight forward. Follow the instructions below

[Instructions](https://docs.docker.com/docker-for-mac/install/)

### Windows
There are 2 ways to install docker on windows. 1 is supported with a Hyper-V Backend and the second is supported with a WSL2 backend. Windows home users have to use the WSL2 backend method. Pro, Education, and Enterprise can use either.

[WSL2 Instructions](https://docs.docker.com/docker-for-windows/install-windows-home/)

[Hyper V Instructions](https://docs.docker.com/docker-for-windows/install/)


### Linux

Like all things linux. Docker setup is a bit more manual. You will have to install both Docker and Docker Compose to get through these lessons. Please find the directions for your preferred distro here. You will also have to run the Post-Installation steps or run all your docker commands as the root user.

[Docker Install](https://docs.docker.com/engine/install/)
[Docker Compose Install](https://docs.docker.com/compose/install/)
[Post Installation](https://docs.docker.com/engine/install/linux-postinstall/)

## What is a dockerfile

Lets get started on understanding a dockerfile. A dockerfile is the instruction set that is used to build a docker image. Each instruction within the dockerfile will create a new layer or intermediate image. These layers are like commits in a git repository. Any of the layers is a fully built image that could be ran as a Docker container. Here is a basic example of a dockerfile for Go.
```dockerfile
FROM golang:alpine
# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH/src/mypackage/myapp/
COPY . .
# Fetch dependencies.
# Using go get.
RUN go get -d -v
# Build the binary.
RUN go build -o /go/bin/hello
ENTRYPOINT ["/go/bin/hello"]
```
Lets step through the various instructions and see what they do. I have linked all of the instruction identifiers below. There are many others and can be found in the [Dockerfile Builder Documentation](https://docs.docker.com/engine/reference/builder/)

The [__FROM__](https://docs.docker.com/engine/reference/builder/#from) is an instruction that initializes a new build stage sets a base image. This is the container that will run while we build our image. Right now we are consuming the Golang image from Alpine. We chose this image because it is lighter and faster than the official Golang image. You can find more about Alpine Linux and their images from [here](https://www.alpinelinux.org/about/). There are many other images to choose from and they can be found at [Docker Hub](https://hub.docker.com). 

The [__RUN__](https://docs.docker.com/engine/reference/builder/#run) is how we execute a shell command inside the container that we are building from. This instruction will execute any commands that are passed to it.

The [__WORKDIR__](https://docs.docker.com/engine/reference/builder/#workdir) instruction is used to change the working directory within the project. Much like how the command `cd` is used in a shell. If the directory doesn't exist it will be created even if it is never used in any other Dockerfile instructions.

The [__COPY__](https://docs.docker.com/engine/reference/builder/#copy) instruction will copy everything from the declared path relative to your project to the destination of where it will live inside your image. In this case we are copying everything from the base of the project directory to `$GOPATH/src/mypackage/myapp/`. The first `.` represents your project directory. The second `.` represents the `WORKDIR` we set earlier.

The [__ENTRYPOINT__](https://docs.docker.com/engine/reference/builder/#entrypoint) instruction is executable that will be ran when the container is started.

<!--adsense-->

## Getting started with the Docker CLI

The Docker CLI is the main way we will interact with Docker. We will use it to build Docker images, run Docker containers and see whats going on in our Docker environment.

### See the help menu: 
```shell 
docker help 
```

For any docker command, use `docker help $command` to learn more about the command and the options that are available for it. I highly encourage you run this on ever command below. There are many options that you can pass to commands and it will list the aliases that can be used to make the commands shorter and save save some typing

### Building an image:
```shell
docker build . -t $MYIMAGENAME:$MYIMAGETAG
```
Usage: `docker build [OPTIONS] PATH | URL | -`

Generally when building an image you are in the root directory of your project. That directory also contains the Dockerfile that will be used to build the project. It is also important to tag your images so that you can find them in the future. This is the purpose of the `-t` in the command above. If you don't when you search through your images you will only see `None` as the image name. 

### Listing images in your local registry:
```shell
docker image ls
```

### List running containers
```shell
docker container ls
```

### List all containers (Including exited)
```shell
docker container ls --all
```

### Get logs from container
```shell
docker logs $CONTAINERNAME | $CONTAINERID
```
This is very helpful if you have a container that keeps crashing on startup.

