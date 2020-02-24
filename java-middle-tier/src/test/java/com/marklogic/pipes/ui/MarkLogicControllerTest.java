/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.fasterxml.jackson.databind.JsonNode;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.admin.ResourceExtensionsManager;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.InputStreamHandle;
import com.marklogic.client.io.JacksonHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.config.PipesResourceManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.io.InputStream;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.util.AssertionErrors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class MarkLogicControllerTest {


  public static final String TEST_CUSTOMER_1_JSON = "/test/customer1.json";
  public static final String CUSTOMER_SOURCE_COLLECTION = "customer-ingest";
  public static final String CUSTOMER_1_JSON = "customer1.json";
  public static final String TEST_SAVE_GRAPH_JSON = "/marklogic-pipes/savedGraph/test-save-graph.json";
  public static final String GRAPH_JSON = "test-save-graph.json";
  public static final String SAVED_GRAPH_COLLECTION = "marklogic-pipes/type/savedGraph";
  public static final String CREATE_SOURCE_BLOCK_PAYLOAD_JSON = "createSourceBlock/createSourceBlockPayload.json";
  @Autowired
  private MockMvc mockMvc;

  @Autowired
  ClientConfig clientConfig;

  void addCustomerSource() throws Exception {
    DatabaseClient client = getDatabaseClient();

    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

    // will create a customer document

    // get the doc from resources
    final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(CUSTOMER_1_JSON);
    InputStreamHandle handle = new InputStreamHandle(is);

    //Get the set of collections the document belongs to and put in array.
    DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
    DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

    collections.add(CUSTOMER_SOURCE_COLLECTION);

    // write
    jsonDocumentManager.write(TEST_CUSTOMER_1_JSON, metadataHandle, handle);

    // release client
    client.release();
  }

  private DatabaseClient getDatabaseClient() {
    return DatabaseClientFactory.newClient(
      clientConfig.getMlHost(),
      clientConfig.getMlStagingPort(),
      new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));
  }

  void removeCustomerSource() throws Exception {
    DatabaseClient client = getDatabaseClient();
    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

    jsonDocumentManager.delete(TEST_CUSTOMER_1_JSON);
  }

  void deleteGraph() throws Exception {
    DatabaseClient client = getDatabaseClient();

    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

    jsonDocumentManager.delete(TEST_SAVE_GRAPH_JSON);

    client.release();
  }

  void createGraph() throws Exception {
    DatabaseClient client = getDatabaseClient();

    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

    // will create a customer document

    // get the doc from resources
    final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(GRAPH_JSON);
    InputStreamHandle handle = new InputStreamHandle(is);

    //Get the set of collections the document belongs to and put in array.
    DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
    DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

    collections.add(SAVED_GRAPH_COLLECTION);

    // write
    jsonDocumentManager.write(TEST_SAVE_GRAPH_JSON, metadataHandle, handle);

    // release client
    client.release();
  }

  private void deleteSourceBlock() {
    DatabaseClient client=getDatabaseClient();
    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

    jsonDocumentManager.delete("/marklogic-pipes/savedBlock/9WmK2oPQun.json");
  }

  @AfterEach
  void tearDown() {

  }


  /**
   * Tests execution of a minimal graph (Input-Output) for a specific document URI in the staging DB
   *
   * @throws Exception
   */
  @Test
  void ExecuteMinimalGraphTest() throws Exception {
    try {

      addCustomerSource();
      String payload = "{\"jsonGraph\":{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4}},\"collection\":\"customer-ingest\",\"collectionRandom\":false,\"previewUri\":\"" + TEST_CUSTOMER_1_JSON + "\"}";
      String request = "/v1/resources/vppBackendServices?rs:action=ExecuteGraph&rs:database=11948715645976432197";
      String response = "{\"envelope\":{\"headers\":{\"sources\":[{\"name\":\"Customer360\"}], \"createdOn\":\"2020-01-21T16:04:45.849756Z\", \"createdBy\":\"admin\", \"createdUsingFile\":\"/Users/smitrovi/MarkLogic/dev/vpp-java-test/data/customer/dump1.csv\"}, \"triples\":[], \"instance\":{\"id\":\"652\", \"first_name\":\"Connie\", \"last_name\":\"Harnor\", \"email\":\"charnori3@ibm.com\", \"gender\":\"Male\", \"ip_address\":\"3.115.93.14\", \"dob\":\"14/05/2001\", \"street\":\"49 Killdeer Lane\", \"city\":\"Zhangjiapan\", \"zipcode\":\"\", \"country\":\"China\"}, \"attachments\":null}}";

      this.mockMvc.perform(post(request).content(payload)).andExpect(content().string(containsString(response)));
    } finally {
      removeCustomerSource();
    }

  }

  /**
   * Tests saving of a graph
   */
  @Test
  void SaveGraphTest() throws Exception {
    try {
      String payload = "{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4},\"name\":\"test-save-graph\",\"metadata\":{\"title\":\"test-save-graph\",\"version\":\"00.01\",\"author\":\"\"}}";
      String request = "/v1/resources/vppBackendServices?rs:action=SaveGraph";

      this.mockMvc.perform(post(request).content(payload)).andExpect(status().isOk());
    } finally {
      deleteGraph();
    }
  }

  @Test
  void SaveGraphWithDbclient() {

    String payload = "{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4},\"name\":\"test-save-graph\",\"metadata\":{\"title\":\"test-save-graph\",\"version\":\"00.01\",\"author\":\"\"}}";
    String payload1="{\"paramname\":\"value\"}";

    DatabaseClient client=getDatabaseClient();
    PipesResourceManager pipesResourceManager=new PipesResourceManager(client);

    ResourceServices services = pipesResourceManager.getServices();

    RequestParameters params=new RequestParameters();
    params.add("action", "SaveGraph");

    StringHandle output = new StringHandle();
    output = services.post(params,new StringHandle().withMimetype("text/plain").with(payload), new StringHandle());

    System.out.println(output);
  }

  /**
   * Tests loading a graph. It 1st creates a graph then tries to load. In the end, it will delete it, too.
   *
   * @throws Exception
   */
  @Test
  void LoadGraph() throws Exception {
    try {
      createGraph();

      String request = "/v1/resources/vppBackendServices?rs:action=GetSavedGraph&rs:uri=/marklogic-pipes/savedGraph/test-save-graph.json";
      String response = "{\"models\":[], \"executionGraph\":{\"last_node_id\":2, \"last_link_id\":1, \"nodes\":[{\"id\":2, \"type\":\"dhf/output\", \"pos\":[1308, 434], \"size\":[180, 160], \"flags\":{}, \"order\":1, \"mode\":0, \"inputs\":[{\"name\":\"output\", \"type\":0, \"link\":1}], \"properties\":{}}, {\"id\":1, \"type\":\"dhf/input\", \"pos\":[248, 489], \"size\":[180, 60], \"flags\":{}, \"order\":0, \"mode\":0, \"outputs\":[{\"name\":\"input\", \"type\":\"\", \"links\":[1]}, {\"name\":\"uri\", \"type\":\"\", \"links\":null}, {\"name\":\"collections\", \"type\":\"\", \"links\":null}], \"properties\":{}}], \"links\":[[1, 1, 0, 2, 0, 0]], \"groups\":[], \"config\":{}, \"version\":0.4}, \"name\":\"test-save-graph\", \"metadata\":{\"title\":\"test-save-graph\", \"version\":\"00.01\", \"author\":\"\"}}";

      this.mockMvc.perform(get(request)).andExpect(content().string(response));

    } finally {
      deleteGraph();
    }

  }

  @Test
  void SaveSourceBlock() throws Exception {

    try {
      createSourceBlockHelper();
      String request;

      // now check for existance of block
      request = "/v1/resources/vppBackendServices?rs:action=ListSavedBlock";
      MvcResult mvcResult = mockMvc.perform(get(request)).andReturn();
      String response= mvcResult.getResponse().getContentAsString();


      JSONObject object = new JSONObject(response);
      JsonNode jsonNode = object.jsonNode();

      assertTrue("Result not array", jsonNode.isArray());

      Boolean uriFound=false;
      for (JsonNode arrayMember:jsonNode) {

        if (arrayMember.get("uri").textValue().equals("/marklogic-pipes/savedBlock/9WmK2oPQun.json")) {
          uriFound=true;
          break;
        }
      }

      if (!uriFound) {
        fail("Source block failed to save");
      }

    } finally {
      deleteSourceBlock();
    }




  }

  private void createSourceBlockHelper() throws Exception {
    String request = "/v1/resources/vppBackendServices?rs:action=SaveBlock";

    // get the payload from resources
    final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(CREATE_SOURCE_BLOCK_PAYLOAD_JSON);
    InputStreamHandle handle = new InputStreamHandle(is);

    String payload = handle.toString();

    mockMvc.perform(post(request).content(payload)).andExpect(status().isOk());
  }

  @Test
  void GetSavedBlocksWithMlDbClient() {


    try {
      createSourceBlockHelper();
    } catch (Exception e) {
      e.printStackTrace();
    }

    DatabaseClient client=getDatabaseClient();
    PipesResourceManager pipesResourceManager=new PipesResourceManager(client);

    ResourceServices services = pipesResourceManager.getServices();

    RequestParameters params=new RequestParameters();
    params.add("action", "ListSavedBlock");

    String[] mimetypes = new String[] { "text/plain" };

    ResourceServices.ServiceResultIterator resultItr =
      services.get(params, mimetypes);

    ResourceServices.ServiceResult result = resultItr.next();
    JsonNode jsonNode=result.getContent(new JacksonHandle()).get();


    Boolean uriFound=false;
    for (JsonNode arrayMember:jsonNode) {
      if (arrayMember.get("uri").textValue().equals("/marklogic-pipes/savedBlock/9WmK2oPQun.json")) {
        uriFound=true;
        break;
      }
    }

    if (!uriFound) {
      fail("Source block failed to save");
    }

    deleteSourceBlock();
    resultItr.close();
  }

  @Test
  void LoginTestWrongUserPass() throws Exception {
    String username="somefakeusername";
    String password="somenonexistingpassword";
    String request = "/login";
    String payload= String.format("{\"username\":\"%s\",\"password\":\"%s\"}",username,password);
    this.mockMvc.perform(post(request).content(payload).contentType("application/json")).andExpect(status().isUnauthorized());
  }

  @Test
  void LoginTestWrongPayload() throws Exception {
    String request = "/login";
    String payload="{\"someparam\":\"somevalue\"}";
    this.mockMvc.perform(post(request).content(payload).contentType("application/json")).andExpect(status().isBadRequest());
  }

}
