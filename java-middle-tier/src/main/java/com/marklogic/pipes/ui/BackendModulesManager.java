/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.marklogic.appdeployer.AppConfig;
import com.marklogic.appdeployer.AppDeployer;
import com.marklogic.appdeployer.command.modules.DeleteModulesCommand;
import com.marklogic.appdeployer.command.modules.LoadModulesCommand;
import com.marklogic.appdeployer.impl.SimpleAppDeployer;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.admin.ResourceExtensionsManager;
import com.marklogic.mgmt.ManageClient;

import com.marklogic.mgmt.ManageConfig;
import com.marklogic.mgmt.admin.AdminConfig;
import com.marklogic.mgmt.admin.AdminManager;
import org.apache.commons.io.FileUtils;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.regex.Pattern;


/**
 * BackendModulesManager
 */
@Component
public class BackendModulesManager implements ApplicationRunner {

  final String resourcesDhfRoot = "/dhf/src/main/ml-modules";
  final String destinationDhfRoot = "/src/main/ml-modules";
  final String customModulesPathPrefix = "/root/custom-modules/pipes";

  private enum fileOperation {
    Copy,
    Remove
  }

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  Environment environment;

  @Override
  public void run(ApplicationArguments args) throws Exception {

    boolean deployBackend = args.containsOption("deployBackend");
    boolean undeployBackend = args.containsOption("undeployBackend");

    // if command line param "teardown" has been specified and it's true,
    // the app will delete backend modules and terminate
    if (undeployBackend) {
      unloadPipesModules();

      LoggerFactory.getLogger(getClass()).info(
        String.format("Shutting down Pipes...")
      );
      LoggerFactory.getLogger(getClass()).info(
        String.format("So Long, and Thanks for All the Fish.")
      );
      System.exit(0);
    }

    if (deployBackend) {
      copyAndDeployPipesBackend();
    }
  }

  private void copyAndDeployPipesBackend() throws Exception {

    LoggerFactory.getLogger(getClass()).info(
      String.format("Will copy MarkLogic backend modules to following DHF root: %s", clientConfig.getMlDhfRoot()));
    try {
      manageMarkLogicBackendModules(fileOperation.Copy);
    }
    catch (Exception e) {
      LoggerFactory.getLogger(getClass()).error(
        String.format("Aborting Pipes start-up - failed to copy modules: "+e.getMessage()));
      throw e;
    }

    try {
      deployMlBackendModulesToModulesDatabase();
    }
    catch (Exception e) {
      LoggerFactory.getLogger(getClass()).error(
        String.format("Aborting Pipes start-up - Failed to load modules: "+e.getMessage()));
      throw e;
    }

    LoggerFactory.getLogger(getClass()).info(
      String.format("Modules successfully copied and deployed."));
    LoggerFactory.getLogger(getClass()).info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));
  }

  private void manageMarkLogicBackendModules(fileOperation operation) throws Exception {


    ArrayList<String> filePaths = new ArrayList<String>(
      Arrays.asList(
        customModulesPathPrefix+"/core.sjs",
        customModulesPathPrefix+"/entity-services-lib-vpp.sjs",
        customModulesPathPrefix+"/google-libphonenumber.sjs",
        customModulesPathPrefix+"/graphHelper.sjs",
        customModulesPathPrefix+"/litegraph.sjs",
        customModulesPathPrefix+"/moment-with-locales.min.sjs",
        customModulesPathPrefix+"/user.sjs",
        "/services/vppBackendServices.sjs"
      ));


    for (final String filePath : filePaths) {
      final InputStream is = Proxy.class.getResourceAsStream(resourcesDhfRoot + filePath);
      final File dest = new File(clientConfig.getMlDhfRoot() + destinationDhfRoot + filePath);

      try {
        if (operation==fileOperation.Copy) {
          FileUtils.copyInputStreamToFile(is, dest);
        }
        else if (operation==fileOperation.Remove) {
          dest.delete();
        }
        else {
          throw new Exception("Unsupported operation: "+operation);
        }

      } catch (final IOException e) {
        // TODO Auto-generated catch block
//        e.printStackTrace();
//        System.out.println(e.toString());
          throw e;
      }
    }

    // also delete the pipes folder
    if (operation==fileOperation.Remove) {
      String folderPath=clientConfig.getMlDhfRoot() + destinationDhfRoot + customModulesPathPrefix;
      FileUtils.deleteDirectory(new File(folderPath));

      LoggerFactory.getLogger(getClass()).info(
        String.format("Deleted folder "+folderPath));
    }

    else if (operation==fileOperation.Copy) {
      LoggerFactory.getLogger(getClass()).info(
        String.format("MarkLogic backend modules copied to your DHF project."));
    }

  }

  private void deployMlBackendModulesToModulesDatabase() {
    LoggerFactory.getLogger(getClass()).info(
      String.format("Now loading Pipes modules to your DHF modules database...")
    );
    ManageClient client = getManageClient();
    AdminManager manager = getAdminManager();
    AppConfig appConfig = getAppConfig();

    AppDeployer appDeployer = new SimpleAppDeployer(client, manager, new LoadModulesCommand());

    // Setting batch size just to verify that nothing blows up when doing so
    appConfig.setModulesLoaderBatchSize(1);

    // push /pipes/ modules
    appConfig.setModuleFilenamesIncludePattern(Pattern.compile(".*/pipes/.*.sjs|.*vppBackendServices.sjs"));
    // Call it
    appDeployer.deploy(appConfig);

    LoggerFactory.getLogger(getClass()).info(
      String.format("MarkLogic backend modules have been loaded."));

  }

  private AppConfig getAppConfig() {
    // AppConfig contains all configuration about the application being deployed
    AppConfig appConfig = new AppConfig(new File(clientConfig.getMlDhfRoot()));
    appConfig.setName("data-hub");
    appConfig.setRestPort(clientConfig.getMlStagingPort());
    appConfig.setHost(clientConfig.getMlHost());

    appConfig.setModulesDatabaseName(clientConfig.getMlModulesDatabase());
    return appConfig;
  }

  private AdminManager getAdminManager() {
    // used for restarting ML; defaults to localhost/8001/admin/admin
    return new AdminManager(new AdminConfig(clientConfig.getMlHost(),8001, clientConfig.getMlUsername(),clientConfig.getMlPassword()));
  }

  private ManageClient getManageClient() {
    // not sure about port 8002
    // TO-DO: read port from gradle.properties (which ones?)
    return new ManageClient(new ManageConfig(clientConfig.getMlHost(),8002,clientConfig.getMlUsername(),clientConfig.getMlPassword()));
  }

  private void unloadPipesModules() throws Exception {

    LoggerFactory.getLogger(getClass()).info(
      String.format("Now deleting Pipes modules from your DHF modules database...")
    );

    ManageClient client = getManageClient();
    AdminManager manager = getAdminManager();
    AppConfig appConfig = getAppConfig();

    // will use the DeleteModulesCommand
    AppDeployer appDeployer = new SimpleAppDeployer(client, manager, new DeleteModulesCommand("*/pipes/*.sjs"));

    // Setting batch size just to verify that nothing blows up when doing so
    appConfig.setModulesLoaderBatchSize(1);


    appDeployer.deploy(appConfig);

    LoggerFactory.getLogger(getClass()).info(
      String.format("MarkLogic backend modules have been deleted."));

    LoggerFactory.getLogger(getClass()).info(
      String.format("Now deleting Pipes REST extension from your DHF modules database...")
    );

    // will use MarkLogic Client API for this
    // so need a DatabaseClient instance
    DatabaseClient dbClient = DatabaseClientFactory.newClient(
      clientConfig.getMlHost(), clientConfig.getMlStagingPort(),
      new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));

      ResourceExtensionsManager resourceExtensionsManager = dbClient.newServerConfigManager().newResourceExtensionsManager();
      resourceExtensionsManager.deleteServices("vppBackendServices");


    LoggerFactory.getLogger(getClass()).info(
      String.format("Deleted Pipes REST extension from your DHF modules database...")
    );

    manageMarkLogicBackendModules(fileOperation.Remove);

    LoggerFactory.getLogger(getClass()).info(
      String.format("Pipes deleted.")
    );


  }


}
