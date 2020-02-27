/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.util.RequestParameters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.web.server.ConfigurableWebServerFactory;
import org.springframework.boot.web.server.WebServerFactoryCustomizer;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.validation.annotation.Validated;

import javax.servlet.http.HttpServletRequest;
import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import java.io.IOException;
import java.net.ServerSocket;
import java.util.Map;

@Configuration
@ConfigurationProperties
@Validated
public class ClientConfig
  implements WebServerFactoryCustomizer<ConfigurableWebServerFactory> {

  private static final Logger logger = LoggerFactory.getLogger(ClientConfig.class);

  final String message="Can't be blank. Set in application.properties or on the command line.";
  final String intMessage="You have to set value in application.properties or on the command line.";

  public int getContainerPort() {
    return containerPort;
  }

  private int containerPort;

  @NotBlank(message = message)
  private String mlHost;

//  @NotBlank(message = message)
  private String mlUsername;

//  @NotBlank(message = message)
  private String mlPassword;

  @Min(message = intMessage,value = 1)
  private int mlStagingPort;

  @Min(message = intMessage,value = 1)
  private int mlAppServicesPort;

  @Min(message = intMessage,value = 1)
  private int mlAdminPort;

  @Min(message = intMessage,value = 1)
  private int mlManagePort;

  @NotBlank(message = message)
  private String mlDhfRoot;

  @NotBlank(message = message)
  private String mlModulesDatabase;

  @Value("${customModulesRoot:#{null}}")
  private String customModulesRoot;

  // getters  / setters
  /**
   * @return the mlStagingPort
   */
  public int getMlStagingPort() { return mlStagingPort; }

  public String getCustomModulesRoot() {
      return customModulesRoot;
  }

  public String getMlModulesDatabase() {
      return mlModulesDatabase;
  }

  public int getMlAppServicesPort() { return mlAppServicesPort; }

  public int getMlAdminPort() { return mlAdminPort; }

  public int getMlManagePort() { return mlManagePort; }

  public String getMlHost() {
    return mlHost;
  }

  public String getMlDhfRoot() {
    return mlDhfRoot;
  }

  public String getMlUsername() {
    return mlUsername;
  }

  public String getMlPassword() {
    return mlPassword;
  }

  public void setMlHost(String mlHost) {
    if (mlHost!=mlHost.trim()) {
      logger.warn("I trimmed the value of mlHost from \""+mlHost+"\" to \""+mlHost.trim()+"\"");
      mlHost = mlHost.trim();
    }
    this.mlHost = mlHost;
  }

  public void setMlUsername(@Valid String mlUsername) {
    if (mlUsername!=mlUsername.trim()) {
      logger.warn("I trimmed the value of mlUsername from \""+mlUsername+"\" to \""+mlUsername.trim()+"\"");
      mlUsername = mlUsername.trim();
    }
    this.mlUsername = mlUsername;
  }

  public void setMlPassword(@Valid String mlPassword) {
    if (mlPassword!=mlPassword.trim()) {
      logger.warn("I trimmed the value of mlPassword from \""+mlPassword+"\" to \""+mlPassword.trim()+"\"");
      mlPassword = mlPassword.trim();
    }
    this.mlPassword = mlPassword;
  }

  public void setMlStagingPort(int mlStagingPort) {
    this.mlStagingPort = mlStagingPort;
  }

  public void setMlAppServicesPort(int mlAppServicesPort) {
    this.mlAppServicesPort = mlAppServicesPort;
  }

  public void setMlAdminPort(int mlAdminPort) {
    this.mlAdminPort = mlAdminPort;
  }

  public void setMlManagePort(int mlManagePort) {
    this.mlManagePort = mlManagePort;
  }

  public void setMlDhfRoot(String mlDhfRoot) {
    if (mlDhfRoot!=mlDhfRoot.trim()) {
      logger.warn("I trimmed the value of mlDhfRoot from \""+mlDhfRoot+"\" to \""+mlDhfRoot.trim()+"\"");
      mlDhfRoot = mlDhfRoot.trim();
    }
    this.mlDhfRoot = mlDhfRoot;
  }

  public void setCustomModulesRoot(String customModulesRoot) {
    if (customModulesRoot!=null && customModulesRoot!=customModulesRoot.trim()) {
      logger.warn("I trimmed the value of customModulesRoot from \""+customModulesRoot+"\" to \""+customModulesRoot.trim()+"\"");
      customModulesRoot = customModulesRoot.trim();
    }
    this.customModulesRoot = customModulesRoot;
  }

  public void setMlModulesDatabase(String mlModulesDatabase) {
    if (mlModulesDatabase!=mlModulesDatabase.trim()) {
      logger.warn("I trimmed the value of mlModulesDatabase from \""+mlModulesDatabase+"\" to \""+mlModulesDatabase.trim()+"\"");
      mlModulesDatabase = mlModulesDatabase.trim();
    }
    this.mlModulesDatabase = mlModulesDatabase;
  }

  @Autowired
  Environment environment;

  public DatabaseClient client() {
    return DatabaseClientFactory.newClient(
      getMlHost(),
      getMlStagingPort(),
      new DatabaseClientFactory.DigestAuthContext(getMlUsername(), getMlPassword()));
  }

  public DatabaseClient client(String username, String password) {
    return DatabaseClientFactory.newClient(
      getMlHost(),
      getMlStagingPort(),
      new DatabaseClientFactory.DigestAuthContext(username, password));
  }

  public RequestParameters extractParams(HttpServletRequest request) {
    Map<String, String[]> requestParams = request.getParameterMap();

    RequestParameters params=new RequestParameters();
    for (Map.Entry<String, String[]> entry : requestParams.entrySet()) {
      String newKey = entry.getKey().replace("rs:","");
      params.add(newKey,entry.getValue()[0]);
    }

    return params;
  }


  public ResourceServices getService(DatabaseClient client) {
    PipesResourceManager pipesResourceManager=new PipesResourceManager(client);
    return pipesResourceManager.getServices();
  }


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
          containerPort=port;
          portFound=true;
        } catch (IOException e) {
          //port used, moving on
          port++;
        }
      }
    }
    else {
    //       assign default 8081 if not specified
    String serverPort=environment.getProperty("server.port");
      containerPort = Integer.parseInt(serverPort);
    }
  }
}
