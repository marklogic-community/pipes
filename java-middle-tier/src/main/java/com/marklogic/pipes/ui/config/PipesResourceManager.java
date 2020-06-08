/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui.config;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.extensions.ResourceManager;
import com.marklogic.client.extensions.ResourceServices;

/**
 * For accessing the vppBackendServices resource extension (custom REST API)
 */
public class PipesResourceManager extends ResourceManager {

  static final public String NAME = "vppBackendServices";

  public PipesResourceManager(DatabaseClient client) {
    super();

    // Initialize the Resource Manager via the Database Client
    client.init(NAME, this);
  }

  @Override
  public ResourceServices getServices() {
    return super.getServices();
  }
}
