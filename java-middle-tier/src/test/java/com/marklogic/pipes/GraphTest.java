/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.marklogic.hub.DatabaseKind;
import com.marklogic.hub.impl.HubConfigImpl;
import com.marklogic.hub.flow.FlowInputs;
import com.marklogic.hub.flow.FlowRunner;
import com.marklogic.hub.flow.RunFlowResponse;
import com.marklogic.hub.flow.impl.FlowRunnerImpl;

import com.fasterxml.jackson.databind.node.JsonNodeType;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.marklogic.client.DatabaseClient;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.document.DocumentManager;
import com.marklogic.client.document.XMLDocumentManager;
import com.marklogic.client.extensions.ResourceServices;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.InputStreamHandle;
import com.marklogic.client.io.JacksonHandle;
import com.marklogic.client.io.StringHandle;
import com.marklogic.client.util.RequestParameters;
import com.marklogic.hub.DatabaseKind;
import com.marklogic.hub.HubConfig;
import com.marklogic.client.query.DeleteQueryDefinition;
import com.marklogic.client.query.QueryManager;
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

import java.io.File;
import java.io.InputStream;
import java.util.Arrays;
import java.util.stream.Stream;

import static org.hamcrest.Matchers.equalToCompressingWhiteSpace;
import static org.springframework.test.util.AssertionErrors.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.PropertySource;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@TestPropertySource({"/test.properties", "file:${user.dir}/test-dhf-project/gradle.properties" })
class GraphTest {
  public static final String TEST_INPUT_JSON = "/test/input.json";
  public static final String TEST_INPUT_XML = "/test/input.xml";
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
  @Value("${mlStagingAppserverName}")
  private  String MLTESTDATABASE;
  @Value("${mlStagingPort}")
  private int STAGING_PORT;

  static MockHttpSession session;

  @Autowired
  private MockMvc mockMvc;

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  AuthService authService;

  @Autowired
  HubConfigImpl hubConfig;

  static {
    // force pipes to reload back end modules even if the version matches.
    System.setProperty("deployBackend","true");
  }

  void removeTestDocuments() throws Exception {
    DatabaseClient client = getDatabaseClient();
    try {
      QueryManager qm = client.newQueryManager();
      DeleteQueryDefinition col = qm.newDeleteDefinition();
      col.setCollections(TEST_SOURCE_COLLECTION);
      qm.delete(col);
    } finally {
      client.release();
    }
  }

  void ingestTestFile(String pathOfFile) throws Exception {
    DatabaseClient client = getDatabaseClient();
    String fileName = new File(pathOfFile).getName();
    try {
      String uri = "/test/"+fileName;
      DocumentManager dm = client.newJSONDocumentManager();
      if ( pathOfFile.endsWith(".xml")) {
        dm = client.newXMLDocumentManager();
      }

      // will create a customer document

      // get the doc from resources
      InputStreamHandle handle = getInputStreamHandle(pathOfFile);

      //Get the set of collections the document belongs to and put in array.
      DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
      DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

      collections.add(TEST_SOURCE_COLLECTION);

      // write
      dm.write(uri, metadataHandle, handle);

      // release client
    } catch (Exception e ) {
        e.printStackTrace();
        throw e;
    }
      finally {
      client.release();
    }
  }

  private static InputStreamHandle getInputStreamHandle(String path) {
    final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream(path);
    return new InputStreamHandle(is);
  }

  private DatabaseClient getDatabaseClient() {
    return hubConfig.newStagingClient();
  }

  @AfterEach
  void tearDown() {

  }

  @BeforeEach
  void setup() throws Exception {
    String loginPayload="{\"username\":\""+MLUSERNAME+"\",\"password\":\""+MLPASSWORD+"\"}";

    this.mockMvc.perform(post("/login").contentType(MediaType.APPLICATION_JSON)
      .content(loginPayload))
      .andExpect(status().isOk());

    session = new MockHttpSession();

    session.setAttribute(SESSION_USERNAME_KEY, MLUSERNAME);
    session.setAttribute(SESSION_SERVICE, authService.getService());
  }

  @Test
  void testCustomStep() throws Exception {
    try {
      String inputFile = "FullTest/input1.json";
      assertNotNull("Input1.json not found", this.getInputStreamHandle(inputFile));
      ingestTestFile(inputFile);
      inputFile = "FullTest/input2.json";
      assertNotNull("Input2.json not found", this.getInputStreamHandle(inputFile));
      ingestTestFile(inputFile);
      String sourceCode = compile("FullTest/graph.json");
      publishCustomStepSourceCode("TestStep",sourceCode);
      runFlow("TestFlow");
    } finally {
      //removeTestDocuments();
    }
  }

  private void runFlow(String flowName) throws Exception {
    try {
      HubConfigImpl hc = new HubConfigImpl("localhost", MLUSERNAME, MLPASSWORD);
      hc.setPort(DatabaseKind.STAGING,STAGING_PORT);
      hc.setDbName(DatabaseKind.STAGING,MLTESTDATABASE);
      FlowRunner flowRunner = new FlowRunnerImpl(hc);
      FlowInputs inputs = new FlowInputs(flowName);
      RunFlowResponse response = flowRunner.runFlow(inputs);
     // flowRunner.awaitCompletion();
      //System.out.println("Response: " + response);
    } catch (Exception e) {
      e.printStackTrace();
    }
  }

  private void publishCustomStepSourceCode(String customStepName,String sourceCode) throws Exception {
    String request = "/customSteps?name=" + customStepName + "&deploy=true";
    MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.post(request).content(sourceCode)
      .session(session);
    ResultActions resultActions = this.mockMvc.perform(builder)
      .andExpect(status().isOk());
    MvcResult result = resultActions.andReturn();
    assertEquals("Did not return OK",result.getResponse().getStatus(),200);
  }

  private String compile(String grahPath) throws Exception {
    InputStreamHandle graphHandle = getInputStreamHandle(grahPath);
    assertNotNull("graph.json not found for "+grahPath,graphHandle);

    String request="/v1/resources/vppBackendServices?rs:action=compile";

    MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.post(request).content(graphHandle.toString())
      .session(session);

    ResultActions resultActions = this.mockMvc.perform(builder)
      .andExpect(status().isOk());

    MvcResult result = resultActions.andReturn();

    JSONObject responseJson=new JSONObject(result.getResponse().getContentAsString());
    JsonNode errorsNode = responseJson.getNode("errors");
    assertTrue("Compilation errors",errorsNode.isNull());
    JsonNode sourceCodeNode = responseJson.getNode("sourceCode");
    assertNotNull("sourceCode not available",sourceCodeNode);
    assertTrue("Sourcecode should be a string",sourceCodeNode.getNodeType() == JsonNodeType.STRING);
    return sourceCodeNode.textValue();
  }
  /*
  @ParameterizedTest(name = "Interpreter: #{index} : {0}")
  @MethodSource("getDirectoryNames")
  void genericGraphTestsInterpreter(String argument) throws Exception {
    runGrahTests(argument,false);
  }
  @ParameterizedTest(name = "Compiler: #{index} : {0}")
  @MethodSource("getDirectoryNames")
  void genericGraphTestsCompiler(String argument) throws Exception {
    runGrahTests(argument,true);
  }
*/
  private void runGrahTests(String argument,boolean compiler) throws Exception {
    try {
      String ext = "json";
      String preview = TEST_INPUT_JSON;
      if ( argument.equals("XMLValidation")) {
        ext = "xml";
        preview = TEST_INPUT_XML;
      }
      String inputFile = "ExecuteGraphTests/"+argument+"/input."+ext;
      assertNotNull("Input.json not found for "+argument,this.getInputStreamHandle(inputFile));
      ingestTestFile(inputFile);

      InputStreamHandle graphHandle = getInputStreamHandle("ExecuteGraphTests/"+argument+"/graph.json");
      assertNotNull("graph.json not found for "+argument,graphHandle);
      JSONObject graphJO = new JSONObject(graphHandle.toString()
      );

      JSONObject payloadJO= new JSONObject();
      payloadJO.put("jsonGraph", graphJO);
      payloadJO.put("collectionRandom", false);
      payloadJO.put("previewUri",preview);


      InputStreamHandle expectedResponseHandle = getInputStreamHandle("ExecuteGraphTests/"+argument+"/expectedResponse.json");
      assertNotNull("expectedResponse.json not found for "+argument,expectedResponseHandle);
      JSONObject expectedJO=new JSONObject();
      expectedJO.put("result", new JSONObject(expectedResponseHandle.toString()));
      expectedJO.put("uri",preview);

      //extract the value part only from the expected returned graph
      JsonNode expectedResultJson= expectedJO.getNode("result");

      String request="/v1/resources/vppBackendServices?rs:action=ExecuteGraph&rs:compiler="+compiler+"&rs:database="+MLTESTDATABASE;

      MockHttpServletRequestBuilder builder = MockMvcRequestBuilders.post(request).content(payloadJO.toString())
        .session(session);

      ResultActions resultActions = this.mockMvc.perform(builder)
        .andExpect(status().isOk());

      MvcResult result = resultActions.andReturn();

      JSONObject responseJson=new JSONObject(result.getResponse().getContentAsString());
      JsonNode actualResponseResultJson= responseJson.getNode("result");

      // compare strings as JSON objects using Jackson ObjectMapper
      ObjectMapper mapper = new ObjectMapper();
      System.err.println("EXPECTED ");
      System.err.println(expectedResultJson.toString());
      System.err.println("GOT");
      System.err.println(actualResponseResultJson.toString());

      assertEquals("Response doesn't match expected",mapper.readTree(expectedResultJson.toString()), mapper.readTree(actualResponseResultJson.toString()));
    } finally {
      removeTestDocuments();
    }
  }

  private static Stream<String> getDirectoryNames() {
    InputStreamHandle ism= getInputStreamHandle("ExecuteGraphTests");
    String dirs[]=ism.toString().split("\n");
    // limit the test set
    //dirs=new String[]{"Padding"};
    return Arrays.stream(dirs);
  }

}
