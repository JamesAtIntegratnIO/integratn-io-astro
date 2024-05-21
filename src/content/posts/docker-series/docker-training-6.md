---
title: "Docker Training 6 - Multi Stage Builds"
pubDate: August 1, 2021
tags: ["docker-series"]
categories: [tutorial, docker]
series: docker-training
description: Lets talk about Multi Stage Builds
heroImage: /docker-training.webp
---

## Multi Stage Builds

## Back Story

So way back in the beginning of this we briefly discussed layers. Each line in a dockerfile adds a layer. Which means it adds size to the dockerfile.

Lets look at when we added git to our first image.

```dockerfile
RUN apk update && apk add --no-cache git
```

Its just git. No big deal right? It can't take that much space. But lets look at all the extra things that happened to add git. We ran `apk update`. This meas we reached out to the Alpine repos and fetched the basic details for every package in the apk repositories and saved them into our image. Then we did `apk add --no-cache git`. So we fetched the git package and any of its dependent packages and stashed them in our image so that we can install them. Then the installer unpacks those packages and installs the files where they are needed. Thats a lot, and thats only adding git.

So you have all these dependencies that you need to build your base image. Git, the dependencies to build your application, the compiler itself, and a bunch of other junk. We don't need all that in production. We really don't want all of that in production. Your dev dependencies are extra attack vectors. You aren't going to be pushing to git from your production container. So how do we get rid of all of that?

## About Multi Stage Builds

This is where [Multi Stage builds](https://docs.docker.com/develop/develop-images/multistage-build/) come in. Before Multi Stage Builds, you would have to do a bunch of funny shell tricks to clean up every layer as you used it just to keep the artifacts that you needed and get rid of everything else. Now with Multi Stage Builds you can declare the artifacts you want in each image. So lets start with an example

```dockerfile
FROM golang:alpine as builder
# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH/src/integratnio/go-rest-api/
COPY go-rest-api .
# Fetch dependencies using go get.
RUN go get -d -v
# Build the binary.
RUN go build -o /go/bin/hello

FROM golang:alpine
# Copy our static executable from the builder.
COPY --from=builder /go/bin/hello /go/bin/hello
# Run the binary.
ENTRYPOINT ["/go/bin/hello"]
```

Alright. Looks good right? So far this is pretty simple. We used the same base image but we only copied our binary from the first image into the second. We could also use a different base image if we wanted. This is a real simple app with no external dependencies. So the fat trimmed is minimal. But pattern still helped us save some space.

```shell
REPOSITORY          TAG    IMAGE ID       CREATED          SIZE
helloFromIntegratnIO    dev    285c3af572b0   5 seconds ago    321MB
helloFromIntegratnIO    prod   0c2fb67c8edc   14 seconds ago   306MB
```

Just look at those savings. But we can go deeper, and we will in lesson 7.
