/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.marklogic.appdeployer.AppConfig;
import com.marklogic.appdeployer.AppDeployer;
import com.marklogic.appdeployer.command.modules.LoadModulesCommand;
import com.marklogic.appdeployer.impl.SimpleAppDeployer;
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
 * InstallPipesBackend
 */
@Component
public class InstallPipesBackend implements ApplicationRunner {

  final String resourcesDhfRoot = "/dhf/src/main/ml-modules";
  final String destinationDhfRoot = "/src/main/ml-modules";
  final String customModulesPathPrefix = "/root/custom-modules/pipes";

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  Environment environment;

  @Override
  public void run(ApplicationArguments args) throws Exception {

    boolean deployBackend = args.containsOption("deployBackend");

//     TO-DO: check for existence of the folder

    if (deployBackend) {
      try {
        copyMlBackendModulesToDhfRoot();
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
  }

  private void copyMlBackendModulesToDhfRoot() throws IOException {
    LoggerFactory.getLogger(getClass()).info(
      String.format("Will copy MarkLogic backend modules to following DHF root: %s", clientConfig.getMlDhfRoot()));

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
        FileUtils.copyInputStreamToFile(is, dest);
      } catch (final IOException e) {
        // TODO Auto-generated catch block
//        e.printStackTrace();
//        System.out.println(e.toString());
          throw e;
      }
    }

    LoggerFactory.getLogger(getClass()).info(
      String.format("MarkLogic backend modules copied to your DHF project."));
  }

  public void deployMlBackendModulesToModulesDatabase() {
    LoggerFactory.getLogger(getClass()).info(
      String.format("Now loading Pipes modules to your DHF modules database...")
    );

    // not sure about port 8002
    // TO-DO: read port from gradle.properties (which ones?)
    ManageClient client =
      new ManageClient(new ManageConfig(clientConfig.getMlHost(),8002,clientConfig.getMlUsername(),clientConfig.getMlPassword()));

    // used for restarting ML; defaults to localhost/8001/admin/admin
    AdminManager manager =
      new AdminManager(new AdminConfig(clientConfig.getMlHost(),8001, clientConfig.getMlUsername(),clientConfig.getMlPassword()));

    // AppConfig contains all configuration about the application being deployed
    AppConfig appConfig = new AppConfig(new File(clientConfig.getMlDhfRoot()));
    appConfig.setName("data-hub");
    appConfig.setRestPort(clientConfig.getMlStagingPort());

    appConfig.setModulesDatabaseName(clientConfig.getMlModulesDatabase());

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

}
