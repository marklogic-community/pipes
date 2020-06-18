/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import javax.validation.constraints.NotBlank;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.env.Environment;
import org.springframework.validation.annotation.Validated;

@Configuration
@Validated
public class ClientConfig {

  @Autowired
  Environment environment;

  private static final Logger logger = LoggerFactory.getLogger(ClientConfig.class);

  final String message = "Can't be blank. Set in application.properties or on the command line.";

  public int getContainerPort() {
    return containerPort;
  }

  public void setContainerPort(int containerPort) {
    this.containerPort = containerPort;
  }

  private int containerPort;

  @NotBlank(message = message)
  @Value("${mlDhfRoot:.}")
  private String mlDhfRoot;

  @Value("${customModulesRoot:#{null}}")
  private String customModulesRoot;

  @Value("${environmentName:#{null}}")
  private String environmentName;



  @Value("${startingGraph:#{null}}")
  private String startingGraph;

  // getters / setters

  public String getEnvironmentName() {
    return environmentName;
  }

  public void setEnvironmentName(String environmentName) {
    this.environmentName = environmentName;
  }

  public String getCustomModulesRoot() {
    return customModulesRoot;
  }

  public String getMlDhfRoot() {
    return mlDhfRoot;
  }

  public void setMlDhfRoot(String mlDhfRoot) {
    if (mlDhfRoot != mlDhfRoot.trim()) {
      logger.warn("I trimmed the value of mlDhfRoot from \"" + mlDhfRoot + "\" to \"" + mlDhfRoot.trim() + "\"");
      mlDhfRoot = mlDhfRoot.trim();
    }
    this.mlDhfRoot = mlDhfRoot;
  }

  public void setCustomModulesRoot(String customModulesRoot) {
    if (customModulesRoot != null && customModulesRoot != customModulesRoot.trim()) {
      logger.warn("I trimmed the value of customModulesRoot from \"" + customModulesRoot + "\" to \""
          + customModulesRoot.trim() + "\"");
      customModulesRoot = customModulesRoot.trim();
    }
    this.customModulesRoot = customModulesRoot;
  }

  public String getStartingGraph() {
    return startingGraph;
  }

  public void setStartingGraph(String startingGraph) {
    this.startingGraph = startingGraph;
  }
}
