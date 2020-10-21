/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.auth;

import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.version.PipesVersionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

/**
 * This is intended for development only, as it simply records a user as being
 * "logged in" by virtue of being able to instantiate a DatabaseClient, thereby
 * assuming that the login credentials correspond to a MarkLogic user.
 */
@RestController
public class AuthController extends AbstractLoggingClass {
  private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

  protected final static String SESSION_USERNAME_KEY = "pipes-username";
  protected final static String SESSION_SERVICE = "pipes-service";

  @Autowired
  private ClientConfig clientConfig;

  @Autowired
  AuthService authService;

  @Autowired
  PipesVersionService pipesVersionService;

  @RequestMapping(value = "/login", method = RequestMethod.POST)
  public SessionStatus login(@RequestBody LoginRequest request, HttpSession session, HttpServletResponse response) {
    try {
      logger.info("Logging in user: " + request.getUsername());
      // TODO Handle error appropriately

      // check LoginRequest
      if (request.getUsername() == null || request.getPassword() == null) {
        response.setStatus(400);
        return new SessionStatus(false);
      }

      if (authService.tryAuthorize(clientConfig, request.getUsername(), request.getPassword())) {
        session.setAttribute(SESSION_USERNAME_KEY, request.getUsername());
        session.setAttribute(SESSION_SERVICE, authService.getService());
        logger.info("Logged in successfully.");
        SessionStatus sessionStatus = new SessionStatus(true);
        sessionStatus.setUsername(authService.getUsername());
        sessionStatus.setPort(Integer.toString(authService.getDatabaseClient().getPort()));
        sessionStatus.setDatabase(authService.getDatabaseClient().getDatabase());
        sessionStatus.setEnvironment(authService.getEnvironmentName());
        sessionStatus.setHost(authService.getDatabaseClient().getHost());
        sessionStatus.setLoadGraph(clientConfig.getLoadGraph());

        return sessionStatus;
      } else {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        return new SessionStatus(false);
      }
    } catch (RuntimeException e) {
       logger.error("Error during /login",e);
       throw e;
    }
  }

  @RequestMapping(value = "/logout", method = RequestMethod.POST)
  public void logout(HttpSession session, HttpServletResponse response) {
    try {
      logger.info("Logging out: " + getAuthenticatedUsername(session));

      session.invalidate();
      authService.setAuthorized(false);
      response.setStatus(HttpStatus.NO_CONTENT.value());
    } catch (RuntimeException e) {
      logger.error("Error during /login",e);
      throw e;
    }
  }

  @RequestMapping(value = "/status", method = RequestMethod.GET)
  public SessionStatus status(HttpSession session) {
    try {
      if (authService.isAuthorized() && getAuthenticatedUsername(session) == null) {
        session.setAttribute(SESSION_USERNAME_KEY, authService.getUsername());
        session.setAttribute(SESSION_SERVICE, authService.getService());
      }

      String username = getAuthenticatedUsername(session);
      return new SessionStatus(username, username != null);
    } catch (RuntimeException e) {
      logger.error("Error during /status",e);
      throw e;
    }
  }

  private String getAuthenticatedUsername(HttpSession session) {
    return (String) session.getAttribute(SESSION_USERNAME_KEY);
  }

}
