/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.auth;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.pipes.ui.AbstractLoggingClass;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.config.PipesResourceManager;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;

/**
 * This is intended for development only, as it simply records a user as being "logged in" by virtue of being able to
 * instantiate a DatabaseClient, thereby assuming that the login credentials correspond to a MarkLogic user.
 */
@RestController
//@RequestMapping("/api/auth")
public class AuthController extends AbstractLoggingClass {

	protected final static String SESSION_USERNAME_KEY = "pipes-username";
	protected final static String SESSION_SERVICE = "pipes-service";

	@Autowired
	private ClientConfig clientConfig;

	@RequestMapping(value = "/login", method = RequestMethod.POST)
	public SessionStatus login(@RequestBody LoginRequest request, HttpSession session, HttpServletResponse response) {
		logger.info("Logging in user: " + request.getUsername());
		// TODO Handle error appropriately

    // check LoginRequest
    if (request.getUsername()==null || request.getPassword()==null) {
      response.setStatus(400);
      return new SessionStatus(false);
    }

    // the user will be logging in by successfully creating the RestTemplate
    // and doing a basic Pipes request
    DatabaseClient client=clientConfig.client(request.getUsername(),request.getPassword());

    // call ListSavedBlock as a sanity check
    ResourceServices service = clientConfig.getService(client);

    RequestParameters parameters = new RequestParameters();
    parameters.add("action","ListSavedBlock");

    try {
      service.get(parameters,new StringHandle());
    } catch (Exception e) {
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      e.printStackTrace();
      return new SessionStatus(false);
    }

		session.setAttribute(SESSION_USERNAME_KEY, request.getUsername());
		session.setAttribute(SESSION_SERVICE, service);

		logger.info("Logged in successfully.");
		return new SessionStatus(true);

	}

	@RequestMapping(value = "/logout", method = RequestMethod.POST)
	public void logout(HttpSession session, HttpServletResponse response) {
		logger.info("Logging out: " + getAuthenticatedUsername(session));

		session.invalidate();
		response.setStatus(HttpStatus.NO_CONTENT.value());
	}

	@RequestMapping(value = "/status", method = RequestMethod.GET)
	public SessionStatus status(HttpSession session) {
		String username = getAuthenticatedUsername(session);
		return new SessionStatus(username, username != null);
	}

	private String getAuthenticatedUsername(HttpSession session) {
		return (String) session.getAttribute(SESSION_USERNAME_KEY);
	}

}
