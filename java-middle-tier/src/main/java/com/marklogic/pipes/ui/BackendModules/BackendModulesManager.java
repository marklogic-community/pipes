package com.marklogic.pipes.ui.BackendModules;

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
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.Application;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.regex.Pattern;


@Repository
public class BackendModulesManager {
  private static final Logger logger = LoggerFactory.getLogger(BackendModulesManager.class);

  @Autowired
  ClientConfig clientConfig;

  final String resourcesDhfRoot = "/dhf/src/main/ml-modules";
  final String destinationDhfRoot = "/src/main/ml-modules";
  final String customModulesPathPrefix = "/root/custom-modules/pipes";

  private enum fileOperation {
    Copy,
    Remove
  }

  public void copyAndDeployPipesBackend() throws Exception {

    logger.info(
      String.format("Will copy MarkLogic backend modules to following DHF root: %s", clientConfig.getMlDhfRoot()));
    try {
      manageMarkLogicBackendModules(fileOperation.Copy);
    }
    catch (Exception e) {
      logger.error(
        String.format("Aborting Pipes start-up - failed to copy modules: "+e.getMessage()),e);
      throw e;
    }

    try {

      logger.info(
        String.format("Now loading Pipes modules to your DHF modules database...")
      );
      deployMlBackendModulesToModulesDatabase(".*/pipes/.*.sjs|.*vppBackendServices.sjs");
      logger.info(
        String.format("MarkLogic backend modules have been loaded."));

    }
    catch (com.marklogic.client.MarkLogicIOException e) {
      logger.error(
        String.format("Hm, failed to connect to your database: "+clientConfig.getMlHost()+":"+clientConfig.getMlStagingPort()+
          ". Are you sure your MarkLogic server is running at that address? Aborting Pipes start."),e);
      System.exit(1);
    }
    catch (Exception e) {
      logger.error(
        String.format("Aborting Pipes start-up - Failed to load modules: "+e.getMessage()),e);
      throw e;
    }

    logger.info(
      String.format("Modules successfully copied and deployed."));

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
//        customModulesPathPrefix+"/user.sjs",
        "/services/vppBackendServices.sjs"
      ));




    Boolean includeCustomUserModule=false;
    final String CUSTOMSJSNAME="user.sjs";
    final String CUSTOMSJSPATH=clientConfig.getCustomModulesRoot()+File.separator+CUSTOMSJSNAME;


    if(clientConfig.getCustomModulesRoot()!=null) {


      if( (new File(CUSTOMSJSPATH)).exists() ) {
        includeCustomUserModule = true;
      }
      else {
        logger.error(
          String.format("Looks like your custom module \""+CUSTOMSJSPATH+"\" is missing. Check your application.properties. Pipes aborting."));
        System.exit(1);
      }
    }



    for (final String filePath : filePaths) {
      final InputStream is = Application.class.getResourceAsStream(resourcesDhfRoot + filePath);
      final File dest = new File(clientConfig.getMlDhfRoot() + destinationDhfRoot + filePath);

      try {
        if (operation== fileOperation.Copy) {
          FileUtils.copyInputStreamToFile(is, dest);
        }
        else if (operation== fileOperation.Remove) {
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

    // do the same for the custom user module
    if (includeCustomUserModule) {
      //final InputStream is = Application.class.getResourceAsStream(resourcesDhfRoot + filePath);
      final File source = new File(CUSTOMSJSPATH);
      final File dest = new File(clientConfig.getMlDhfRoot() + destinationDhfRoot + customModulesPathPrefix + File.separator +CUSTOMSJSNAME);
      try {
        if (operation== fileOperation.Copy) {
          FileUtils.copyFile(source,dest, false);

        }
        else if (operation== fileOperation.Remove) {
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
    if (operation== fileOperation.Remove) {
      String folderPath=clientConfig.getMlDhfRoot() + destinationDhfRoot + customModulesPathPrefix;
      FileUtils.deleteDirectory(new File(folderPath));

      logger.info(
        String.format("Deleted folder "+folderPath));
    }

    else if (operation== fileOperation.Copy) {
      logger.info(
        String.format("MarkLogic backend modules copied to your DHF project."));
    }

  }

  public void deployMlBackendModulesToModulesDatabase(String patternString) {
    // ".*/pipes/.*.sjs|.*vppBackendServices.sjs"
    Pattern pattern=Pattern.compile(patternString);

    ManageClient client = getManageClient();
    AdminManager manager = getAdminManager();
    AppConfig appConfig = getAppConfig();

    AppDeployer appDeployer = new SimpleAppDeployer(client, manager, new LoadModulesCommand());

    // Setting batch size just to verify that nothing blows up when doing so
    appConfig.setModulesLoaderBatchSize(1);

    // push /pipes/ modules
    appConfig.setModuleFilenamesIncludePattern(pattern);
    // Call it
    appDeployer.deploy(appConfig);



  }

  private AppConfig getAppConfig() {
    // AppConfig contains all configuration about the application being deployed
    AppConfig appConfig = new AppConfig(new File(clientConfig.getMlDhfRoot()));
    appConfig.setName("data-hub");
    appConfig.setRestPort(clientConfig.getMlStagingPort());
    appConfig.setHost(clientConfig.getMlHost());
    appConfig.setAppServicesPort(clientConfig.getMlAppServicesPort());
    appConfig.setModulesDatabaseName(clientConfig.getMlModulesDatabase());
    return appConfig;
  }

  private AdminManager getAdminManager() {
    // used for restarting ML; defaults to localhost/8001/admin/admin
    return new AdminManager(new AdminConfig(clientConfig.getMlHost(),clientConfig.getMlAdminPort(), clientConfig.getMlUsername(),clientConfig.getMlPassword()));
  }

  private ManageClient getManageClient() {
    // not sure about port 8002
    // TO-DO: read port from gradle.properties (which ones?)
    return new ManageClient(new ManageConfig(clientConfig.getMlHost(),clientConfig.getMlManagePort(),clientConfig.getMlUsername(),clientConfig.getMlPassword()));
  }

  public void unloadPipesModules() throws Exception {

    logger.info(
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

    logger.info(
      String.format("MarkLogic backend modules have been deleted."));

    logger.info(
      String.format("Now deleting Pipes REST extension from your DHF modules database...")
    );

    // will use MarkLogic Client API for this
    // so need a DatabaseClient instance
    DatabaseClient dbClient = DatabaseClientFactory.newClient(
      clientConfig.getMlHost(), clientConfig.getMlStagingPort(),
      new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));

    ResourceExtensionsManager resourceExtensionsManager = dbClient.newServerConfigManager().newResourceExtensionsManager();
    resourceExtensionsManager.deleteServices("vppBackendServices");


    logger.info(
      String.format("Deleted Pipes REST extension from your DHF modules database...")
    );

    manageMarkLogicBackendModules(fileOperation.Remove);

    logger.info(
      String.format("Pipes deleted.")
    );


  }

}
