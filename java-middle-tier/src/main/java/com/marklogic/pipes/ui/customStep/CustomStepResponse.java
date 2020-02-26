/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

import java.util.LinkedList;
import java.util.List;

public class CustomStepResponse {

  private List<CustomStep> customSteps;

  public List<CustomStep> getCustomSteps() {
    return customSteps;
  }

  public void addStep(CustomStep customStep) {
    customSteps.add(customStep);
  }

  public CustomStepResponse() {
    customSteps = new LinkedList<>();
  }

}
