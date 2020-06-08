/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import java.net.URISyntaxException;
import java.util.Map;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.Format;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.pipes.ui.auth.AbstractLoggingClass;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class MarkLogicController extends AbstractLoggingClass
{

    @Autowired
    ClientConfig clientConfig;

    protected final static String SESSION_SERVICE = "pipes-service";

    @RequestMapping(value = "/v1/**", method = RequestMethod.GET)
    @ResponseBody
    public String mirrorRestGet(HttpMethod method, HttpServletRequest request, HttpSession session, HttpServletResponse response) throws URISyntaxException {

      ResourceServices service= (ResourceServices) session.getAttribute(SESSION_SERVICE);
      if (service == null) {
        response.setStatus(401);
        return null;
      }

      RequestParameters params = extractParams(request);

      StringHandle output = new StringHandle();
      output=service.get(params,new StringHandle().withFormat(Format.TEXT));

      return output.toString();
    }



  @RequestMapping(value = "/v1/**", method = RequestMethod.POST)
    @ResponseBody
    public String mirrorRestPost(@RequestBody String body, HttpMethod method, HttpServletRequest request, HttpSession session, HttpServletResponse response)
            throws URISyntaxException {

    ResourceServices service= (ResourceServices) session.getAttribute(SESSION_SERVICE);
    if (service == null) {
      response.setStatus(401);
      return null;
    }

      RequestParameters params = extractParams(request);

      StringHandle bodyHandle = new StringHandle().withMimetype("text/plain").with(body);

      StringHandle output = new StringHandle();

      output = service.post(params, bodyHandle, new StringHandle());

      return output.toString();

    }

    @RequestMapping(value = "/v1/**", method = RequestMethod.PUT)
    @ResponseBody
    public String mirrorRestPut(@RequestBody String body, HttpMethod method, HttpServletRequest request, HttpSession session, HttpServletResponse response)
            throws URISyntaxException {

      ResourceServices service= (ResourceServices) session.getAttribute(SESSION_SERVICE);
      if (service == null) {
        response.setStatus(401);
        return null;
      }

      RequestParameters params = extractParams(request);

      StringHandle bodyHandle = new StringHandle().withMimetype("text/plain").with(body);

      StringHandle output = new StringHandle();

      output = service.put(params, bodyHandle, new StringHandle());

      return output.toString();
    }

  @RequestMapping(value = "/v1/**", method = RequestMethod.DELETE)
  @ResponseBody
  public String mirrorRestDelete(HttpMethod method, HttpServletRequest request, HttpSession session, HttpServletResponse response) throws URISyntaxException {

    ResourceServices service= (ResourceServices) session.getAttribute(SESSION_SERVICE);
    if (service == null) {
      response.setStatus(401);
      return null;
    }

    RequestParameters params = extractParams(request);

    StringHandle bodyHandle = new StringHandle().withMimetype("text/plain").with("");

    StringHandle output = new StringHandle();

    service.delete(params,new StringHandle());

    return output.toString();

  }

  private RequestParameters extractParams(HttpServletRequest request) {
    Map<String, String[]> requestParams = request.getParameterMap();

    RequestParameters params=new RequestParameters();
    for (Map.Entry<String, String[]> entry : requestParams.entrySet()) {
      String newKey = entry.getKey().replace("rs:","");
      params.add(newKey,entry.getValue()[0]);
    }

    return params;
  }
}
