/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

  public class CustomStep {
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

