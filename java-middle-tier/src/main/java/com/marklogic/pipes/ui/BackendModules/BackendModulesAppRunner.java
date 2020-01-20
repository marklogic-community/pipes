/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;


/**
 * BackendModulesManager
 */
@Component
public class BackendModulesAppRunner implements ApplicationRunner {

  @Autowired
  BackendModulesManager backendModulesManager;


  @Autowired
  Environment environment;


  @Override
  public void run(ApplicationArguments args) throws Exception {

    boolean deployBackend = args.containsOption("deployBackend");
    boolean undeployBackend = args.containsOption("undeployBackend");

    // if command line param "teardown" has been specified and it's true,
    // the app will delete backend modules and terminate
    if (undeployBackend) {
      backendModulesManager.unloadPipesModules();

      LoggerFactory.getLogger(getClass()).info(
        String.format("Shutting down Pipes...")
      );
      LoggerFactory.getLogger(getClass()).info(
        String.format("So Long, and Thanks for All the Fish.")
      );
      System.exit(0);
    }

    if (deployBackend) {
      backendModulesManager.copyAndDeployPipesBackend();
    }

    LoggerFactory.getLogger(getClass()).info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));
  }



}
