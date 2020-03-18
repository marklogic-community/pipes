# Running Pipes in a Docker container

## Pulling the Pipes image from Docker Hub

Assuming you already have a Docker Hub account, log in to Docker Hub using your credentials. Run

``docker login``

and enter your credentials if necessary.

The pull the image:

``docker push dhfpipes/pipes:v1``

## Building the Pipes image from the Dockerfile

First, create a directory to contain the Pipes jar. From the directory that contains the Dockerfile and entrypoint script (pipes-entrypoint.sh) run:

``mkdir jar``

Then, download the Pipes .jar into the directory you just created.

``curl -L -o jar/marklogic-pipes-1.0-beta.3.jar https://github.com/marklogic-community/pipes/releases/download/1.0-beta.3/marklogic-pipes-1.0-beta.3.jar``

Finally, build the image:

``docker build -t pipes:v1 .``

## Running Pipes

To run Pipes as a container, you will need to add the following arguments to your Docker ``run`` command:

* DHF (the location of the DHF project files on your system)
* MLHOST (the uri of the MarkLogic instance Pipes will connect to, but not including "http" if it's present)
* MLUSERNAME
* MLPASSWORD

The following commands assume your Pipes image is named *pipes:v1*. If not, please change the final argument to ``docker run``.

## Connecting to MarkLogic running in a container

``services:
    marklogic.dhf.local:
      image: store/marklogicdb/marklogic-server:${mlVersion}
      hostname: ${stackName}.dhf.local``

To start Pipes, substitute the arguments (\$DHF, \$host, \$username, \$password) with the relevant values, and run:

``docker run -it --name pipes \
   --mount type=bind,source=$DHF,target=/DHF \
   -e "MLHOST=$host"  \
   -e "MLUSERNAME=$username" \
   -e "MLPASSWORD=$password" \
   -p 8081:8081 \
   --rm  \
   pipes:v1``

If you are connecting to a customer Docker network, you will also need to add that as well:

``--network $network``

This command will run Pipes in a container, mapping port 8081 in the container to port 8081 on the local machine, and create a bind mount (at the location specified in $DHF) from within the container to your local machine.

## Connecting to MarkLogic running on your local machine

Choose how to access your local network from within a container, for example using `` host.docker.internal`` on a Mac, then run: 

``docker run -it --name pipes \
   --mount type=bind,source=$DHF,target=/DHF \
   -e "MLHOST=host.docker.internal"  \
   -e "MLUSERNAME=$username" \
   -e "MLPASSWORD=$password" \
   -p 8081:8081 \
   --rm  \
   pipes:v1``