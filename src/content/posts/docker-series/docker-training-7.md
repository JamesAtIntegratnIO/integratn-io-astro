---
title: "Docker Training 7 - Trimming the Fat for Production"
pubDate: July 29, 2021
tags: ["docker-series"]
categories: [tutorial, docker]
series: docker-training
description: We are going to trim the fat off our image and make it production ready.
heroImage: /docker-training.webp
---

# Trimming the Fat for Production

In our last lesson we briefly went over how a mutlistage build works. Lets poke at that a little more. To start. Lets look at our base image again.

Our base image is huge.

```shell
ᐅ docker image ls
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
helloFromIntegratnIO   latest    8de75cb71a32   22 seconds ago   322MB
```

322 Megabytes for our tiny little program. Now imagine if we had a complete restful backend built with multiple dependencies baked into this image. Every time we made a change and deployed this to an environment we have to push all that fat up.

Now lets look at our multistage image.

```sh
ᐅ docker image ls
REPOSITORY         TAG       IMAGE ID       CREATED         SIZE
helloFromIntegratnIO   latest    d655734a72e2   2 seconds ago   308MB
```

We managed to save a whole whopping 14MB. With a little more tweaking we are going to trim almost 300MB off this image.

Because we used the alpine image, we know that alpine contains all the libraries that the `go build` command used to build our base image. This makes choosing our new base image to build from simple. We can just use the generic alpine image. You can learn more about this image from [docker hub](https://hub.docker.com/_/alpine). But the greatest thing about it. Its tiny. Like, really tiny.

```shell
docker image ls
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
alpine             latest    49f356fa4513   10 days ago      5.61MB
```

Lets tweak the image to use this.

Our new dockerfile:

```dockerfile
FROM golang:alpine
# Keep older versions of Go behaving the same as the latest
ENV GO111MODULE=on \
    CGO_ENABLED=1
# Install git.
# Git is required for fetching the dependencies.
RUN apk update && apk add --no-cache git
WORKDIR $GOPATH/src/integratnio/go-rest-api/
COPY go-rest-api .
# Fetch dependencies.
# Using go get.
RUN go get -d -v
# Build the binary.
RUN go build -o /go/bin/hello
# use a smaller base image
FROM alpine
# Copy our static executable from the builder.
COPY --from=builder /go/bin/hello /
# Run the binary.
ENTRYPOINT ["/hello"]
```

We did a couple tweaks here.

* We updated the base image to use that sweet tiny alpine image.
* We updated the `COPY` command to copy to the root instead of needlessly creating directories that we don't need.
* We fixed the entrypoint to use that new file location.

Lets build the image and see what happens.

Run `$ docker build . -t helloFromIntegratnIO`

When that finishes we can do `$ docker image ls` to list our images.

```shell
docker image ls
REPOSITORY         TAG       IMAGE ID       CREATED          SIZE
helloFromIntegratnIO   latest    f7dbee314464   12 minutes ago   11.8MB
alpine             latest    49f356fa4513   10 days ago      5.61MB
```

Look at this. Its only 6.2MB bigger than our base image. How awesome is that. On our next post in the series we are going to switch gears from this small helloWorld to using an actual crud service with a database. Get ready to step it up another notch.
