package com.marklogic.pipes.ui.auth;

public class SessionStatus {

	private String appName;
	private boolean authenticated;

	// These aren't currently documented, but they're being set by the Node middle tier
	private String username;
	private boolean disallowUpdates;
	private boolean appUsersOnly;

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

	public boolean isAppUsersOnly() {
		return appUsersOnly;
	}

	public void setAppUsersOnly(boolean appUsersOnly) {
		this.appUsersOnly = appUsersOnly;
	}
}
