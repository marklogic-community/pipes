FROM openjdk:8-jdk-alpine

ENV SERVERPORT 8081

ENV MLHOST localhost

ENV MLSTAGINGPORT 8010

ENV MLAPPSERVICESPORT 8000

ENV MLADMINPORT 8001

ENV MLMANAGEPORT 8002

ENV MLUSERNAME myusername

ENV MLPASSWORD mypassword

RUN mkdir -p pipes/DHF

COPY jar/* /pipes/ 

WORKDIR /pipes

COPY pipes-entrypoint.sh .

ENTRYPOINT ["sh", "./pipes-entrypoint.sh"]

CMD java -jar *.jar 

