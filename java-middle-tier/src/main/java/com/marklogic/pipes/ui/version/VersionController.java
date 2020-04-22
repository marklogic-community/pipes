package com.marklogic.pipes.ui.version;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;

@RestController
public class VersionController {

  @Autowired
  Service versionService;

  @RequestMapping(value = "/version", method = RequestMethod.GET)
  public String listOfCustomStepNames() throws IOException {

    return versionService.get();
  }
}