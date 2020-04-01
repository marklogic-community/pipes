package com.marklogic.pipes.ui;

import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.customStep.CustomStepController;
import com.marklogic.pipes.ui.customStep.CustomStepService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultHandlers.print;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CustomStepController.class)
class CustomStepControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private CustomStepService customStepService;

    @BeforeEach
    void setUp() {

    }

    @AfterEach
    void tearDown() {
    }

    @Test
    void listOfCustomStepNames() {
    }

    @Test
    void deployCustomStep() {
    }

    @Test
    void shouldReturnAListOf3CustomSteps() throws Exception {
      String jsonExample="{\"customSteps\":[\"a\",\"b\",\"c\"]}";
      when(customStepService.accessDhfRootAndGetCustomStepsJson()).thenReturn(jsonExample);
      this.mockMvc.perform(get("/customSteps")).andDo(print()).andExpect(status().isOk())
        .andExpect(content().string(jsonExample));
    }
}
