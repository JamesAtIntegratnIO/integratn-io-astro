---
title: "Docker Training 5 -  Developing Inside A Docker Container"
pubDate: July 29, 2021
tags: ["docker-series", development, devops]
categories: [tutorial, docker]
series: docker-training
description: Developing inside a docker container can be a game changer. Lets see how we can do that with our little API.
heroImage: /docker-training.webp
---


Now we are going to start getting into the weeds of leveraging docker. I think an easy way to start this one would be with a user story. So here we go.

As a developer I would like to have an environment to develop that alleviates the "Works on my box" problem. It should work just the same on my box as it does in production. I shouldn't be able to install something in my environment that doesn't exist when I deploy my app to production. Any other developer should be able to pick up my app and develop the exact same way without a huge time sink spent getting their environment to look just like mine.

Pipe dreams, am i right?

Lets see how we can pull this off with docker.

Most languages these days support some sort of live reload to allow developers to instantly make a change and have it running live for them to play with. So lets start out by adding that functionality to our little API.

## Running The Container

Running this container so that we can actually work inside it with our editor is going to take a bit more than we've done before. We are actually going to leverage an image we haven't built ourselves this time. Lets take look at the image we are going to use. [cosmtrek/air](https://hub.docker.com/r/cosmtrek/air). Please take a minute to explore the image link if you haven't explored Dockerhub before. The `Overview` tab will give you a rundown of how to use the image. The `Tags` tab will show you different tags you can consume. So if we scroll down on the overview you will see how to run it `The Docker Way`. So lets do that.

First we need to pull the image down.
```
docker pull cosmtrek/air
```
If we wanted to consume a specific tag then we could do that as well. Just make sure you also use that tag in the following docker run command.

Lets add a little config for air so that it will cleanup for us when its done. In `$projectRoot/go-rest-api/`, lets add `.air.conf` and fill it with the following then save.

```shell
# .air.conf
# Config file for [Air](https://github.com/cosmtrek/air) in TOML format

# Working directory
# . or absolute path, please note that the directories following must be under root.
root = "."
tmp_dir = "tmp"
[build]
# It's not necessary to trigger build each time file changes if it's too frequent.
delay = 1000 # ms
# Stop to run old binary when build errors occur.
stop_on_error = true
[color]
# Customize each part's color. If no color found, use the raw app log.
main = "magenta"
watcher = "cyan"
build = "yellow"
runner = "green"

[misc]
# Delete tmp directory on exit
clean_on_exit = true
```

Now lets run this image and load our code into on the fly
```shell
docker run -it --rm\
    -w /app/ \
    -v `pwd`/go-rest-api:/app/ \
    -p 8080:10000 \
    cosmtrek/air \
    -c .air.conf
```

Theres a lot going on there. So lets break it down.

`docker run`: We've seen this before. Just the base command to run a container

`-it`: This is the shorthand way to declare `--interactive --tty` that we discussed earlier

`--rm`: This will cleanup the filesystem that our container creates. Normally this persists. But we really don't want that happening. Whenever we start this we want make sure its fresh with just the code we are working with.

`-w`: Just like in our Dockerfile. This lets us declare `WORKDIR`

`-v`: This is short for `--volume` This will mount our `$projectRoot/go-rest-api` at `/app` inside the container. the \`pwd\` is just a little shorthand to get our present working directory. Otherwise we would have to declare the full path of what we want to mount inside the container.

`-p 8080:10000` Port mapping just like before.

`cosmtrek/air` Declaring the image we want to use.

`-c .air.conf` Because we declared `-it` we are able to pass parameters to `ENTRYPOINT` of the container. We are leveraging this to pass in the configuration file we created.

You should have gotten an output like this.
```shell
$ docker run -it --rm\
    -w /app/ \
    -v `pwd`/go-rest-api:/app/ \
    -p 8080:10000 \
    cosmtrek/air \
    -c .air.conf

  __    _   ___
 / /\  | | | |_)
/_/--\ |_| |_| \_ // live reload for Go apps [v1.11.1]

mkdir /app/tmp
watching .
!exclude tmp
building...
running...
Starting Web Server
Preparing to handle requests
Ready for requests
```

So looking at this right off the bat. We see that it spun up `v1.11.1`. Thats old. Lets do this again using a version tag to run a newer version. (If you are doing this later. You may have gotten a different version. But at the time of writing. It looks like new images are being pushed but `latest` isn't being updated)
```
docker run -it --rm\
    -e GO111MODULE=off
    -w /app/ \
    -v `pwd`/go-rest-api:/app/ \
    -p 8080:10000 \
    cosmtrek/air:v1.15.1 \
    -c .air.conf

```

You'll notice this time. We skipped the pull step. Yay Shortcuts. There was one other little thing we added.
`-e GO111MODULE=off`: GO111MODULE in its most simplest terms tells go whether to look for and require go modules. Getting into all of that really isn't the point of this. But if you are curious, this [blog](https://dev.to/maelvls/why-is-go111module-everywhere-and-everything-about-go-modules-24k) was a great read.

But we are running again. And look. Our go version is more recent
```
$ docker run -it --rm\
    -e GO111MODULE=off \
    -w /app/ \
    -v `pwd`/go-rest-api:/app/ \
    -p 8080:10000 \
    cosmtrek/air:v1.15.1 \
    -c .air.conf

  __    _   ___
 / /\  | | | |_)
/_/--\ |_| |_| \_ v1.15.1 // live reload for Go apps, with Go 1.15.5

mkdir /app/tmp
watching .
!exclude tmp
building...
running...
Starting Web Server
Preparing to handle requests
Ready for requests
```

So lets see if our curl still works.
```shell
curl localhost:8080
```
Output:
```shell
$ curl localhost:8080
Hello From integratnio
```
Great the app is still working. Now lets make a code change and watch the live reload do its thing.

## Making a change

Open up `$projectRoot/go-rest-api/main.go`. On line 11 you will see `message` declared. Lets change the value of that line and save the file. Feel free to change it to anything you want. But I'm going to change it to `Yay we did it`

Watch the terminal running your dev container when you hit save.
```shell
main.go has changed
building...
running...
Starting Web Server
Preparing to handle requests
Ready for requests
```
Magic.

Lets test that curl request again.
Output:
```shell
$ curl localhost:8080
Yay We Did It
```
Look at that. This is just one example of how to do this. For a node app you could use `npm run dev:watch` as your entrypoint and get a similar effect. Pick your code flavor and I bet you could figure out a way to do this.
