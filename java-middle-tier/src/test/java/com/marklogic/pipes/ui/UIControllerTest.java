/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.InputStreamHandle;
import com.marklogic.client.io.JacksonHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.hub.DatabaseKind;
import com.marklogic.hub.HubConfig;
import com.marklogic.hub.impl.HubConfigImpl;
import com.marklogic.hub.util.json.JSONObject;
import com.marklogic.pipes.ui.auth.AuthService;
import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.config.PipesResourceManager;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;

import java.io.InputStream;
import java.util.Arrays;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.equalToCompressingWhiteSpace;
import static org.springframework.test.util.AssertionErrors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.beans.factory.annotation.Value;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestPropertySource({"/test.properties", "file:${user.dir}/test-dhf-project/gradle.properties" })
class MarkLogicControllerTest {


  public static final String TEST_INPUT_JSON = "/test/input.json";
  public static final String TEST_SOURCE_COLLECTION = "ingest-unit-test";

  public static final String TEST_SAVE_GRAPH_JSON = "/marklogic-pipes/savedGraph/test-save-graph.json";
  public static final String GRAPH_JSON = "test-save-graph.json";
  public static final String SAVED_GRAPH_COLLECTION = "marklogic-pipes/type/savedGraph";
  public static final String CREATE_SOURCE_BLOCK_PAYLOAD_JSON = "createSourceBlock/createSourceBlockPayload.json";

  protected final static String SESSION_SERVICE = "pipes-service";
  protected final static String SESSION_USERNAME_KEY = "pipes-username";

  @Value("${mlUsername}")
  private  String MLUSERNAME;
  @Value("${mlPassword}")
  private  String MLPASSWORD;

  static MockHttpSession session;

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  AuthService authService;

  @Autowired
  HubConfigImpl hubConfig;


  private static InputStreamHandle getInputStreamHandle(String path) {
    final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
    return new InputStreamHandle(is);
  }

  private DatabaseClient getDatabaseClient() {
    return hubConfig.newStagingClient();
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
    InputStreamHandle handle = getInputStreamHandle(GRAPH_JSON);

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

  @BeforeEach
  void setup() throws Exception {
    System.out.println("BeforeAll init() method called");


    String loginPayload="{\"username\":\""+MLUSERNAME+"\",\"password\":\""+MLPASSWORD+"\"}";

    this.mockMvc.perform(post("/login").contentType(MediaType.APPLICATION_JSON)
      .content(loginPayload))
      .andExpect(status().isOk());

    session = new MockHttpSession();

    session.setAttribute(SESSION_USERNAME_KEY, MLUSERNAME);
    session.setAttribute(SESSION_SERVICE, authService.getService());
  }

  /**
   * Tests saving of a graph
   */
  @Test
  void SaveGraphTest() throws Exception {
    try {
      String payload = "{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4},\"name\":\"test-save-graph\",\"metadata\":{\"title\":\"test-save-graph\",\"version\":\"00.01\",\"author\":\"\"}}";
      String request = "/v1/resources/vppBackendServices?rs:action=SaveGraph";

      MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.post(request).content(payload)
        .session(session);

      this.mockMvc.perform(builder).andExpect(status().isOk());
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

      MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.get(request).content(request)
        .session(session);

      this.mockMvc.perform(builder).andExpect(content().string(response));

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

      MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.get(request)
        .session(session);

      MvcResult mvcResult = mockMvc.perform(builder).andReturn();

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
    InputStreamHandle handle = getInputStreamHandle(CREATE_SOURCE_BLOCK_PAYLOAD_JSON);

    String payload = handle.toString();


    MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.post(request).content(payload)
      .session(session);

    mockMvc.perform(builder).andExpect(status().isOk());
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
  void LoginTestWrongPayload() throws Exception {
    String request = "/login";
    String payload="{\"someparam\":\"somevalue\"}";
    this.mockMvc.perform(post(request).content(payload).contentType("application/json")).andExpect(status().isBadRequest());
  }

}
