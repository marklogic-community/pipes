/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.auth;

import com.marklogic.appdeployer.AppConfig;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.ext.SecurityContextType;
import com.marklogic.client.ext.modulesloader.ssl.SimpleX509TrustManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.SearchHandle;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StringQueryDefinition;
import com.marklogic.mgmt.ManageClient;
import com.marklogic.mgmt.ManageConfig;
import com.marklogic.mgmt.admin.AdminConfig;
import com.marklogic.mgmt.admin.AdminManager;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.File;

@Service
public class AuthService extends AbstractLoggingClass {

  @Autowired
  ClientConfig clientConfig;

  private Boolean isAuthorized=false;
  private ResourceServices service=null;

  private ManageClient manageClient;
  private AdminManager adminManager;



  private DatabaseClient databaseClient;
  private DatabaseClient modulesDbClient;

  public ManageClient getManageClient() {
    return manageClient;
  }

  public AdminManager getAdminManager() {
    return adminManager;
  }

  public AppConfig getAppConfig() {
    return appConfig;
  }

  private AppConfig appConfig;

  public void init() {
    manageClient=createManageClient();
    adminManager= createAdminManager();
    appConfig= createAppConfig();
  }

  public String getUsername() {
    return username;
  }

  public void setUsername(String username) {
    this.username = username;
  }

  private String username=null;

  public String getPassword() {
    return password;
  }

  public void setPassword(String password) {
    this.password = password;
  }

  private String password=null;


  public void setAuthorized(Boolean authorized) {
    isAuthorized = authorized;
  }
  private void setService(ResourceServices service) {
    this.service = service;
  }


  public Boolean isAuthorized() {
    return isAuthorized;
  }

  public ResourceServices getService() {
    return service;
  }

  public Boolean tryAuthorize(ClientConfig clientConfig, String username, String password) {

    DatabaseClient client=clientConfig.createClient(username,password,null);


    setAuthorized(true);

    QueryManager queryManager = client.newQueryManager();
    StringQueryDefinition stringQueryDefinition= queryManager.newStringDefinition();
    stringQueryDefinition.setCriteria("");


    boolean authorized=true;
    try {
      queryManager.search(stringQueryDefinition, new SearchHandle());
    } catch (Exception e) {
      setAuthorized(false); //failed
      e.printStackTrace();
    }


    ResourceServices service = clientConfig.getService(client);
    setService(service);
    setUsername(username);
    setPassword(password);
    setDatabaseClient(client);

    DatabaseClient modulesDbClient= clientConfig.createModulesDbClient(username,password);
    setModulesDbClient(modulesDbClient);

    init();
    return isAuthorized();
  }

  private void setModulesDbClient(DatabaseClient modulesDbClient) {
    this.modulesDbClient = modulesDbClient;
  }

  public AppConfig createAppConfig() {
    // AppConfig contains all configuration about the application being deployed
    AppConfig appConfig = new AppConfig(new File(clientConfig.getMlDhfRoot()));
    appConfig.setName("data-hub");
    appConfig.setRestPort(clientConfig.getMlStagingPort());
    appConfig.setHost(clientConfig.getMlHost());
    appConfig.setAppServicesPort(clientConfig.getMlAppServicesPort());
    appConfig.setModulesDatabaseName(clientConfig.getMlModulesDatabase());
    appConfig.setRestAdminUsername(getUsername());
    appConfig.setRestAdminPassword(getPassword());
    appConfig.setAppServicesUsername(getUsername());
    appConfig.setAppServicesPassword(getPassword());

    // hope this is enough for connecting to DHS
    if (clientConfig.getMlUseSsl()) {

      appConfig.setAppServicesSimpleSslConfig();


      DatabaseClientFactory.SecurityContext dbSecurityContext = new DatabaseClientFactory.BasicAuthContext(getUsername(),
        getPassword());

      dbSecurityContext.withSSLContext(
        SimpleX509TrustManager.newSSLContext(),
        new SimpleX509TrustManager());

      dbSecurityContext
        .withSSLHostnameVerifier(com.marklogic.client.DatabaseClientFactory.SSLHostnameVerifier.ANY);

      appConfig.setRestSecurityContextType(SecurityContextType.BASIC);
      appConfig.setAppServicesTrustManager(new SimpleX509TrustManager());
      appConfig.setAppServicesSslHostnameVerifier(com.marklogic.client.DatabaseClientFactory.SSLHostnameVerifier.ANY);


    }

    return appConfig;
  }

  public AdminManager createAdminManager() {
    // used for restarting ML; defaults to localhost/8001/admin/admin
    AdminConfig adminConfig=new AdminConfig(  clientConfig.getMlHost(),
      clientConfig.getMlAdminPort(),
      getUsername(),
      getPassword());

    // hope this is enough for connecting to DHS
    if (clientConfig.getMlUseSsl()) {
      adminConfig.setConfigureSimpleSsl(true);

      DatabaseClientFactory.SecurityContext dbSecurityContext = new DatabaseClientFactory.BasicAuthContext(getUsername(),
        getPassword());

      dbSecurityContext.withSSLContext(
        SimpleX509TrustManager.newSSLContext(),
        new SimpleX509TrustManager());

      dbSecurityContext
        .withSSLHostnameVerifier(com.marklogic.client.DatabaseClientFactory.SSLHostnameVerifier.ANY);

      adminConfig.setSslContext(dbSecurityContext.getSSLContext());
    }

    AdminManager adminManager = new AdminManager();
    adminManager.setAdminConfig(adminConfig);
    return adminManager;
  }

  public ManageClient createManageClient() {
    ManageConfig manageConfig = new ManageConfig( clientConfig.getMlHost(),
      clientConfig.getMlManagePort(),
      getUsername(),
      getPassword());

    if (clientConfig.getMlUseSsl()) {
      manageConfig.setConfigureSimpleSsl(true);

      DatabaseClientFactory.SecurityContext dbSecurityContext = new DatabaseClientFactory.BasicAuthContext(getUsername(),
        getPassword());

      dbSecurityContext.withSSLContext(
        SimpleX509TrustManager.newSSLContext(),
        new SimpleX509TrustManager());

      dbSecurityContext
        .withSSLHostnameVerifier(com.marklogic.client.DatabaseClientFactory.SSLHostnameVerifier.ANY);

      manageConfig.setSecuritySslContext(dbSecurityContext.getSSLContext());
    }

    ManageClient manageClient = new ManageClient();
    manageClient.setManageConfig(manageConfig);
    return manageClient;
  }

  public DatabaseClient getDatabaseClient() {
    return databaseClient;
  }

  public void setDatabaseClient(DatabaseClient databaseClient) {
    this.databaseClient = databaseClient;
  }

  public DatabaseClient getModulesDatabaseClient() {
    return modulesDbClient;
  }
}
