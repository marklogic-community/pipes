# initaite DHF
dhf/gradlew hubInit -p dhf

# copy distro files to DHF src folder structure
dhf/gradlew copyDhfDistro -p dhf

# copy DHF entities to DHF entities folder
dhf/gradlew copyDhfEntities -p dhf

# unpack sample input data
dhf/gradlew unpackSampleData -p dhf