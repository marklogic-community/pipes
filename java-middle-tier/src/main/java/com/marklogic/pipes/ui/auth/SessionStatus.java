package com.marklogic.pipes.ui.auth;

public class SessionStatus {

	private String appName;
	private boolean authenticated;

	// These aren't currently documented, but they're being set by the Node middle tier

	private boolean disallowUpdates;

  private String username;
  private String environment;
  private String port;
  private String database;
  private String host;



  private String startingGraph;

  public String getEnvironment() {
    return environment;
  }

  public void setEnvironment(String environment) {
    this.environment = environment;
  }

  public String getPort() {
    return port;
  }

  public void setPort(String port) {
    this.port = port;
  }

  public String getDatabase() {
    return database;
  }

  public void setDatabase(String database) {
    this.database = database;
  }

  public String getHost() {
    return host;
  }

  public void setHost(String host) {
    this.host = host;
  }

  public String getStartingGraph() {
    return startingGraph;
  }

  public void setStartingGraph(String startingGraph) {
    this.startingGraph = startingGraph;
  }

	public SessionStatus() {
	}

	public SessionStatus(boolean authenticated) {
		this.authenticated = authenticated;
	}

	public SessionStatus(String username, boolean authenticated) {
		this.username = username;
		this.authenticated = authenticated;
	}

	public String getAppName() {
		return appName;
	}

	public void setAppName(String appName) {
		this.appName = appName;
	}

	public boolean isAuthenticated() {
		return authenticated;
	}

	public void setAuthenticated(boolean authenticated) {
		this.authenticated = authenticated;
	}

	public String getUsername() {
		return username;
	}

	public void setUsername(String username) {
		this.username = username;
	}

	public boolean isDisallowUpdates() {
		return disallowUpdates;
	}

	public void setDisallowUpdates(boolean disallowUpdates) {
		this.disallowUpdates = disallowUpdates;
	}

}
