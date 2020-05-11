/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.auth.AbstractLoggingClass;
import com.marklogic.pipes.ui.auth.AuthService;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.version.Service;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.io.File;


/**
 * BackendModulesManager
 */
@Component
public class BackendModulesAppRunner extends AbstractLoggingClass implements ApplicationRunner {

  @Autowired
  BackendModulesManager backendModulesManager;

  @Autowired
  Environment environment;

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  AuthService authService;

  @Autowired
  Service versionService;

  @Override
  public void run(ApplicationArguments args) throws Exception {




    boolean deployBackend = args.containsOption("deployBackend");
    boolean undeployBackend = args.containsOption("undeployBackend");

    final boolean credentialsRequired=deployBackend || undeployBackend;
    final boolean credentialsSupplied= (clientConfig.getMlUsername()!=null) && (clientConfig.getMlPassword()!=null);

    // sanity check: does the DHF root folder exist?
    File f = new File(clientConfig.getMlDhfRoot());
    if (!f.exists() || !f.isDirectory()) {
      logger.error(
        String.format("It looks like this folder doesn't exist: "+ clientConfig.getMlDhfRoot()));
      logger.info(
        String.format("Pipes will not start, check your application.properties"));
      System.exit(1);
    }

    if (credentialsRequired && !credentialsSupplied) {
      logger.error("Credentials are required to deploy or undeploy Pipes modules. No credentials suppplied, Pipes will not start.");
      System.exit(1);
    }

    // if credentials are supplied, let's log in the user
    if (credentialsSupplied) {
      if (!authService.tryAuthorize(clientConfig, clientConfig.getMlUsername(), clientConfig.getMlPassword())){
        logger.error("Wrong credentials provided and can't log in user " +
          "or MarkLogic not reachable. Pipes will not start.");
        System.exit(1);
      }
    }

    // if command line param "teardown" has been specified and it's true,
    // the app will delete backend modules and terminate
    if (undeployBackend) {
      backendModulesManager.unloadPipesModules();

      logger.info(
        String.format("Shutting down Pipes...")
      );
      logger.info(
        String.format("So Long, and Thanks for All the Fish.")
      );
      System.exit(0);
    }

    if (deployBackend) {
      backendModulesManager.copyAndDeployPipesBackend();
    }

    // only check this if user authenticated
    if (!deployBackend && authService.getService()!=null) {

      // since the user is not running with deployBackend=true,
      // let's check if the user has backend installed and
      // if the versions in front-end (java) and backe-end (MarkLogic) match

      // get the version from backend
      ResourceServices pipesBackendService= authService.getService();
      StringHandle output = new StringHandle();

      RequestParameters params = new RequestParameters();
      params.add("action","GetVersion");

      output=pipesBackendService.get(params,new StringHandle().withFormat(Format.TEXT));


      // get the version info from front end
      String javaVersionInfo=versionService.get();

      // compare and stop the service if not working

      CharSequence version=null;
      CharSequence build=null;


      if (output.toString() !=null) {
        JSONObject outputJson=new JSONObject(output.toString());
         version=outputJson.getString("Version");
         build=outputJson.getString("Build");
      }
      else {
        version="Not avaiable";
          build="Not avaiable";
      }


      if (!javaVersionInfo.contains(version) || !javaVersionInfo.contains(build)) {
        logger.error(
          String.format("\nVersion mismatch between Pipes backend modules (Pipes version: %s, Build: %s) and \nthe front end (%s). \n" +
            "Did you forget to deploy lastest version of modules (--deployBackend=true)? \n" +
            "Pipes will not start.",version,build,javaVersionInfo));
          System.exit(1);
      }


    }

    logger.info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));


    // version information
    System.out.println("--------------------\n"+ versionService.get()+"--------------------");

  }



}
