package com.marklogic.pipes.ui.customStep;

import java.util.LinkedList;
import java.util.List;

public class CustomStepResponse {

  private List<> customSteps;

  public List<> getCustomSteps() {
    return customSteps;
  }

  public void addStep(CustomStep customStep) {
    customSteps.add(customStep);
  }

  public CustomStepResponse() {
    customSteps = new LinkedList<>();
  }

}
