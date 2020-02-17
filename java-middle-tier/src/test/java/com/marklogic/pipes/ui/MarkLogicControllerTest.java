/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.marklogic.client.DatabaseClient;
import com.marklogic.client.DatabaseClientFactory;
import com.marklogic.client.document.JSONDocumentManager;
import com.marklogic.client.io.DocumentMetadataHandle;
import com.marklogic.client.io.InputStreamHandle;
import com.marklogic.client.io.marker.DocumentMetadataWriteHandle;
import com.marklogic.pipes.ui.config.ClientConfig;
import org.aspectj.lang.annotation.After;
import org.aspectj.lang.annotation.Before;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import java.io.InputStream;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
class MarkLogicControllerTest {


    @Autowired
    private MockMvc mockMvc;

    @Autowired
    ClientConfig clientConfig;

    void setUpCustomerSource() throws Exception {
      DatabaseClient client = DatabaseClientFactory.newClient(
        clientConfig.getMlHost(),
        clientConfig.getMlStagingPort(),
        new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));

      JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

      // will create a customer document

      // get the doc from resources
      final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("customer1.json");
      InputStreamHandle handle = new InputStreamHandle(is);

      //Get the set of collections the document belongs to and put in array.
      DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
      DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

      collections.add("customer-source");

      // write
      jsonDocumentManager.write("/test/customer1.json", metadataHandle, handle);

      // release client
      client.release();
    }


    void deleteGraph() throws Exception {
      DatabaseClient client = DatabaseClientFactory.newClient(
        clientConfig.getMlHost(),
        clientConfig.getMlStagingPort(),
        new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));

      JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

      jsonDocumentManager.delete("/marklogic-pipes/savedGraph/test-save-graph.json");

      client.release();
    }

    void createGraph() throws Exception {
      DatabaseClient client = DatabaseClientFactory.newClient(
        clientConfig.getMlHost(),
        clientConfig.getMlStagingPort(),
        new DatabaseClientFactory.DigestAuthContext(clientConfig.getMlUsername(), clientConfig.getMlPassword()));

      JSONDocumentManager jsonDocumentManager = client.newJSONDocumentManager();

      // will create a customer document

      // get the doc from resources
      final InputStream is = Thread.currentThread().getContextClassLoader().getResourceAsStream("test-save-graph.json");
      InputStreamHandle handle = new InputStreamHandle(is);

      //Get the set of collections the document belongs to and put in array.
      DocumentMetadataHandle metadataHandle = new DocumentMetadataHandle();
      DocumentMetadataHandle.DocumentCollections collections = metadataHandle.getCollections();

      collections.add("marklogic-pipes/type/savedGraph");

      // write
      jsonDocumentManager.write("/marklogic-pipes/savedGraph/test-save-graph.json", metadataHandle, handle);

      // release client
      client.release();
    }

    @AfterEach
    void tearDown() {

    }

    @Test
    void mirrorRestGet() {
    }

  /**
   * Tests execution of a minimal graph (Input-Output) for a specific document URI in the staging DB
   * @throws Exception
   */
    @Test
    void mirrorRestPostExecuteMinimalGraph() throws Exception {
      String payload="{\"jsonGraph\":{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4}},\"collection\":\"customer-ingest\",\"collectionRandom\":false,\"previewUri\":\"/test/customer1.json\"}";
      String request="/v1/resources/vppBackendServices?rs:action=ExecuteGraph&rs:database=11948715645976432197";
      String response="{\"envelope\":{\"headers\":{\"sources\":[{\"name\":\"Customer360\"}], \"createdOn\":\"2020-01-21T16:04:45.849756Z\", \"createdBy\":\"admin\", \"createdUsingFile\":\"/Users/smitrovi/MarkLogic/dev/vpp-java-test/data/customer/dump1.csv\"}, \"triples\":[], \"instance\":{\"id\":\"652\", \"first_name\":\"Connie\", \"last_name\":\"Harnor\", \"email\":\"charnori3@ibm.com\", \"gender\":\"Male\", \"ip_address\":\"3.115.93.14\", \"dob\":\"14/05/2001\", \"street\":\"49 Killdeer Lane\", \"city\":\"Zhangjiapan\", \"zipcode\":\"\", \"country\":\"China\"}, \"attachments\":null}}";

      this.mockMvc.perform(post(request).content(payload)).andExpect(content().string(containsString(response)));

    }

  /**
   * Tests saving of a graph
   */
    @Test
    void SaveGraphTest() throws Exception {
      try {
        String payload="{\"models\":[],\"executionGraph\":{\"last_node_id\":2,\"last_link_id\":1,\"nodes\":[{\"id\":2,\"type\":\"dhf/output\",\"pos\":[1308,434],\"size\":[180,160],\"flags\":{},\"order\":1,\"mode\":0,\"inputs\":[{\"name\":\"output\",\"type\":0,\"link\":1}],\"properties\":{}},{\"id\":1,\"type\":\"dhf/input\",\"pos\":[248,489],\"size\":[180,60],\"flags\":{},\"order\":0,\"mode\":0,\"outputs\":[{\"name\":\"input\",\"type\":\"\",\"links\":[1]},{\"name\":\"uri\",\"type\":\"\",\"links\":null},{\"name\":\"collections\",\"type\":\"\",\"links\":null}],\"properties\":{}}],\"links\":[[1,1,0,2,0,0]],\"groups\":[],\"config\":{},\"version\":0.4},\"name\":\"test-save-graph\",\"metadata\":{\"title\":\"test-save-graph\",\"version\":\"00.01\",\"author\":\"\"}}";
        String request="/v1/resources/vppBackendServices?rs:action=SaveGraph";

        this.mockMvc.perform(post(request).content(payload)).andExpect(status().isOk());
      }
      finally {
        deleteGraph();
      }
    }

  /**
   * Tests loading a graph. It 1st creates a graph then tries to load. In the end, it will delete it, too.
   * @throws Exception
   */
  @Test
    void LoadGraph() throws Exception {
      try {
        createGraph();

        String request="/v1/resources/vppBackendServices?rs:action=GetSavedGraph&rs:uri=/marklogic-pipes/savedGraph/test-save-graph.json";
        String response="{\"models\":[], \"executionGraph\":{\"last_node_id\":2, \"last_link_id\":1, \"nodes\":[{\"id\":2, \"type\":\"dhf/output\", \"pos\":[1308, 434], \"size\":[180, 160], \"flags\":{}, \"order\":1, \"mode\":0, \"inputs\":[{\"name\":\"output\", \"type\":0, \"link\":1}], \"properties\":{}}, {\"id\":1, \"type\":\"dhf/input\", \"pos\":[248, 489], \"size\":[180, 60], \"flags\":{}, \"order\":0, \"mode\":0, \"outputs\":[{\"name\":\"input\", \"type\":\"\", \"links\":[1]}, {\"name\":\"uri\", \"type\":\"\", \"links\":null}, {\"name\":\"collections\", \"type\":\"\", \"links\":null}], \"properties\":{}}], \"links\":[[1, 1, 0, 2, 0, 0]], \"groups\":[], \"config\":{}, \"version\":0.4}, \"name\":\"test-save-graph\", \"metadata\":{\"title\":\"test-save-graph\", \"version\":\"00.01\", \"author\":\"\"}}";

        this.mockMvc.perform(get(request)).andExpect(content().string(response));

      }
      finally {
        deleteGraph();
      }

    }

    @Test
    void mirrorRestPut() {
    }

    @Test
    void mirrorRestDelete() {
    }
}
