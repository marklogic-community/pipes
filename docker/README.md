# Running Pipes in a Docker container

## Getting the image

First, you need to have the Pipes image. You can either pull the image from DockerHub or build your own using the Dockerfile from this repo (see below).

## Pulling the Pipes image from Docker Hub
Assuming you already have a Docker Hub account, log in to Docker Hub using your credentials. Run

``docker login``

and enter your credentials if necessary.

Then, pull the image:

``docker pull dhfpipes/pipes:v1``

## Running Pipes

### Running Pipes and MarkLogic DHF in containers

To run Pipes and MarkLogic DHF in containers, we recommend using **docker-compose**. The following instructions use the docker-compose files in this project.

#### Prerequisites

* You've either pulled the Pipes image from DockerHub or created your own (if you've done that, we've assumed you've tagged it *pipes:v1*)
* You have the MarkLogic image from [DockerHub](https://hub.docker.com/_/marklogic) on your local machine. 
* There's a copy of MarkLogic's Data Hub Framework on your local machine.
  * You need to have added mlBundle to your ``build.gradle`` file (see the [main Pipes documentation](https://github.com/marklogic-community/pipes)).
  * You also need to have [initiated your DHF project](https://github.com/marklogic-community/pipes) (you've run ``./gradlew hubInit``)

#### Steps

##### Set the variables docker-compose will use

First, create an ``.env`` file, based on this example:

```
# Stack properties
stackName=test

# MarkLogic properties
DHFversion=5.2.0
mlAdmin=admin
mlPassword=*******
mlVersion=10.0-3-dev-centos
mlAdminPort=8000
mlAppServicesPort=8001
mlManagePort=8002
mlStagingPort=8010
mlPortRange=7997-8025

# Port mappings
markLogicPortMapping=7997-8025
quickStartPortMapping=9080
pipesPortMapping=9081

# quick_start properties (inside container)
quickstartPort=8080

# pipes properties (inside container)
pipesPort=8081

# DHF files on local machine
DHFfiles=/location/of/your/DHF/project
```

##### Start MarkLogic

Then, start a new instance of  MarkLogic in a container:

``docker-compose up marklogic.dhf.local``

After a few minutes MarkLogic will have been installed and initiated.

##### Start Pipes

Finally, start Pipes:

``docker-compose  -f pipes.yml up``

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

## Building the Pipes image from the Dockerfile

First, create a directory to contain the Pipes jar. From the directory that contains the Dockerfile and entrypoint script (pipes-entrypoint.sh) run:

``mkdir jar``

Then, download the Pipes .jar into the directory you just created.

``curl -L -o jar/marklogic-pipes-1.0-beta.3.jar https://github.com/marklogic-community/pipes/releases/download/1.0-beta.3/marklogic-pipes-1.0-beta.3.jar``

Finally, build the image:

``docker build -t pipes:v1 .``
