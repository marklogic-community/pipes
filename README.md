# Pipes for MarkLogic DataHub

## What is it?
A visual programming plugin for [MarkLogic](https://docs.marklogic.com/guide/getting-started/intro). It integrates with the [MarkLogic Data Hub](https://docs.marklogic.com/datahub/) and produces the code for a [Custom Step](https://docs.marklogic.com/datahub/modules/editing-custom-step-module.html) using a no-code UI environment.

Pipes for MarkLogic DataHub is a community tool. As such, it is not supported by MarkLogic Corporation and is only updated and corrected based on a best-effort approach. Any contribution or feedback is welcomed to make the tool better.

Pipes is designed to run on MarkLogic 10.0-2 (with DHF 5.1.0 installed). 

## Great! How do I run it?
To use Pipes you will need to have an instance of MarkLogic with the [Data Hub](https://docs.marklogic.com/datahub/index.html) installed.

Next, download the Pipes jar from the [Releases](https://github.com/marklogic-community/pipes/releases) section. In the same directory where you placed the jar, create an application.properties file with following content (for Linux/Unix/Mac):

```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlUsername=myusername
mlPassword=mypassword 
mlModulesDatabase=data-hub-MODULES

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=/my/projects/dhf 
```
and for Windows
```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlUsername=myusername
mlPassword=mypassword 
mlModulesDatabase=data-hub-MODULES

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=C:/Users/user/dev/test-pipes
```

Pipes requires several backend modules to be installed on MarkLogic.
When you run the Pipes jar for the first time, use the following command:
```java -jar marklogic-pipes-1.0-beta.1.jar --deployBackend=true```
This will start the Pipes UI, as well as copying modules to the appropriate location within your DHF project and loading these modules to the modules database specified in your application.properties 

You probably care about security. If you don't want to put your username and password into a plain text file, you can remove them from the properties file and instead pass them as a parameter to the Pipes jar. Example:  
```java -jar marklogic-pipes-1.0-beta.1.jar --mlUsername=MYUSER --Password=MYPASSWORD```

Pipes UI is now running on localhost and the port that you've specified in the application.properties under value server.port. Example: [localhost:8081](http://localhost:8081)

For subsequent Pipes runs on the same Data Hub Framework project, you can omit the --deployBackend parameter.

## Uhm, OK, I got it up and running! How do I use it?
Learn on Pipes Wiki [how to create your first Pipes project](https://github.com/marklogic-community/pipes/wiki/1.-Creating-your-first-Pipes-project)

Have fun!

![alt text](https://github.com/marklogic-community/pipes/blob/master/Pipes.png?raw=true) 

## How I deploy the module with my custom blocks
Read about it here: [Creating custom user blocks](https://github.com/marklogic-community/pipes/wiki/4.-Creating-custom-user-blocks-for-developers)
## How can uninstall Pipes?

To remove all back-end modules that Pipes installed and delete saved data such as Blocks and Graphs from the MarkLogic database, run Pipes as follows:

```java -jar marklogic-pipes-1.0-beta.1.jar --undeployBackend=true```

This will remove the database-side code libraries as well as any saved data created by Pipes, such as Blocks and Graphs.
