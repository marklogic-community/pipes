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
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StringQueryDefinition;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.mgmt.ManageClient;
import com.marklogic.mgmt.ManageConfig;
import com.marklogic.mgmt.admin.AdminConfig;
import com.marklogic.mgmt.admin.AdminManager;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.apache.catalina.authenticator.jaspic.SimpleServerAuthContext;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import javax.net.ssl.SSLContext;
import java.io.File;

@Service
public class AuthService extends AbstractLoggingClass {

  @Autowired
  ClientConfig clientConfig;

  private Boolean isAuthorized=false;
  private ResourceServices service=null;

  private ManageClient manageClient;
  private AdminManager adminManager;

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

    DatabaseClient client=clientConfig.client(username,password);


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

    init();
    return isAuthorized();
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
    }

    return new AdminManager(new AdminConfig(
      clientConfig.getMlHost(),
      clientConfig.getMlAdminPort(),
      getUsername(),
      getPassword()));
  }

  public ManageClient createManageClient() {
    ManageConfig manageConfig = new ManageConfig( clientConfig.getMlHost(),
      clientConfig.getMlManagePort(),
      getUsername(),
      getPassword());

    if (clientConfig.getMlUseSsl()) {
      manageConfig.setConfigureSimpleSsl(true);
    }
    return new ManageClient(manageConfig);
  }

}
