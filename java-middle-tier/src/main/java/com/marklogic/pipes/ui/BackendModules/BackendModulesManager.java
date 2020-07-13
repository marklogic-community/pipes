/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.FailedRequestException;
import com.marklogic.client.ext.modulesloader.ModulesFinder;
import com.marklogic.client.ext.modulesloader.impl.AssetFileLoader;
import com.marklogic.client.ext.modulesloader.impl.DefaultModulesFinder;
import com.marklogic.client.ext.modulesloader.impl.DefaultModulesLoader;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.hub.DatabaseKind;
import com.marklogic.hub.impl.HubConfigImpl;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.Application;
import com.marklogic.pipes.ui.auth.AuthService;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.version.PipesVersionService;
import org.apache.commons.io.FileUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.regex.Pattern;


@Repository
public class BackendModulesManager {
  private static final Logger logger = LoggerFactory.getLogger(BackendModulesManager.class);

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  HubConfigImpl hubConfig;

  @Autowired
  PipesVersionService versionService;

  final String resourcesDhfRoot = "/dhf/src/main/ml-modules";
  final String destinationDhfRoot = "/src/main/ml-modules";
  final String customModulesPathPrefix = "/root/custom-modules/pipes";

  private enum fileOperation {
    Copy,
    Remove
  }

  public void checkModulesVersion(AuthService authService) {
    // since the user is not running with deployBackend=true,
    // let's check if the user has backend installed and
    // if the versions in front-end (java) and backe-end (MarkLogic) match

    // get the version from backend
    ResourceServices pipesBackendService= authService.getService();
    StringHandle output = new StringHandle();

    RequestParameters params = new RequestParameters();
    params.add("action","GetVersion");

    try {
      output = pipesBackendService.get(params, new StringHandle().withFormat(Format.TEXT));
    }
    catch (FailedRequestException failedRequestException){
      logger.info("Pipes REST extension not installed");
      }
    catch (Exception e) {
      logger.error("Unknown exception occurred");
      logger.error(e.toString());
    }


    // get the version info from front end
    String javaVersionInfo= null;
      javaVersionInfo = versionService.get();


    // compare and stop the service if not working

    CharSequence version=null;
    CharSequence build=null;


    if (output.toString() !=null) {
      JSONObject outputJson= null;
      try {
        outputJson = new JSONObject(output.toString());
      } catch (IOException e) {
        e.printStackTrace();
      }
      version= outputJson!=null ? outputJson.getString("Version") : "Error reading version";
      build=outputJson!=null ? outputJson.getString("Build") : "Error reading build";
    }
    else {
      version="Not avaiable";
      build="Not avaiable";
    }

    // output version information
      System.out.println("--------------------\n"+ javaVersionInfo+"--------------------");

    // it will deploy modules if versions mismatch
    // and if using custom blocks
    if (!javaVersionInfo.contains(version) || !javaVersionInfo.contains(build) || clientConfig.getCustomModulesRoot()!=null) {

      logger.info("{} missmatch with Pipes backend modules, Version: {} | Build: {}",
        javaVersionInfo, version, build);

      try {
        copyModules();
      } catch (Exception e) {
        e.printStackTrace();
        logger.error("Failed to copy modules, aborting");
        System.exit(1);
      }
      deployModules(authService);
    }

  }

  private void copyModules() throws Exception {
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

  }

  private void deployModules(AuthService authService) {
    try {

      logger.info(
        String.format("Now loading Pipes modules to your DHF modules database...")
      );
      deployMlBackendModulesToModulesDatabase(".*/pipes/.*.sjs|.*vppBackendServices.sjs", authService);
      logger.info(
        String.format("MarkLogic backend modules have been loaded."));

    }
    catch (com.marklogic.client.MarkLogicIOException e) {
      logger.error(
        String.format("Hm, failed to connect to your database %s on %s. " +
          "Are you sure your MarkLogic server is running at that address? Aborting Pipes start."),
        hubConfig.getDbName(DatabaseKind.STAGING),
        hubConfig.getHost());
      logger.error(e.getMessage());
      System.exit(1);
    }
    catch (Exception e) {
      logger.error(
        String.format("Aborting Pipes start-up - Failed to load modules: "+e.getMessage()),e);
      throw e;
    }
    finally  {
      try {
        FileUtils.deleteDirectory(new File(clientConfig.getMlDhfRoot()+File.separator+".pipes"));
      } catch (IOException ioException) {
        logger.error("Failed to delete folder "+clientConfig.getMlDhfRoot()+File.separator+".pipes");
        ioException.printStackTrace();
      }
    }
  }

  private void manageMarkLogicBackendModules(fileOperation operation) throws Exception {


    ArrayList<String> filePaths = new ArrayList<String>(
      Arrays.asList(
        customModulesPathPrefix+"/core.sjs",
        customModulesPathPrefix+"/coreFunctions.sjs",
        customModulesPathPrefix+"/compiler.sjs",
        customModulesPathPrefix+"/compilerFlowControlGraph.sjs",
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

    if (!includeCustomUserModule) {
      filePaths.add( customModulesPathPrefix+"/user.sjs");
    }
    // do the same for the custom user module
    else {
      //final InputStream is = Application.class.getResourceAsStream(resourcesDhfRoot + filePath);
      final File source = new File(CUSTOMSJSPATH);

      final File dest = new File(clientConfig.getMlDhfRoot() + File.separator+".pipes" + customModulesPathPrefix + File.separator +CUSTOMSJSNAME);
      try {
        if (operation== fileOperation.Copy) {
          //FileUtils.copyFile(source,dest, false);
          Files.createDirectories(Paths.get(clientConfig.getMlDhfRoot() + File.separator +".pipes" + customModulesPathPrefix));
          Files.copy(source.toPath(), dest.toPath());
          logger.info("Copied "+source.getAbsolutePath()+" to "+dest.getAbsolutePath());

        }
        else if (operation== fileOperation.Remove) {
          dest.delete();
          logger.info("Deleted "+dest.getAbsolutePath());
        }
        else {
          throw new Exception("Unsupported operation: "+operation);
        }

      } catch (final IOException e) {
        // TODO Auto-generated catch block
        throw e;
      }
    }


    for (final String filePath : filePaths) {
      final InputStream is = Application.class.getResourceAsStream(resourcesDhfRoot + filePath);
      final File dest = new File(clientConfig.getMlDhfRoot() +  File.separator+".pipes" + File.separator + filePath);

      try {
        if (operation== fileOperation.Copy) {
          FileUtils.copyInputStreamToFile(is, dest);
          logger.info("Copied "+ filePath +" to "+dest.getAbsolutePath());
        }
        else if (operation== fileOperation.Remove) {
          dest.delete();
          logger.info("Deleted "+dest.getAbsolutePath());
        }
        else {
          throw new Exception("Unsupported operation: "+operation);
        }

      } catch (final IOException e) {
        // TODO Auto-generated catch block

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

  public void deployMlBackendModulesToModulesDatabase(String patternString, AuthService authService) {
    // ".*/pipes/.*.sjs|.*vppBackendServices.sjs"
    Pattern pattern=Pattern.compile(patternString);
    DatabaseClient client = authService.getModulesDatabaseClient();

    AssetFileLoader assetFileLoader = new AssetFileLoader(client); // Uses the REST API to load asset modules
    assetFileLoader.setCollections("pipes-modules");
    DefaultModulesLoader modulesLoader = new DefaultModulesLoader(assetFileLoader);

    modulesLoader.setIncludeFilenamePattern(pattern);

    String path=clientConfig.getMlDhfRoot() + File.separator+".pipes";
    ModulesFinder modulesFinder = new DefaultModulesFinder(); // Allows for adjusting where modules are stored on a filesystem

    modulesLoader.loadModules(path, modulesFinder, client);
  }

}
