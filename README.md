# Pipes for MarkLogic DataHub

## What is it?
A visual programming tool for [MarkLogic](https://docs.marklogic.com/guide/getting-started/intro). It integrates with the [MarkLogic Data Hub](https://docs.marklogic.com/datahub/) and produces the code for a [Custom Step](https://docs.marklogic.com/datahub/modules/editing-custom-step-module.html) using a no-code UI environment.

Pipes for MarkLogic DataHub is a community tool. As such, it is not supported by MarkLogic Corporation and is only updated and corrected based on a best-effort approach. Any contribution or feedback is welcomed to make the tool better.

## Prerequisites

Pipes is designed to run on MarkLogic 10.0-2 and higher.

It assumes that:

- A DHF project (5.1.0 and higher) is present on the local file-system
- That DHF project is installed to your MarkLogic server
- Java 8 or higher installed
 

## Great! How do I run it?
To use Pipes you will need to have an instance of MarkLogic with the [Data Hub](https://docs.marklogic.com/datahub/index.html) installed.

Next, download the Pipes jar from the [Releases](https://github.com/marklogic-community/pipes/releases) section. Copy the jar to the DHF folder root you plan to use Pipes for.

Run pipes from the command line:

```
java -jar marklogic-pipes-1.1.jar
```

As soon as Pipes starts, it will print out the port number it's running on. Example, Pipes will be available on: [localhost:8080](http://localhost:8080) if the port is 8080.

## Pipes options (command line parameters)

Pipes has several properties that can be used on the command line, when starting the Pipes jar:

- ```environmentName```
    
    If you have multiple environments in your DHF project, you can tell Pipes which one to use.

    Example:
    
    ```java -jar marklogic-pipes-1.1.jar --environmentName=production```

    will first read gradle.properties of the project and then gradle-production.properties

- ```server.port```

    Pipes will run on a first availble port it finds counting from 8000. If you want to specify your own port, use this parmeter

- ```mlDhfRoot```

    If you want to run Pipes from another folder (not from the DHF root project folder), you have to use this parameter to tell Pipes where to look for the DHF project.

    Example:

    ```java -jar marklogic-pipes-1.1.jar --mlDhfRoot=/users/user/dev/test-pipes```

    or, on Windows:

    ```java -jar marklogic-pipes-1.1.jar --mlDhfRoot=C:/Users/user/dev/test-pipes```


#### Backend modules

Pipes requires several backend modules (libraries) to be installed on the MarkLogic server, both when running the Pipes UI to design your custom code and when running the custom code within the DHF flow, later.

They will be installed automatically when Pipes runs.

In case when you have 2 environments - one where you use the Pipes UI and another where you run the custom steps designed by Pipes, you will need these modules installed on both environments.

Pipes modules can be separately installed using [mlBundle](https://github.com/marklogic-community/ml-gradle/wiki/Bundles). To use the Pipes modules bundle in your DHF project, add the following to `build.gradle`:

    ```
    repositories {
        maven {url 'https://dl.bintray.com/marklogic-community/Maven/'}
    }
    
    dependencies {
        mlBundle "com.marklogic:pipes-modules:1.1"
    }
    ```


## Uhm, OK, I got it up and running! How do I use it?
Learn on Pipes Wiki [how to create your first Pipes project](https://github.com/marklogic-community/pipes/wiki/1.-Creating-your-first-Pipes-project)

Have fun!

![alt text](https://github.com/marklogic-community/pipes/blob/master/Pipes.png?raw=true) 

## How I deploy the module with my custom blocks
Read about it here: [Creating custom user blocks](https://github.com/marklogic-community/pipes/wiki/4.-Creating-custom-user-blocks-for-developers)

