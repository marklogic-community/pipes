package com.marklogic.pipes.ui.customStep;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@TestPropertySource(locations = "/test.properties")
class CustomStepServiceTest {

    @Autowired
    CustomStepService customStepService;

    @Test
    void accessDhfRootAndGetCustomStepsJson() throws IOException {
      CustomStepResponse customStepResponse=customStepService.accessDhfRootAndGetCustomStepsJson();

      assert customStepResponse.getCustomSteps().size()==3;

    }
}
