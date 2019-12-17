# use this sceipt to generate the JAR file containing the VPP UI
# it will appear in java-middle-tier/build/libs
# the version is controlled in java-middle-tier/build.gradle

#!/bin/sh
quasar build
cp -r dist/spa/* java-middle-tier/src/main/resources/static/.
java-middle-tier/gradlew bootJar -p java-middle-tier
