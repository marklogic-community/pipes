# use this sceipt to generate the JAR file containing the Pipes UI
# it will appear in java-middle-tier/build/libs
# the version is controlled in java-middle-tier/build.gradle

#!/bin/sh

# build the front end SPA UI

echo "Packaging the front end..."
cp node_modules_override/litegraph.js node_modules/litegraph.js/build/litegraph.js
quasar build

# create static resource directory first
echo "Moving the front-end package to SpringBoot static resources folder..."
mkdir -p java-middle-tier/src/main/resources/static

# deploy to resources/static to be picked up by jar builder
cp -r dist/spa/* java-middle-tier/src/main/resources/static/.

echo "Moving the back-end modules to SpringBoot dhf resources folder..."
# create dhf resource directory first
mkdir -p java-middle-tier/src/main/resources/dhf/src

# deploy backend modules to be picked up by jar builder
cp -r ml-backend/src/* java-middle-tier/src/main/resources/dhf/src/.

echo "Deleting existing builds in java-middle-tier/build/libs..."
rm -f java-middle-tier/build/libs/*

echo "Building the jar..."
java-middle-tier/gradlew clean bootJar -p java-middle-tier --warn


if [[ $1 !=  "release" ]]
  then
    echo "Assuming nightly build, will add timestamp..."

    for file in java-middle-tier/build/libs/marklogic-pipes*.jar; do
    mv "$file" "${file%.jar}.$(date +%s).jar"
    
done 
fi
