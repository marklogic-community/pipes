/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

import com.marklogic.pipes.ui.config.ClientConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
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
public class BackendModulesAppRunner implements ApplicationRunner {

  private static final Logger logger = LoggerFactory.getLogger(BackendModulesAppRunner.class);

  @Autowired
  BackendModulesManager backendModulesManager;


  @Autowired
  Environment environment;

  @Autowired
  ClientConfig clientConfig;

  @Override
  public void run(ApplicationArguments args) throws Exception {

    boolean deployBackend = args.containsOption("deployBackend");
    boolean undeployBackend = args.containsOption("undeployBackend");

    // sanity check: does the DHF root folder exist?
    File f = new File(clientConfig.getMlDhfRoot());
    if (!f.exists() || !f.isDirectory()) {
      logger.error(
        String.format("It looks like this folder doesn't exist: "+ clientConfig.getMlDhfRoot()));
      logger.info(
        String.format("Pipes will not start, check your application.properties"));
      System.exit(1);
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

    logger.info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));
  }



}
