# Quasar executionGraph front App
This a upgraded version of the code to Quasar RC version

Node.js >= 8.9.0 is required.

## Set up on your local machine

1. Install quasar CLI:

$ yarn global add quasar-cli

or:

$ npm install -g @quasar-cli


2. Download modules
$ yarn install

3. Make sure to override litegraph node_modules with the project one node_modules_override

4. start dev server:
$ quasar dev

## Set up in a Docker container

The Dockerfile in the root of this project can be used to create a CentOS 7 container for development, which contains:

- MarkLogic 10
- Java 8 (1.8.0_222-b10)
- Gradle 4.6
- Node.js 12.9.0
- NPM 6.10.2
- Quasar 1.0.0

### Setting up the container

Requirements: you need to install Docker on your local machine.

With [Docker installed](https://docs.docker.com/docker-for-mac/install/), in the same directory as the Dockerfile:
1) Build the image 
```docker build -t marklogic:visual-programming . ```
2) Create and run a container from that image
``docker run -d --name=visual-programming -p 8040-8060:8000-8020 -p 9000:8080 marklogic:visual-programming``
3) find the container ID
``docker ps``
4) access the container via the terminal
``docker exec -it {your container ID} bash``
5) "Inside" the container, clone the visual-programming-repo
``git clone https://project.marklogic.com/repo/scm/fran/visual-programming-plugin.git``
Enter your MarkLogic username and password

You should now have the repo installed on your container. Next, you need to initiate MarkLogic, via port 8041 on your local machine (which is mapped to the container's port 8001)

