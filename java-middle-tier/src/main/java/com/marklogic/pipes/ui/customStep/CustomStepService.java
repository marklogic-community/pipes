/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.hub.StepDefinitionManager;
import com.marklogic.hub.error.DataHubProjectException;
import com.marklogic.hub.impl.StepDefinitionManagerImpl;
import com.marklogic.hub.step.StepDefinition;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.BackendModules.BackendModulesAppRunner;
import com.marklogic.pipes.ui.BackendModules.BackendModulesManager;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.*;
import java.nio.file.Path;
import java.nio.file.Paths;

@Service
public class CustomStepService {
  private static final Logger logger = LoggerFactory.getLogger(CustomStepService.class);

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  BackendModulesManager backendModulesManager;

  StepDefinitionManager stepDefinitionManager;

  String customStepsRelativePath;


  public CustomStepService() {
    stepDefinitionManager = new StepDefinitionManagerImpl();
    customStepsRelativePath = "/step-definitions/custom/";
  }


  public String accessDhfRootAndGetCustomStepsJson() throws IOException {


    File[] directories = new File(clientConfig.getMlDhfRoot()+ customStepsRelativePath).listFiles(File::isDirectory);

    CustomStepResponse customStepResponse = new CustomStepResponse();
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);


    if (directories!=null) {
      for (File dir:directories) {

        StepDefinition customStep = getStepDefinition(stepDefinitionManager, clientConfig.getMlDhfRoot()+ customStepsRelativePath, dir);

        if (customStep != null) {

          customStepResponse.addStep(new CustomStep(
            customStep.getName(),
            clientConfig.getMlDhfRoot()+ customStepsRelativePath+customStep.getName()+"/"+customStep.getName()+stepDefinitionManager.STEP_DEFINITION_FILE_EXTENSION)
          );

        }
      }
    }


    String customStepResponseString=objectMapper.writeValueAsString(customStepResponse);
    return customStepResponseString;
  }

  public void copyCustomStepToDhf(String customStepDocument, String customStepName)  throws IOException {

    logger.info(
      String.format("Now copying custom step "+ customStepName +" to your DHF project...")
    );
    String customStepsAboslutePath = clientConfig.getMlDhfRoot()+ "/src/main/ml-modules/root/custom-modules/custom/";

      BufferedWriter writer = new BufferedWriter(new FileWriter(
        customStepsAboslutePath+customStepName+"/main.sjs"));
      writer.write(customStepDocument);
      writer.close();

    logger.info(
      String.format("Custom step has been copied."));
  };

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


  public void loadCustomStepToMl(String body, String customStepName) {
    logger.info(
      String.format("Now loading custom step "+ customStepName +" to your DHF modules database...")
    );
    backendModulesManager.deployMlBackendModulesToModulesDatabase(".*/"+customStepName+"/.*.sjs");
    logger.info(
      String.format("Custom step has been loaded."));

  }
}
