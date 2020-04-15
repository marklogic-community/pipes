/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

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
  Service serviceProvider;

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
        logger.error("Wrong credentials provided, can't log in user. Pipes will not start.");
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

    System.out.println(serviceProvider.get());
    System.out.println("blablah");
    logger.info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));
  }



}
