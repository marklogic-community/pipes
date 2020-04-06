FROM openjdk:8-jdk-alpine

RUN mkdir -p /DHF

COPY jar/* /

WORKDIR /

COPY pipes-entrypoint.sh .

RUN chmod +x pipes-entrypoint.sh

ENTRYPOINT ["sh", "./pipes-entrypoint.sh"]

CMD java -jar *.jar 

