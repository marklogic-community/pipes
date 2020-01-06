# Pipes for MarkLogic DataHub

## What is it?
A visual programming plugin for MarkLogic. It integrates with [MarkLogic's Datahub](https://docs.marklogic.com/datahub/) and produces the custom code step using a no-code UI environment.

Pipes for MarkLogic DataHub is a community tool.As such, it is not supported by MarkLogic Corporation and is only updated and corrected based on best effort approach. Any contribution or feedback is welcomed to make the tool better.

## Great! How do I run it?
Download the jar from the releases section. In the same directory where you placed the jar, create application.properties file with following content:

```
# this is where the UI will be running, make sure the port is not used
server.port=8081

# MarkLogic DHF settings
mlHost=localhost
mlStagingPort=8010
mlUsername=admin
mlPassword=admin

# this is the root of your DHF project to deploy backend modules to
mlDhfRoot=/my/projects/dhf 
```

Pipes requires several backend modules to be installed on MarkLogic. When you run the Pipes jar for the first time, use following:

```java -jar pipes-xyz.jar --deployBackend=true```

This will run the UI and deploy backend modules to the appropriate location within your DHF project. 

Now, you have to (re)load modules by running
```./gradlew mlReloadModules```
from your DHF project root.

Pipes UI is now running on localhost and port that you've specified in the application.properties under value server.port. Example: [localhost:8081](ocalhost:8081)

For subsequent Pipes runs on the same DHF project, you can ommit the deployBackend parameter.

Have fun!