package com.marklogic.pipes.ui.version;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.stream.Stream;

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

    String expectedResponse=readVersionFile();

    this.mockMvc.perform(get("/version"))
      .andExpect(content().string(equalToCompressingWhiteSpace(expectedResponse)));
  }

  private static String readVersionFile() throws IOException {
    StringBuilder buf = new StringBuilder();
    try (Stream<String> stream = Files.lines( Paths.get("src/main/resources/version.txt"), StandardCharsets.UTF_8))  {
      stream.forEach(s -> buf.append(s).append("\n"));
    }
    return buf.toString();
  }
}
