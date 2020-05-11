# Pipes for MarkLogic DataHub

## What is it?
A visual programming tool for [MarkLogic](https://docs.marklogic.com/guide/getting-started/intro). It integrates with the [MarkLogic Data Hub](https://docs.marklogic.com/datahub/) and produces the code for a [Custom Step](https://docs.marklogic.com/datahub/modules/editing-custom-step-module.html) using a no-code UI environment.

Pipes for MarkLogic DataHub is a community tool. As such, it is not supported by MarkLogic Corporation and is only updated and corrected based on a best-effort approach. Any contribution or feedback is welcomed to make the tool better.

## Prerequisites

Pipes is designed to run on MarkLogic 10.0-2 and higher.

It assumes that:

- A DHF project (5.1.0 and higher) is present on the local file-system
- That DHF project is installed to your MarkLogic server
 

## Great! How do I run it?
To use Pipes you will need to have an instance of MarkLogic with the [Data Hub](https://docs.marklogic.com/datahub/index.html) installed.

Next, download the Pipes jar from the [Releases](https://github.com/marklogic-community/pipes/releases) section. In the same directory where you placed the jar, create an ```application.properties``` file with following content (for Linux/Unix/Mac):

```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlAppServicesPort=8000
mlAdminPort=8001
mlManagePort=8002
mlModulesDatabase=data-hub-MODULES

# this is the root of your DHF project
mlDhfRoot=/my/projects/dhf 
```
and for Windows
```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlAppServicesPort=8000
mlAdminPort=8001
mlManagePort=8002
mlModulesDatabase=data-hub-MODULES

# this is the root of your DHF project
mlDhfRoot=C:/Users/user/dev/test-pipes
```

To run Pipes do:

```
java -jar marklogic-pipes-1.1.jar
```

Pipes UI is now running on localhost and the port that you've specified in the application.properties under value server.port. Example: [localhost:8081](http://localhost:8081)

### Can I use another filename instead of ```application.properties```?
Yes. Assuming you want to use a filename ```myEnvironment.properites```, add a parameter 

```--spring.config.location=myEnvironment.properites``` 

when running the jar.


#### Backend modules

Pipes requires several backend modules (libraries) to be installed on the MarkLogic server.
They will be installed automatically when Pipes runs.

IF you need to have the Pipes modules present in your project structure, we bundled them together using [mlBundle](https://github.com/marklogic-community/ml-gradle/wiki/Bundles). To use this bundle in your DHF project, add the following to `build.gradle`:

    ```
    repositories {
        maven {url 'https://dl.bintray.com/marklogic-community/Maven/'}
    }
    
    dependencies {
        mlBundle "com.marklogic:pipes-modules:1.1"
    }
    ```




## Uhm, OK, I got it up and running! How do I use it?
Learn on Pipes Wiki [how to create your first Pipes project](https://github.com/marklogic-community/pipes/wiki/1.-Creating-your-first-Pipes-project)

Have fun!

![alt text](https://github.com/marklogic-community/pipes/blob/master/Pipes.png?raw=true) 

## How I deploy the module with my custom blocks
Read about it here: [Creating custom user blocks](https://github.com/marklogic-community/pipes/wiki/4.-Creating-custom-user-blocks-for-developers)

