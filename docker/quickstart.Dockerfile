## adapted from https://github.com/awanczowski/marklogic-data-hub-poc/blob/master/data-hub-quick-start/Dockerfile
## credit: Andrew Wanczowski

FROM openjdk:8-jdk-alpine

ARG quickstart_download_url

RUN wget -O   app.jar "${quickstart_download_url}"

COPY quickstart-entrypoint.sh .

RUN chmod +x quickstart-entrypoint.sh

ENTRYPOINT ["sh", "./quickstart-entrypoint.sh"]

CMD ["java", "-Djava.security.egd=file:/dev/./urandom","-jar","/app.jar"]