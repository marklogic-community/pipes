package com.marklogic.pipes.ui.customStep;

import java.util.List;

public class CustomStepResponse {

  private List<CustomStep> customSteps;

  public List<CustomStep> getCustomSteps() {
    return customSteps;
  }

  public void addStep(CustomStep customStep) {
    customSteps.add(customStep);
  }

  public static class CustomStep {
    private String name;
    private String path;

    public String getName() {
      return name;
    }

    public void setName(String name) {
      this.name = name;
    }

    public String getPath() {
      return path;
    }

    public void setPath(String path) {
      this.path = path;
    }

    public CustomStep(String name, String path){
      this.name=name;
      this.path=path;
    }
  }
}
