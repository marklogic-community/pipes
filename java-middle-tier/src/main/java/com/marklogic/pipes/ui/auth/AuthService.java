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

    return isAuthorized();
  }

  private void setModulesDbClient(DatabaseClient modulesDbClient) {
    this.modulesDbClient = modulesDbClient;
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
