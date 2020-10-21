/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.customStep;

import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.marklogic.pipes.ui.auth.AbstractLoggingClass;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.net.URLDecoder;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
public class CustomStepController extends AbstractLoggingClass {

  private static final Logger logger = LoggerFactory.getLogger(CustomStepController.class);

  private final CustomStepService customStepService;

  public CustomStepController(CustomStepService service) {
    this.customStepService = service;
  }

  /**
   * @return a String representing a json containing an array with all custom steps found in the DHF project
   * @throws IOException gets thrown if the path is not correct (check mlDhfRoot in application.properties)
   */
  @RequestMapping(value = "/customSteps", method = RequestMethod.GET)
  public String listOfCustomStepNames() throws IOException {
    ObjectMapper objectMapper = new ObjectMapper();
    objectMapper.configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    String customStepResponseString = objectMapper.writeValueAsString(customStepService.accessDhfRootAndGetCustomStepsJson());
    return customStepResponseString;

  }

  /**
   * Will copy incoming body (hopefully a Pipes-generated main.sjs for the custom step) to the proper location specified by the "name" parameter
   * Additionally, it will deploy the main.sjs, if requested by using param deploy=true in the request
   *
   * @param body    content of main.sjs
   * @param method  not used
   * @param request name: name of the custom step; deploy=true will also push the code to ML
   * @throws IOException
   */
  @RequestMapping(value = "/customSteps", method = RequestMethod.POST)
  public ResponseEntity<Object> deployCustomStep(@RequestBody String body, HttpMethod method, HttpServletRequest request) throws IOException {
    try {
      if (request.getParameter("name") != null) {
        String customStepName = request.getParameter("name");
        customStepService.copyCustomStepToDhf(body, customStepName);
        String[] dependencies = null;
        String dependenciesString = request.getParameter("dependencies");
        if (dependenciesString != null) {
          dependenciesString = URLDecoder.decode(dependenciesString);
          dependencies = dependenciesString.split(",");
        }
        if (dependencies != null) {
          customStepService.copyDepdenciesToDHfSource(dependencies);
        }
        if (request.getParameter("deploy") != null && request.getParameter("deploy").equals("true")) {
          customStepService.loadCustomStepToMl(body, customStepName);
        }

        return new ResponseEntity<>(null, HttpStatus.OK);
      } else {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Parameter 'name' is mandatory.");
      }
    } catch (IOException e) {
      logger.error("Error occured during deployCustomStep", e);
      throw e;
    }
  }
}
