/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

public class CustomStepsPostRequest {
  private String customStepDocument;
  private String customStepAbsolutePath;

  public String getCustomStepDocument() {
    return customStepDocument;
  }

  public void setCustomStepDocument(String customStepDocument) {
    this.customStepDocument = customStepDocument;
  }

  public String getCustomStepAbsolutePath() {
    return customStepAbsolutePath;
  }

  public void setCustomStepAbsolutePath(String customStepAbsolutePath) {
    this.customStepAbsolutePath = customStepAbsolutePath;
  }
}
