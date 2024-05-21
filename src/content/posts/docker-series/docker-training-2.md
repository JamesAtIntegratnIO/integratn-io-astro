---
title: "Docker Training 2 - My First Docker Build"
pubDate: July 20, 2021
tags: ["docker-series"]
categories: [tutorial, docker]
series: docker-training
description: Lets build our first docker image together
heroImage: /docker-training.webp
---

The goal of this project is not to learn how to build APIs in Golang or anything extra. If you want to learn more about the snippet below feel free to dig through the [Go Docs](https://golang.org/pkg/net/http/). Now lets create files and get started.

To get started we need to create a project to store our app we are going to work with. Create the following structure. We'll keep filling more in as we go later.
```shell
DockerTraining/
    go-rest-api/
        main.go
    dockerfile
```
Initialize the folder as a go project
```shell
$ GO111MODULE=on go mod init helloFromIntegratnIO
```

Add the following code to main.go

```golang
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

func helloFromIntegratnIO(w http.ResponseWriter, r *http.Request) {
	message := "Hello From Integratn.IO"
	if m := os.Getenv("MESSAGE"); m != "" {
		message = m
	}
	fmt.Fprintf(w, "%s\n", message)
	fmt.Println("Endpoint Hit: helloFromIntegratnIO")
}

func handleRequests() {
	http.HandleFunc("/", helloFromIntegratnIO)
	log.Fatal(http.ListenAndServe(":10000", nil))
}

func main() {
	fmt.Println("Starting Web Server")
	fmt.Println("Preparing to handle requests")
	fmt.Println("Ready for requests")
	handleRequests()
}
```
Not a whole lot going on up there. We create a ResponseWriter that prints some text whenever you hit the app on port 10000.

Lets get our dockerfile filled in.

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
ENTRYPOINT ["/go/bin/hello"]
```
<!--adsense-->
Looks familiar, right?

Lets step through this one more time. We declared our base image with the __FROM__ instruction. Then we use the __RUN__ instruction to install git. Used __WORKDIR__ to change the path we are working from. Copied in our code with the __COPY__ instruction. Used the __RUN__ Command again to get any possible dependencies that were needed for our program. One more final use of __RUN__ to build our app into an executable. Then finally we declared our __ENTRYPOINT__ with the final instruction pointing to where our app is located.

Now we are ready to finally step through a build. Lets issue our first docker command.

Run `$ docker build . -t helloFromIntegratnIO`

Lets look at the output.

```shell
✭ ᐅ docker build . -t helloFromIntegratnIO
Sending build context to Docker daemon  84.48kB
Step 1/7 : FROM golang:alpine
alpine: Pulling from library/golang
596ba82af5aa: Pull complete
344f2904b0c6: Pull complete
d3bda26d9fa1: Pull complete
24e1a14bb4a2: Pull complete
f0b175b107d5: Pull complete
Digest: sha256:07ec52ea1063aa6ca02034af5805aaae77d3d4144cced4e95f09d62a6d8ddf0a
Status: Downloaded newer image for golang:alpine
 ---> 6af5835b113c
Step 2/7 : RUN apk update && apk add --no-cache git
 ---> Running in db684e4aab79
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/community/x86_64/APKINDEX.tar.gz
v3.13.0-114-g822507f819 [https://dl-cdn.alpinelinux.org/alpine/v3.13/main]
v3.13.0-115-g41ee0c8f55 [https://dl-cdn.alpinelinux.org/alpine/v3.13/community]
OK: 13880 distinct packages available
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/main/x86_64/APKINDEX.tar.gz
fetch https://dl-cdn.alpinelinux.org/alpine/v3.13/community/x86_64/APKINDEX.tar.gz
(1/6) Installing brotli-libs (1.0.9-r3)
(2/6) Installing nghttp2-libs (1.42.0-r1)
(3/6) Installing libcurl (7.74.0-r0)
(4/6) Installing expat (2.2.10-r1)
(5/6) Installing pcre2 (10.36-r0)
(6/6) Installing git (2.30.0-r0)
Executing busybox-1.32.1-r0.trigger
OK: 19 MiB in 21 packages
Removing intermediate container db684e4aab79
 ---> 80212a0a3d3b
Step 3/7 : WORKDIR $GOPATH/src/mypackage/myapp/
 ---> Running in 60c0c79d0d5c
Removing intermediate container 60c0c79d0d5c
 ---> 29ab2f51aa11
Step 4/7 : COPY go-rest-api .
 ---> 7ded2d7874e0
Step 5/7 : RUN go get -d -v
 ---> Running in da6e8b285779
Removing intermediate container da6e8b285779
 ---> f7eb2d97bd6f
Step 6/7 : RUN go build -o /go/bin/hello
 ---> Running in 0e503ced7243
Removing intermediate container 0e503ced7243
 ---> 21bbd2acaf3c
Step 7/7 : ENTRYPOINT ["/go/bin/hello"]
 ---> Running in 42165a2c670f
Removing intermediate container 42165a2c670f
 ---> 86fd2d2eb271
Successfully built 86fd2d2eb271
Successfully tagged helloFromIntegratnIO:latest
```

So whats happening here?

Step 1/7: Our __FROM__ instruction is consumed and we see it fetch all the layers needed to build our base image.

Step 2/7: __RUN__ executes and there is some normal `apt` output while it installs git and the required dependencies.

Step 3/7: We see __WORKDIR__ set our new path that we are "working in".

Step 4/7: __COPY__ pulls our source code into the image.

Step 5/7: __RUN__ uses the go executable to fetches dependencies for our app. Something to notice here. We never installed Go locally. All of this runs in the build container. As long as the base image you work from has the binary you need or you add it to the container some how. You can run whatever you need in the container without worrying about something locally on your machine getting in the way.

Step 6/7 __RUN__ uses the go executable again to build the app.

Step 7/7 __ENTRYPOINT__ declares the what to start with the container.

The image is built. But where did it go? Lets use `docker image ls` to find it
```shell
ᐅ docker image ls
REPOSITORY          TAG       IMAGE ID            CREATED             SIZE
helloFromIntegratnIO    latest    dee090a053a3        About an hour ago   321MB
```
Heres how this output breaks down:

REPOSITORY: The name we gave our image.

TAG: `latest` is always the most recently built version of the image.

IMAGE ID: This is a unique hash that identifies our image

CREATED: How long ago the image was created

SIZE: The size of our image.

Lets take a quick second and talk about tags. Tags are important. They are a great way to reference what version of our image is running. They help us be declarative in what we run in any environment. So, lets create an app with an actual tag instead of latest.

```shell
ᐅ docker build . -t helloFromIntegratnIO:dev
Sending build context to Docker daemon  100.9kB
Step 1/7 : FROM golang:alpine
 ---> 6af5835b113c
Step 2/7 : RUN apk update && apk add --no-cache git
 ---> Using cache
 ---> 80212a0a3d3b
Step 3/7 : WORKDIR $GOPATH/src/integratnio/go-rest-api/
 ---> Using cache
 ---> 75eb0766eb86
Step 4/7 : COPY go-rest-api .
 ---> Using cache
 ---> 9ea13e96b401
Step 5/7 : RUN go get -d -v
 ---> Using cache
 ---> cf8a5cf85856
Step 6/7 : RUN go build -o /go/bin/hello
 ---> Using cache
 ---> e4e107828679
Step 7/7 : ENTRYPOINT ["/go/bin/hello"]
 ---> Using cache
 ---> dee090a053a3
Successfully built dee090a053a3
Successfully tagged helloFromIntegratnIO:dev
```

Wait a second. This output looks different. What happened?

Here is one of the advantages of Docker. Your Docker cache maintains a history of your images and the layers used to build those images. If your dockerfile and you code haven't changed it will use a cached image to build that layer.  Since all we did was retag the image it just consumed the cache all the way down.

Lets look at our images again.

```shell

/Volumes/CaseSensitive/docker-training (main ✘)✹ ᐅ docker image ls
REPOSITORY            TAG        IMAGE ID            CREATED             SIZE
helloFromIntegratnIO  dev        dee090a053a3        About an hour ago   321MB
helloFromIntegratnIO  latest     dee090a053a3        About an hour ago   321MB
<none>                <none>     86fd2d2eb271        About an hour ago   321MB
```

So, we have the `dev` tag we just created. But lets look at the `IMAGE ID`. The `dev` tag and the `latest` tag have the same `IMAGE ID`. This is what we want because it is the most recently created image.

So what is this `<none>` image? If you scroll up. You will see that the `<none> IMAGE ID` matches the `IMAGE ID` from our first build. This shows you what happens when you don't properly tag your images. If you built another image using the `dev` tag. The same thing would happen to that image. But this is local testing and not a production release. So no big deal.
