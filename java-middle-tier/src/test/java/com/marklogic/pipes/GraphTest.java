/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

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

  void removeCustomerSource() throws Exception {
    DatabaseClient client = getDatabaseClient();
    JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();
    jsonDocumentManager.delete(TEST_INPUT_JSON);
    XMLDocumentManager xmlDocumentManager = client.newXMLDocumentManager();
    xmlDocumentManager.delete(TEST_INPUT_XML);
  }

  void addCustomerSourceDocument(String s) throws Exception {
    DatabaseClient client = getDatabaseClient();
    try {
      String file = TEST_INPUT_JSON;
      DocumentManager dm = client.newJSONDocumentManager();
      if ( s.endsWith(".xml")) {
        dm = client.newXMLDocumentManager();
        file = TEST_INPUT_XML;
      }

      // will create a customer document

      // get the doc from resources
      InputStreamHandle handle = getInputStreamHandle(s);

      //Get the set of collections the document belongs to and put in array.
      DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
      DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

      collections.add(TEST_SOURCE_COLLECTION);

      // write
      dm.write(file, metadataHandle, handle);

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
      addCustomerSourceDocument(inputFile);

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
     // removeCustomerSource();
    }
  }

  private static Stream<String> getDirectoryNames() {
    InputStreamHandle ism= getInputStreamHandle("ExecuteGraphTests");
    String dirs[]=ism.toString().split("\n");
    // limit the test set
   // dirs=new String[]{"XMLValidation"}; // ,"","","","",""};
    return Arrays.stream(dirs);
  }

}
