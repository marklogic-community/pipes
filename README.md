# Flowtilla

## What is it?
A visual programming plugin for MarkLogic. It integrates with [MarkLogic's Datahub](https://docs.marklogic.com/datahub/) and produces the custom code step using a no-code UI environment.

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

Flowtilla requires several backend modules to be installed on MarkLogic. When you run Flowtilla for the first time, use following:

```java -jar flowtilla-ui-xyz.jar --deployBackend=true```

This will run the UI and deploy backend modules to the appropriate location within your DHF project. 

Now, you have to (re)load modules by running
```./gradlew mlReloadModules```
from your DHF project root.

Flowtilla UI is not running on localhost and port that you've specified in the application.properties under value server.port. Example: [localhost:8081](ocalhost:8081)

For subsequent Flowtilla runs on the same DHF project, you can ommit the deployBackend parameter.

Have fun!