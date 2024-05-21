---
title: "Docker Training 3 - My First Docker Deployment"
pubDate: July 20, 2021
tags: ["docker-series"]
categories: [docker, tutorial]
series: docker-training
description: We've built an image. Now lets make it go vroom!
heroImage: /docker-training.webp
---

Lets recap where we are so far. We've gone over some of the basics of a Dockerfile. Talked a bit about some basic commands that will come in handy as we continue. Wrote a Dockerfile to build our little Golang API. Finally we have built an image and discussed tags.


## Docker Run
So lets deploy this image and play with it a little bit. Open up a terminal and type this command.
```shell
$ docker run --publish 127.0.0.1:8080:10000/tcp helloFromIntegratnIO
```

Lets step through this command 1 piece at a time.

`docker run`: Here we are telling the Docker cli that we want to [run](https://docs.docker.com/engine/reference/commandline/run/) an image as a container.

`-publish`: [Publish](https://docs.docker.com/engine/reference/commandline/run/#publish-or-expose-port--p---expose) will bind a local port to a port in the container.

`127.0.0.1`: Keeps us only exposing localhost, so our container won't be available outside of our machine.

`:8080`: is the local port on our host machine that we are binding to
`:10000`: is the port inside the container that we want `8080` to impersonate.

`/tcp`: is the protocol we want to use. You could also use `udp` or `sctp` if needed. You can learn more about that in the [User Guide](https://docs.docker.com/network/links/#connect-using-network-port-mapping)

If you haven't hit enter yet. Go ahead and hit it now and kick off that Docker run command.

You should see the following output.
```shell
$ docker run -p 127.0.0.1:8080:10000/tcp helloFromIntegratnIO
Starting Web Server
Preparing to handle requests
Ready for requests
```
Lets see if it works.

Open up a second terminal and enter:
```shell
$ curl localhost:8080
```
Output:
```shell
$ curl localhost:8080
Hello from Integratn.IO!!!
```

Now we are cooking. But what else can we do with this little container.

Lets change the response from the curl request. We can do this by passing an environment variable into the container. We can do this one of two ways. We can edit the docker file. Add the [ENV](https://docs.docker.com/engine/reference/builder/#env) instruction. Tell it it we want `MESSAGE` to equal something else. Rebuild our image. Then finally run it again. This is a great method for establishing default values for environment variables. Or we can add the parameter [--env](https://docs.docker.com/engine/reference/commandline/run/#set-environment-variables--e---env---env-file) with a value to our `docker run` command and change it on the fly. Environment Variables passed during a `docker run` command will always trump what is in your Dockerfile. If you haven't exited the container already hit `ctrl +c` to exit the container from the terminal.

Lets run the following command:
```shell
docker run --env MESSAGE="Hello from outerspace" -p 127.0.0.1:8080:10000/tcp helloFromIntegratnIO
```
Now in another terminal lets use that curl statement again.
```shell
$ curl localhost:8080
Hello from outerspace
```
Look at that. We changed the response with the environment variable.

## Docker exec

Lets look at the [docker exec](https://docs.docker.com/engine/reference/commandline/exec/) command while our container is running. Docker exec allows us to run commands inside our container while its already running. This can be very handy for debugging a container. But first we have to figure out what our container is named.

Lets look at our running container with a command we covered in lesson 1:
```shell
$ docker ps
```
You will get an output similar to this but your `NAMES` field will not be the same.

```shell
$ docker ps
CONTAINER ID   IMAGE              COMMAND           CREATED         STATUS         PORTS                       NAMES
56290825f889   helloFromIntegratnIO   "/go/bin/hello"   2 minutes ago   Up 2 minutes   127.0.0.1:8080->10000/tcp   hungry_bohr
```

Now that we have found our running container. Lets use the container name and execute a shell to get into our container.
```shell
docker exec --interactive --tty hungry_bohr /bin/sh
```
Output:
```shell
$ docker exec --interactive --tty hungry_bohr /bin/sh
/go/src/integratnio/go-rest-api #
```
Does that path look familiar? Its the same path we set for `WORKDIR` in the Dockerfile. We are in the shell of the container. Type `exit` and hit `enter` to leave the container.

Lets look at the command real quick.

`docker exec` is the base command. This is declaring that we want to execute something against a running container.
`--interactive` will keep STDIN open even if we aren't attached.
`--tty` gives us a pseudo tty.
`hungry_bohr` is the name of my running container. Yours will be different.
`/bin/sh` This is the command we want to run in the container. One caveat to this. Whatever you run against the container has to actually be part of the container. In an effort to trim containers down a lot of container images don't have a shell command available.

So now, we've ran our container. We've exec'd into our container so that we can explore it. Thats it for this time. Get ready for next time when we have a brief exploration into the build context.
