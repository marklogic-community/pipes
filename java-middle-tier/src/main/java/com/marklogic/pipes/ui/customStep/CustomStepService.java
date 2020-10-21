/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.node.TextNode;
import com.marklogic.hub.StepDefinitionManager;
import com.marklogic.hub.error.DataHubProjectException;
import com.marklogic.hub.impl.StepDefinitionManagerImpl;
import com.marklogic.hub.step.StepDefinition;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.BackendModules.BackendModulesManager;
import com.marklogic.pipes.ui.auth.AuthService;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CustomStepService {
  private static final Logger logger = LoggerFactory.getLogger(CustomStepService.class);

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  BackendModulesManager backendModulesManager;

  @Autowired
  AuthService authService;

  StepDefinitionManager stepDefinitionManager;

  String customStepsRelativePath;


  public CustomStepService() {
    stepDefinitionManager = new StepDefinitionManagerImpl();
    customStepsRelativePath = "/step-definitions/custom/";
  }


  public CustomStepResponse accessDhfRootAndGetCustomStepsJson() throws IOException {
    File[] directories = new File(clientConfig.getMlDhfRoot()+ customStepsRelativePath).listFiles(File::isDirectory);
    CustomStepResponse customStepResponse = new CustomStepResponse();
    if (directories!=null) {
      for (File dir:directories) {

        StepDefinition customStep = getStepDefinition(stepDefinitionManager, clientConfig.getMlDhfRoot()+ customStepsRelativePath, dir);

        if (customStep != null) {


          //try to grab the sourceCollection property, if it exists
          // if not, it will remain null
          String sourceCollection=null;
          if ((customStep.getOptions().get("sourceCollection"))!=null &&  ((TextNode)customStep.getOptions().get("sourceCollection")).asText()!="") {
            sourceCollection = ((TextNode)customStep.getOptions().get("sourceCollection")).asText();
          }

          // same for sourceQuery
          String sourceQuery=null;
          if ((customStep.getOptions().get("sourceQuery"))!=null &&  ((TextNode)customStep.getOptions().get("sourceQuery")).asText()!="") {
            sourceQuery = ((TextNode)customStep.getOptions().get("sourceQuery")).asText();
          }

          // check for sourceCollection or sourceQuery - either one of them should be populated
          // if not, skip this step
          if (sourceCollection!=null || sourceQuery!=null) {
            customStepResponse.addStep(new CustomStep(
                customStep.getName(),
                clientConfig.getMlDhfRoot()+ customStepsRelativePath+customStep.getName()+"/"+customStep.getName()+stepDefinitionManager.STEP_DEFINITION_FILE_EXTENSION,
                ((TextNode)customStep.getOptions().get("sourceDatabase")).asText(),
                sourceCollection, sourceQuery
              )
            );
          }

        }
      }
    }

    return customStepResponse;

  }

  public void copyCustomStepToDhf(String customStepDocument, String customStepName)  throws IOException {

    logger.info(
      String.format("Now copying custom step "+ customStepName +" to your DHF project...")
    );
    String customStepsAbsolutePath = clientConfig.getMlDhfRoot()+ "/src/main/ml-modules/root/custom-modules/custom/";
    String targetFile = customStepsAbsolutePath+customStepName+"/main.sjs";
    String targetDirectory = new File(targetFile).getParent();
    Files.createDirectories(Paths.get(targetDirectory));
    BufferedWriter writer = new BufferedWriter(new FileWriter(targetFile));
    writer.write(customStepDocument);
    writer.close();

    logger.info(String.format("Custom step has been copied."));
  };

  private void copyCustomStepForDeployment(String customStepDocument, String customStepName)  throws IOException {

    logger.info(
      String.format("Now copying custom step "+ customStepName +" to your .pipes folder...")
    );
    File source = new File(clientConfig.getMlDhfRoot() + "/src/main/ml-modules/root/custom-modules/custom/" + customStepName + "/main.sjs");
    File dest = new File(clientConfig.getMlDhfRoot() + File.separator +".pipes" + "/root/custom-modules/custom/" + customStepName + "/main.sjs");
    dest.delete(); // first delete the file
    Files.createDirectories(Paths.get(clientConfig.getMlDhfRoot() + File.separator +".pipes" + "/root/custom-modules/custom/"+customStepName));
    Files.copy(source.toPath(), dest.toPath());
    logger.info("Copied " + source.getAbsolutePath() + " to " + dest.getAbsolutePath());
  };

  private void cleanup()  throws IOException {
    final File dest = new File(clientConfig.getMlDhfRoot() + File.separator + ".pipes");
    logger.info("Cleaning up " + dest.getAbsolutePath());
    dest.delete();
  }

  private StepDefinition getStepDefinition(StepDefinitionManager stepDefinitionManager, String customStepsAbsPath, File dir) throws FileNotFoundException {
    String name = dir.getName().toString();
    Path dirPath= Paths.get(clientConfig.getMlDhfRoot()+ customStepsRelativePath).toAbsolutePath();


    Path stepPath = resolvePath(dirPath,name);
    StepDefinition newStep = null;
    try {
      String targetFileName = name + stepDefinitionManager.STEP_DEFINITION_FILE_EXTENSION;
      InputStream inputStream = StepDefinitionManagerImpl.class.getResourceAsStream(customStepsAbsPath +name  + "/" + targetFileName);
      if (inputStream == null) {
        inputStream = new FileInputStream(stepPath.resolve(targetFileName).toFile());
      }
      JsonNode node = JSONObject.readInput(inputStream);
      newStep = stepDefinitionManager.createStepDefinitionFromJSON(node);

    }
    catch (FileNotFoundException e) {
      throw e;
    }
    catch (IOException e) {
      throw new DataHubProjectException("Could not read Step on disk.");
    }

    if (newStep != null && newStep.getName().length() > 0) {
      return newStep;
    }
    else return null;
  }

  private Path resolvePath(Path path, String more) {
    return path.resolve(more);
  }

  public void  copyDepdenciesToDHfSource(String[] dependencies)  throws IOException {
    backendModulesManager.copyDepdenciesToDHfSource(dependencies);
  }

  public void loadCustomStepToMl(String body, String customStepName) throws IOException {
    logger.info(
      String.format("Now loading custom step "+ customStepName +" to your DHF modules database...")
    );

    copyCustomStepForDeployment(body, customStepName);

    backendModulesManager.deployMlBackendModulesToModulesDatabase(".*/"+customStepName+"/.*.sjs", authService);

    cleanup();

    logger.info(
      String.format("Custom step has been loaded."));

  }
}
