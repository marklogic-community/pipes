# initaite DHF
dhf/gradlew hubInit -p dhf

# copy distro files to DHF src folder structure
dhf/gradlew copyDhfDistro -p dhf

# copy DHF entities to DHF entities folder
dhf/gradlew copyDhfEntities -p dhf

# copy DHF flows and step definitions to DHF folders
dhf/gradlew copyDhfFlows -p dhf

# copy DHF step definitions
dhf/gradlew copyDhfStepDefinitons -p dhf

# unpack sample input data
dhf/gradlew unpackSampleData -p dhf

# download DHF QS UI .jar
dhf/gradlew downloadFile -p dhf
