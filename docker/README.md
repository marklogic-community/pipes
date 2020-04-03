# Running Pipes in a Docker container

Pipes can be run from a [Docker](https://docs.docker.com/engine/docker-overview/) image and connect to [MarkLogic](https://docs.marklogic.com/guide/getting-started/intro) running in another container, on your local machine, or on a remote server. The Pipes image is a lightweight Java container, built on [openjdk:8-jdk-alpine](https://hub.docker.com/_/openjdk).

For more information about the Pipes project and the technologies referred to in this guide, please see:

* [Pipes](https://github.com/marklogic-community/pipes)

* [MarkLogic Data Hub Framework (DHF)](https://docs.marklogic.com/datahub/)
* [Gradle](https://gradle.org/)

* [Create a DHF project using Gradle](http://docs.marklogic.com/datahub/projects/create-project-using-gradle.html) 
* [Docker networking](https://docs.docker.com/config/containers/container-networking/)

### Set-up

Before following the instructions below, please make sure:

* You have the MarkLogic image from [DockerHub](https://hub.docker.com/_/marklogic) on your local machine. 

* You have a Data Hub Framework (DHF) project on your local machine.
  * In this project, you need to have added the Pipes [mlBundle](https://github.com/marklogic-community/ml-gradle/wiki/Bundles) to your DHF ``build.gradle`` file (see the [main Pipes documentation](https://github.com/marklogic-community/pipes) for more information)
  
## Getting the image

The Pipes image is hosted on DockerHub. Assuming you already have a DockerHub account, first make sure you are logged-in. 

``docker login``

Then, enter your credentials (if necessary).

Next, pull the image:

``docker pull dhfpipes/pipes:v1``

## Running Pipes

### Connecting to an existing MarkLogic container 

If you already have a MarkLogic container running on your machine, please run

```
docker run -it --name pipes 
   --mount type=bind,source={DHF},target=/DHF 
   -e "MLHOST={host}"  
   -e "MLUSERNAME={username}" 
   -e "MLPASSWORD={password}" 
   -p 8081:8081 
   --network="{network}"
   --rm 
```

replacing the values in brackets:

* DHF (the location of the DHF project files on your local machine)
* host (the hostname of the MarkLogic instance Pipes will connect to)
* username (your MarkLogic username)
* password (your MarkLogic password)
* network (the Docker network your MarkLogic container is running in)

Please remember that for your Pipes container to connect to an existing MarkLogic instance with DHF, it will need to have had the Pipes modules installed. To add Pipes to your DHF, include *mlBundle* in your ``build.gradle``. (See the [main Pipes documentation](https://github.com/marklogic-community/pipes) for more information.)

### Creating a new MarkLogic container and connecting Pipes to it

To run both Pipes and MarkLogic DHF in containers, we recommend using [Docker Compose](https://docs.docker.com/compose/). The following instructions use the Docker Compose files in this project.

#### 1) Set the Docker Compose environment values

Create an ``.env`` file. This file contains the values your containers will use. You can use the ``example.env`` file for reference. You can use most of the default values from ``example.env``, but will need to change:

* mlAdmin (your MarkLogic username)

* mlPassword (your MarkLogic password)

* mlVersion (the version of the MarkLogic image that's on your machine)

* DHFfiles (the directory that contains your DHF project)

#### 2) Start the MarkLogic container

``docker-compose -f marklogic.yml up``

After a few minutes the terminal output will stop and MarkLogic will have been installed and initiated. To check, log-in to your MarkLogic instance (e.g., [localhost:8000]()) with the username and password you set in the ``.env`` file.

#### 3) Deploy your DHF project to MarkLogic

Open a new terminal window. Change directory to the location of your DHF project (this will be the directory you set the *DHFfile* property to in the ``.env`` file).

``./gradlew mlDeploy``

Gradle will deploy the DHF to your MarkLogic container, via *localhost*, using the port-binding you specified in the ``.env`` file.

#### 4) Start Pipes

Opening another terminal, change directory to the location that contains your Docker Compose files (where you started the MarkLogic container from).

``docker-compose  -f pipes.yml up``

You should now have MarkLogic and Pipes running in containers and available via the bound ports. For example, at [localhost:8000]() and [localhost:9081]().
