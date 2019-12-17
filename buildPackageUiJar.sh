#!/bin/sh
quasar dev
cp -r dist/spa/* java-middle-tier/src/main/resources/static/.
java-middle-tier/gradle buildJar -p java-middle-tier
