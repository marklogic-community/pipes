# Pipes for MarkLogic DataHub

## What is it?
A visual programming plugin for [MarkLogic](https://docs.marklogic.com/guide/getting-started/intro). It integrates with [MarkLogic's Datahub](https://docs.marklogic.com/datahub/) and produces the custom code step using a no-code UI environment.

Pipes for MarkLogic DataHub is a community tool. As such, it is not supported by MarkLogic Corporation and is only updated and corrected based on a best-effort approach. Any contribution or feedback is welcomed to make the tool better.

Pipes is designed to run on MarkLogic 10.0-2 (with DHF 5.1.0 installed). 

## Great! How do I run it?
To use Pipes you will need to have an instance of MarkLogic with the DHF installed.

Next, download the jar from the releases section. In the same directory where you placed the jar, create an application.properties file with following content:

```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlUsername=myusername
mlPassword=mypassword 

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=/my/projects/dhf 
```

If you don't want to put your username and password into a plain text file, you can remove them from the properties file and instead pass them as a parameter to the Pipes jar.

Pipes requires several backend modules to be installed on MarkLogic. When you run the Pipes jar for the first time, use the following:

```java -jar pipes-xyz.jar --deployBackend=true```

This will run the UI and deploy backend modules to the appropriate location within your DHF project. 

Now, you have to (re)load modules by running
```./gradlew mlReloadModules```
from your DHF project root.

Pipes UI is now running on localhost and the port that you've specified in the application.properties under value server.port. Example: [localhost:8081](localhost:8081)

For subsequent Pipes runs on the same DHF project, you can omit the deployBackend parameter.

Have fun!