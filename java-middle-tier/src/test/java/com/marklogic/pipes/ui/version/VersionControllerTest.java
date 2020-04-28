package com.marklogic.pipes.ui.version;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.equalToCompressingWhiteSpace;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "/test.properties")
@AutoConfigureMockMvc
class VersionControllerTest {

  @Autowired
  private MockMvc mockMvc;

  @Test
  void testSanity() throws Exception {
    this.mockMvc.perform(get("/version")).andExpect(status().isOk());
  }

  @Test
  void testResponse() throws Exception {

    String expectedResponse="Pipes version: 1.0.1-dev-build-1-g5620a6a\n" +
      "Build: 5620a6a\n";

    this.mockMvc.perform(get("/version"))
      .andExpect(content().string(equalToCompressingWhiteSpace(expectedResponse)));
  }

}
