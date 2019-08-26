    FROM mlregistry.marklogic.com/marklogic/ml-10.0-1:latest  

    # Get any CentOS updates then clear the Docker cache
    RUN yum -y update && yum clean all

    # Install Java JRE so that QuickStart can be run
    RUN yum install java-1.8.0-openjdk-headless -y

    # Install java-devel (to use *jar*, etc)
    RUN yum install java-devel -y

    # add JAVA_HOME
    ENV JAVA_HOME=/usr/lib/jvm/java-1.8.0-openjdk-1.8.0.222.b10-0.el7_6.x86_64

    # Copy QuickStart 
    # RUN mkdir /home/dhf5
    # COPY marklogic-datahub-5.0.1.war /home/dhf5/marklogic-datahub-5.0.1.war

    # add Gradle
    RUN yum install wget -y
    RUN wget https://services.gradle.org/distributions/gradle-4.6-bin.zip -P /tmp
    RUN yum install unzip -y
    RUN unzip -d /opt/gradle /tmp/gradle-4.6-bin.zip
    RUN touch /etc/profile.d/gradle.sh ; printf "export GRADLE_HOME=/opt/gradle/gradle-4.6\nexport PATH=\${GRADLE_HOME}/bin:\${PATH}\n" >> /etc/profile.d/gradle.sh; chmod +x /etc/profile.d/gradle.sh; source /etc/profile.d/gradle.sh

    # add yarn, nvm, node, npm and quasar
    RUN yum install -y gcc-c++ make
    RUN curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash -
    RUN source ~/.bash_profile ; nvm install node; npm install yarn -g; npm install -g @quasar/cli

    # add git
    RUN yum install git -y

    # Expose MarkLogic Server ports and Middle-tier ports
    # Also expose any ports your own MarkLogic App Servers use such as
    # HTTP, REST and XDBC App Servers for your applications
    EXPOSE 7997 7998 7999 8000 8001 8002 8010 8015

    # Start MarkLogic from init.d script.
    # Define default command (which avoids immediate shutdown)
    CMD /etc/init.d/MarkLogic start && tail -f /dev/null
