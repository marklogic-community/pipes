/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.ext.modulesloader.ssl.SimpleX509TrustManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.util.RequestParameters;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.validation.annotation.Validated;

import javax.servlet.http.HttpServletRequest;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import java.util.Map;

@Configuration
@ConfigurationProperties
@Validated
public class ClientConfig
//  implements WebServerFactoryCustomizer<ConfigurableWebServerFactory>
{

  @Autowired
  Environment environment;

  private static final Logger logger = LoggerFactory.getLogger(ClientConfig.class);

  final String message="Can't be blank. Set in application.properties or on the command line.";
  final String intMessage="You have to set value in application.properties or on the command line.";

  public int getContainerPort() {
    return containerPort;
  }

  public void setContainerPort(int containerPort) {
    this.containerPort = containerPort;
  }

  private int containerPort;

  @NotBlank(message = message)
  private String mlHost;

  public Boolean getMlUseSsl() {
    return mlUseSsl;
  }

  public void setMlUseSsl(Boolean mlUseSsl) {
    this.mlUseSsl = mlUseSsl;
  }

  private Boolean mlUseSsl;

  @Min(message = intMessage,value = 1)
  private int mlStagingPort;

  @NotBlank(message = message)
  @Value("${mlDhfRoot:.}")
  private String mlDhfRoot;

  @NotBlank(message = message)
  private String mlModulesDbName;

  @Value("${customModulesRoot:#{null}}")
  private String customModulesRoot;


  @Value("${mlTestDatabase:#{null}}")
  private String mlTestDatabase;

  // getters  / setters

  public String getMlTestDatabase() {
    return mlTestDatabase;
  }

  public void setMlTestDatabase(String mlTestDatabase) {
    this.mlTestDatabase = mlTestDatabase;
  }

  public int getMlStagingPort() { return mlStagingPort; }

  public String getCustomModulesRoot() {
      return customModulesRoot;
  }

  public String getMlModulesDbName() {
      return mlModulesDbName;
  }

  public String getMlHost() {
    return mlHost;
  }

  public String getMlDhfRoot() {
    return mlDhfRoot;
  }


  public void setMlHost(String mlHost) {
    if (mlHost!=mlHost.trim()) {
      logger.warn("I trimmed the value of mlHost from \""+mlHost+"\" to \""+mlHost.trim()+"\"");
      mlHost = mlHost.trim();
    }
    this.mlHost = mlHost;
  }

  public void setMlStagingPort(int mlStagingPort) {
    this.mlStagingPort = mlStagingPort;
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

  public void setMlModulesDbName(String mlModulesDbName) {
    if (mlModulesDbName != mlModulesDbName.trim()) {
      logger.warn("I trimmed the value of mlModulesDatabase from \""+ mlModulesDbName +"\" to \""+ mlModulesDbName.trim()+"\"");
      mlModulesDbName = mlModulesDbName.trim();
    }
    this.mlModulesDbName = mlModulesDbName;
  }



  public DatabaseClient createClient(String username, String password, String database) {
    DatabaseClient databaseClient = null;

    if (getMlUseSsl() !=null && getMlUseSsl() == true) {

      DatabaseClientFactory.SecurityContext dbSecurityContext = new DatabaseClientFactory.BasicAuthContext(username,
        password);

      dbSecurityContext.withSSLContext(
        SimpleX509TrustManager.newSSLContext(),
        new SimpleX509TrustManager());

      dbSecurityContext
        .withSSLHostnameVerifier(com.marklogic.client.DatabaseClientFactory.SSLHostnameVerifier.ANY);

      if (database == null) {
        databaseClient = DatabaseClientFactory.newClient(getMlHost(),
          getMlStagingPort(), dbSecurityContext);
      }
      else {
        databaseClient = DatabaseClientFactory.newClient(getMlHost(),
          getMlStagingPort(), database, dbSecurityContext);
      }

    }
    else {

      if (database == null) {
        databaseClient=DatabaseClientFactory.newClient(
          getMlHost(),
          getMlStagingPort(),
          new DatabaseClientFactory.DigestAuthContext(username,password));
      }
      else {
        databaseClient=DatabaseClientFactory.newClient(
          getMlHost(),
          getMlStagingPort(),
          database,
          new DatabaseClientFactory.DigestAuthContext(username,password));
      }


    }

    return databaseClient;
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

  public DatabaseClient createModulesDbClient(String username, String password) {
    return createClient(username,password, getMlModulesDbName());
  }
}
