package com.marklogic.vpp.ui;

import java.net.URI;
import java.net.URISyntaxException;

import javax.servlet.http.HttpServletRequest;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
// @RequestMapping("/v1")
public class MlController {

    @Autowired
    ClientConfig clientConfig;

    @RequestMapping(value = "/v1/**", method = RequestMethod.GET)
    @ResponseBody
    public String mirrorRestGet(HttpMethod method, HttpServletRequest request) throws URISyntaxException {

        String server = clientConfig.getMlHost();
        int port = clientConfig.getMlStagingPort();

        URI uri = new URI("http", null, server, port, request.getRequestURI(), request.getQueryString(), null);

        ResponseEntity<String> responseEntity = clientConfig.restTemplate().exchange(uri, method, null, String.class);

        return responseEntity.getBody();
    }

    @RequestMapping(value = "/v1/**", method = RequestMethod.POST)
    @ResponseBody
    public String mirrorRestPost(@RequestBody String body, HttpMethod method, HttpServletRequest request)
            throws URISyntaxException {

        String server = clientConfig.getMlHost();
        int port = clientConfig.getMlStagingPort();

        URI uri = new URI("http", null, server, port, request.getRequestURI(), request.getQueryString(), null);

        ResponseEntity<String> responseEntity = clientConfig.restTemplate().exchange(uri, method,
                new HttpEntity<String>(body), String.class);

        return responseEntity.getBody();
    }

    @RequestMapping(value = "/v1/**", method = RequestMethod.PUT)
    @ResponseBody
    public String mirrorRestPut(@RequestBody String body, HttpMethod method, HttpServletRequest request)
            throws URISyntaxException {

        String server = clientConfig.getMlHost();
        int port = clientConfig.getMlStagingPort();

        URI uri = new URI("http", null, server, port, request.getRequestURI(), request.getQueryString(), null);

        ResponseEntity<String> responseEntity = clientConfig.restTemplate().exchange(uri, method,
                new HttpEntity<String>(body), String.class);

        return responseEntity.getBody();
    }
}
