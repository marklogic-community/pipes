# Building the Pipes image 

First, create a directory to contain the Pipes jar. From the directory that contains the Dockerfile and entrypoint script (pipes-entrypoint.sh) run:

``mkdir jar``

Then, download the Pipes .jar into the directory you just created.

``curl -L -o jar/marklogic-pipes-1.2.jar https://github.com/marklogic-community/pipes/releases/download/1.2/marklogic-pipes-1.2.jar``

Finally, build the image:

``docker build -t pipes:v1 .``