/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.BackendModules;

import com.marklogic.pipes.ui.auth.AbstractLoggingClass;
import com.marklogic.pipes.ui.auth.AuthService;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.version.PipesVersionService;
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
  PipesVersionService versionService;

  @Override
  public void run(ApplicationArguments args) throws Exception {

    // sanity check: does the DHF root folder exist?
    File f = new File(clientConfig.getMlDhfRoot());
    if (!f.exists() || !f.isDirectory()) {
      logger.error(
        String.format("It looks like this folder doesn't exist: "+ clientConfig.getMlDhfRoot()));
      logger.info(
        String.format("Pipes will not start, check your application.properties"));
      System.exit(1);
    }

    // check if gradle.properties exist
    String gradlePropertiesFileNameWithAbsolutePath=f.getAbsolutePath()+File.separator+"gradle.properties";
    File gradleProperies=new File(gradlePropertiesFileNameWithAbsolutePath);


    if (!gradleProperies.exists() || !gradleProperies.isFile()) {
      logger.error(
        String.format("It looks like this file doesn't exist: %s", gradlePropertiesFileNameWithAbsolutePath));
      logger.info(
        String.format("Pipes will not start, it requires gradle.properties to be present here: %s",f.getAbsolutePath()));
      System.exit(1);
    }


    logger.info(
      String.format("Pipes running on port: "+ environment.getProperty("local.server.port")));




  }



}
