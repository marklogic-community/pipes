package com.marklogic.pipes.ui.customStep;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.hub.step.impl.Step;
import com.marklogic.pipes.ui.ClientConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
//import com.marklogic.

import java.io.File;
import java.io.IOException;

@Service
public class CustomStepService {

  @Autowired
  ClientConfig clientConfig;

  public String accessDhfRootAndGetCustomStepsArray() throws IOException {

    String dhfRoot=clientConfig.getMlDhfRoot();
    String customStepsPath=dhfRoot+"/step-definitions/custom/";

    File[] directories = new File(customStepsPath).listFiles(File::isDirectory);

    CustomStepResponse customStepResponse = new CustomStepResponse();
    ObjectMapper objectMapper = new ObjectMapper();

    for (File dir:directories) {
      //customStepResponse.addStep(new CustomStepResponse.CustomStep(dir.getName().toString(),dir.getPath().toString()));
      String name = dir.getName().toString();
      String stepPath=customStepsPath+name+"/"+name+".step.json";
      Step step = objectMapper.readValue(new File(stepPath), Step.class);

      if (step.isCustomStep()) {
        customStepResponse.addStep(new CustomStepResponse.CustomStep(step.getName(), stepPath));
      }


    }

    String customStepResponseString=objectMapper.writeValueAsString(customStepResponse);
    return customStepResponseString;
  }
}
