/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.client.RestTemplate;

import javax.validation.Valid;
import javax.validation.constraints.Min;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.NotNull;

@Configuration
@ConfigurationProperties
@Validated
public class ClientConfig {

  final String message="Can't be blank. Set in application.properties or on the command line.";
  final String intMessage="You have to set value in application.properties or on the command line.";

  @NotBlank(message = message)
  private String mlHost;

  @NotBlank(message = message)
  private String mlUsername;

  @NotBlank(message = message)
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

  /**
   * @return the mlStagingPort
   */
  public int getMlStagingPort() { return mlStagingPort; }

  public String getCustomModulesRoot() { return customModulesRoot; }

  public String getMlModulesDatabase() { return mlModulesDatabase; }

  public int getMlAppServicesPort() { return mlAppServicesPort; }

  public int getMlAdminPort() { return mlAdminPort; }

  public int getMlManagePort() { return mlManagePort; }

  public String getMlHost() { return mlHost; }

  public String getMlDhfRoot() { return mlDhfRoot; }

  public String getMlUsername() {return mlUsername;}

  public String getMlPassword() {return mlPassword;}

  public void setMlHost(String mlHost) {
    this.mlHost = mlHost;
  }

  public void setMlUsername(@Valid String mlUsername) {
    this.mlUsername = mlUsername;
  }

  public void setMlPassword(@Valid String mlPassword) {
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
    this.mlDhfRoot = mlDhfRoot;
  }

  public void setCustomModulesRoot(String customModulesRoot) {
    this.customModulesRoot = customModulesRoot;
  }

  public void setMlModulesDatabase(String mlModulesDatabase) {
    this.mlModulesDatabase = mlModulesDatabase;
  }

  @Autowired
  Environment environment;


  @Bean
  public RestTemplate restTemplate() {

    // assign default 8081 if not specified
    String serverPort=environment.getProperty("server.port")!=null ? environment.getProperty("server.port") : "8081";
    int springPort = Integer.parseInt(serverPort);

    HttpHost host = new HttpHost(mlHost, springPort, "http");
    CloseableHttpClient client = HttpClientBuilder.create().setDefaultCredentialsProvider(provider())
        .useSystemProperties().build();
    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactoryDigestAuth(host,
        client);

    return new RestTemplate(requestFactory);
  }

  private CredentialsProvider provider() {
    CredentialsProvider provider = new BasicCredentialsProvider();
    UsernamePasswordCredentials credentials = new UsernamePasswordCredentials(getMlUsername(), getMlPassword());
    provider.setCredentials(AuthScope.ANY, credentials);
    return provider;
  }
}
