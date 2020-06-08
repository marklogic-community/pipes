/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.auth;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.FailedRequestException;
import com.marklogic.client.MarkLogicIOException;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.SearchHandle;
import com.marklogic.client.query.QueryManager;
import com.marklogic.client.query.StringQueryDefinition;
import com.marklogic.hub.DatabaseKind;
import com.marklogic.hub.HubProject;
import com.marklogic.hub.impl.HubConfigImpl;
import com.marklogic.mgmt.ManageClient;
import com.marklogic.mgmt.admin.AdminManager;
import com.marklogic.pipes.ui.BackendModules.BackendModulesManager;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.config.PipesResourceManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuthService extends AbstractLoggingClass {

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  BackendModulesManager backendModulesManager;

  @Autowired
  HubConfigImpl hubConfig;

  @Autowired
  HubProject hubProject;


  private Boolean isAuthorized=false;
  private ResourceServices service=null;

  public String getEnvironmentName() {
    return environmentName;
  }

  private String environmentName=null;

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

    String projectDir = clientConfig.getMlDhfRoot();

    // Instantiate a HubConfig with DHF's default set of properties, and then start customizing it
//    HubConfig hubConfig = new HubConfigImpl(hubProject,"local");

    hubConfig.createProject(projectDir);
    hubConfig.refreshProject();

   // hubConfig.resetAppConfigs();
    environmentName = clientConfig.getEnvironmentName();
    if (environmentName == null || environmentName.isEmpty()) {
      environmentName = "local";
    }
    hubConfig.withPropertiesFromEnvironment(environmentName);
    hubConfig.setMlUsername(username);
    hubConfig.setMlPassword(password);

    hubConfig.resetHubConfigs();
    ((HubConfigImpl)hubConfig).setHost(null);
    hubConfig.refreshProject();



    DatabaseClient client=hubConfig.newStagingClient();

    setAuthorized(true);

    QueryManager queryManager = client.newQueryManager();
    StringQueryDefinition stringQueryDefinition= queryManager.newStringDefinition().withCriteria("");

    try {
      queryManager.search(stringQueryDefinition, new SearchHandle());

    }
    catch (MarkLogicIOException markLogicIOException) {
      logger.error("Error connecting to MarkLogic. Check your gradle properties.");
      logger.error(markLogicIOException.getMessage());
      setAuthorized(false);
    }
    catch (FailedRequestException failedRequestException) {
      logger.error("Authentication failed.");
      setAuthorized(false);
    }
    catch (Exception e) {
      setAuthorized(false); //failed
      logger.error("Unexpected error happened");
      e.printStackTrace();
    }

    if (isAuthorized()) {


      ResourceServices service = this.getService(client);
      setService(service);
      setUsername(username);
      setPassword(password);
      setDatabaseClient(client);

      DatabaseClient modulesDbClient= createModulesDbClient(username,password);
      setModulesDbClient(modulesDbClient);

      // check modules version and deploy
      backendModulesManager.checkModulesVersion(this);
    }
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

  private DatabaseClient createModulesDbClient(String username, String password) {
    return hubConfig.newModulesDbClient();
  }

  private ResourceServices getService(DatabaseClient client) {
    PipesResourceManager pipesResourceManager=new PipesResourceManager(client);
    return pipesResourceManager.getServices();
  }

}
