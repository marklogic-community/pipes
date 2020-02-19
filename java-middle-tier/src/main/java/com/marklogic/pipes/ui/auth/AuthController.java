/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.auth;

import com.marklogic.pipes.ui.AbstractController;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.config.HttpComponentsClientHttpRequestFactoryDigestAuth;
import org.apache.http.HttpHost;
import org.apache.http.auth.AuthScope;
import org.apache.http.auth.UsernamePasswordCredentials;
import org.apache.http.client.CredentialsProvider;
import org.apache.http.impl.client.BasicCredentialsProvider;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClientBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.client.HttpComponentsClientHttpRequestFactory;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.client.RestTemplate;

import javax.servlet.http.HttpServletResponse;
import javax.servlet.http.HttpSession;
import java.net.URI;
import java.net.URISyntaxException;

/**
 * This is intended for development only, as it simply records a user as being "logged in" by virtue of being able to
 * instantiate a DatabaseClient, thereby assuming that the login credentials correspond to a MarkLogic user.
 */
@RestController
@RequestMapping("/api/auth")
public class AuthController extends AbstractController {

	protected final static String SESSION_USERNAME_KEY = "pipes-username";
	protected final static String SESSION_REST_TEMPLATE_KEY = "pipes-rest-template";

	@Autowired
	private ClientConfig clientConfig;

	@RequestMapping(value = "/login", method = RequestMethod.POST)
	public SessionStatus login(@RequestBody LoginRequest request, HttpSession session, HttpServletResponse response) {
		logger.info("Logging in user: " + request.getUsername());
		// TODO Handle error appropriately

    // the user will be logging in by successfully creating the RestTemplate
    // and doing a basic Pipes request

    // create RestTemplate
    RestTemplate restTemplate= buildRestTemplate(request.getUsername(), request.getPassword());

    // call ListSavedBlock as a sanity check
    String server = clientConfig.getMlHost();
    int port = clientConfig.getMlStagingPort();

    String listSavedBlocksPath="/v1/resources/vppBackendServices";
    String listSavedBlocksQuery="rs:action=ListSavedBlock";

    try {
      URI uri = new URI("http", null, server, port, listSavedBlocksPath, listSavedBlocksQuery, null);

      ResponseEntity<String> responseEntity = restTemplate.exchange(uri, HttpMethod.GET,
        null, String.class);

    } catch (URISyntaxException e) {
      response.setStatus(HttpStatus.UNAUTHORIZED.value());
      e.printStackTrace();
    }

		session.setAttribute(SESSION_USERNAME_KEY, request.getUsername());
		session.setAttribute(SESSION_REST_TEMPLATE_KEY, restTemplate);

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

//	@RequestMapping(value = "/profile", method = RequestMethod.GET)
//	public UserProfile profile(HttpSession session) {
//		UserProfile p = new UserProfile();
//		p.setUsername(getAuthenticatedUsername(session));
//		return p;
//	}

	private String getAuthenticatedUsername(HttpSession session) {
		return (String) session.getAttribute(SESSION_USERNAME_KEY);
	}

  public RestTemplate buildRestTemplate(String username, String password ) {

    HttpHost host = new HttpHost(clientConfig.getMlHost(), clientConfig.getContainerPort(), "http");

    CredentialsProvider provider = new BasicCredentialsProvider();
    UsernamePasswordCredentials credentials = new UsernamePasswordCredentials(username, password);
    provider.setCredentials(AuthScope.ANY, credentials);

    CloseableHttpClient client = HttpClientBuilder.create().setDefaultCredentialsProvider(provider)
      .useSystemProperties().build();
    HttpComponentsClientHttpRequestFactory requestFactory = new HttpComponentsClientHttpRequestFactoryDigestAuth(host,
      client);

    return new RestTemplate(requestFactory);
  }

}
