---
draft: false
title: Docker Training 4 - Managing The Build Context
pubDate: July 21, 2021
categories:
  - tutorial
  - docker
tags:
  - docker-series
series: docker-training
description: Understanding the Docker Build Context
heroImage: /docker-training.webp

---

So far we have created a small api that runs in a container. We've tested that its working. Worked with environment variables inside the container on the `docker run` command. Accessed a shell inside the container with the `docker exec` command. Now I want to talk about the docker build context.

## Docker Build Context

The most common way to work with the build context is to build an image based on our current path. How we do `docker build . -t repository:version` We are doing this with a relatively small app. So we haven't gone over a few things that you will see in a larger project. One of the first things you will see in a larger project is a [.dockerignore](https://docs.docker.com/engine/reference/builder/#dockerignore-file) file. This is a lot like your `.gitignore`. We don't need every file in our repo to build our image. So why are we going to bring them into the build context. If you are doing a huge data science project with large sample model files. Or a financial model project with 100s of .csv files to test against. Now, I won't get into the argument about if that data really belongs in the repo. Thats not the purpose of this series. But if it is we don't need it to build our base image to run our app.

So take this structure for example:
```
myApp/
    .git/
    .github/
    docs/
        getting_started.md
        install.md
    src/
       myApp/
    scripts/
       install.sh
    dockerfile
    .dockerignore
```
Pretty simple app structure. What part of this do we really need to build this app? the `src/myApp` for sure. But the rest would all just be bloat to our build context.

Remember the output we had from our `docker build` command?

```shell
$ docker build . -t helloFromIntegratnIO
Sending build context to Docker daemon  144.4kB
Step 1/7 : FROM golang:alpine
 ---> 6af5835b113c
Step 2/7 : RUN apk update && apk add --no-cache git
 ---> Using cache
 ---> 80212a0a3d3b
Step 3/7 : WORKDIR $GOPATH/src/integratnio/go-rest-api/
 ---> Using cache
 ---> 75eb0766eb86
Step 4/7 : COPY go-rest-api .
 ---> 103a86626a1d
Step 5/7 : RUN go get -d -v
 ---> Running in 88aa3cef85b2
Removing intermediate container 88aa3cef85b2
 ---> 22e8e7d430e6
Step 6/7 : RUN go build -o /go/bin/hello
 ---> Running in e6c5ada5af3e
Removing intermediate container e6c5ada5af3e
 ---> ff7cb854f70f
Step 7/7 : ENTRYPOINT ["/go/bin/hello"]
 ---> Running in 1a4d5925b331
Removing intermediate container 1a4d5925b331
 ---> e8d948afae99
Successfully built e8d948afae99
Successfully tagged helloFromIntegratnIO:latest
```

Look at line 2 of that output.
```
Sending build context to Docker daemon  144.4kB
````

That happened so quick we didn't even talk about it before. When building your container. Everything in your local context will go into the build context unless you declaratively exclude it. Not a big deal when your repo is only a couple megabytes. But when you get into the Gigabytes and you are trying to speed up the build you will come back here and find a way to trim a couple minutes right up front.

So lets create a .dockerignore for the file structure example I posted earlier.

```shell
.git/
.github/
docs/
scripts/
```
There are other ways to pass a build context. You could pass a URL, a tar file and more. Docker has built great documentation around all of it [here](https://docs.docker.com/engine/reference/commandline/build/).
