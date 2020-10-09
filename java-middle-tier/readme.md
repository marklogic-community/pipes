## Running the Unit Test

* cd `java-middle-tier`
* `cd test-dhf-project` 
* Edit the ports/database name/userid/pwd in `gradle.properties` to free ports/names
* `./gradlew mlDeploy`
* `cd ..`
* `cp -v -r ../ml-backend/src/* src/main/resources/dhf/src/.`
* `gradle clean test`
* Please note, that the version number will fail until you run `buildPackageUiJar.sh`

Or run `run_unit_tests` in `java-middle-tier`

## Running pipes locally

cd into java-middle-tier folder

Open a terminal and run

    ./gradlew runLocal


This starts the middle tier of a  local pipes application on port 9081 and looks for a gradle.properties file in the java-middle-tier folder.

If you want it to point to a local dhf folder you need to provide an applications-local.proeprties file in the src/resources folder with the following properties:

```
server.port=[override pipes port]
server.servlet.session.timeout=120m
customModulesRoot=[location of the custom pipes user modules]
mlDhfRoot=[location of your DHF project]
```

After storing this file run the following command to use the new properties file:

    ./gradlew runLocal  --args='--spring.profiles.active=local'

This selects the `local` active profile

You can now create different profiles by creating a profiel specific applications-[profile].properties file and run the application for a specific profile.

After this you can open another terminal and run 

    ./gradlew runQuasarDev

to start up the pipes UI.

Open a browser and point to http://localhost:9081

After login the pipes core modules and the user defined functions will be reoaded into MarkLogic backend.

## Debugging

Following list of trace events are available:

* pipes-vpp an pipes-vpp-details => all logs for the vppBackendService
* pipes-graphHelper and pipes-graphHelper-details => all logs for the pipes-graphHelper module
* pipes-coreFuntions => all logs for the coreFunctions module
* pipes-core and pipes-core-details => all logs for the core module
