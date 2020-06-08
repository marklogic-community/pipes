/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import com.marklogic.pipes.ui.auth.AbstractLoggingClass;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.net.ServerSocket;

/**
 * This class configures the port that Pipes UI will be available on
 * If the user didn't specify @server.port, first available port will be used,
 * starting the count from 8080
 */

@Component
public class ServerPortCustomizer extends AbstractLoggingClass
  implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {


  @Autowired
  Environment environment;

  @Autowired
  ClientConfig clientConfig;

  @Override
  public void customize(ConfigurableWebServerFactory factory) {

    if (environment.getProperty("server.port")==null) {
      // pick an unused port starting from 8080
      int port=8080; // starting value

      boolean portFound=false;
      while (!portFound) {
        ServerSocket socket = null;
        try {
          socket = new ServerSocket(port);
          factory.setPort(port);
          logger.info("Setting port: "+port);
          clientConfig.setContainerPort(port);
//          containerPort=port;
          portFound=true;
          socket.close();

        } catch (IOException e) {
          //port used, moving on
          port++;
        }
      }
    }
    else {
      //       assign default 8081 if not specified
      String serverPort=environment.getProperty("server.port");
      clientConfig.setContainerPort(Integer.parseInt(serverPort));
    }

  }
}
