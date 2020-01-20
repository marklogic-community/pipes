package com.marklogic.pipes.ui.customStep;

import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.*;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.io.IOException;
import java.lang.reflect.Array;

@RestController
public class CustomStepController {

  private final CustomStepService customStepService;

  public CustomStepController(CustomStepService service){
    this.customStepService=service;
  }

  @RequestMapping(value = "/customSteps", method = RequestMethod.GET)
  public String listOfCustomStepNames() throws IOException {

    return customStepService.accessDhfRootAndGetCustomStepsArray();
  }

  @RequestMapping(value = "/customSteps", method = RequestMethod.POST)
  public void deployCustomStep(@RequestBody String body, HttpMethod method, HttpServletRequest request) throws IOException {

  }
}
