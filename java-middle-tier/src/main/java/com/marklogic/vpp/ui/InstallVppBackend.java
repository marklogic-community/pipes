package com.marklogic.vpp.ui;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;

import org.apache.commons.io.FileUtils;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.*;
import org.springframework.stereotype.*;

/**
 * InstallVppBackend
 */
@Component
public class InstallVppBackend implements ApplicationRunner {

  @Autowired
  ClientConfig clientConfig;

  @Override
  public void run(ApplicationArguments args) throws Exception {

    boolean deployBackend = args.containsOption("deployBackend");

    if (deployBackend) {
      LoggerFactory.getLogger(getClass()).info(
        String.format("Will deploy MarkLogic backend modules to following DHF root: %s", clientConfig.getMlDhfRoot()));

      final String resourcesDhfRoot = "/dhf/src/main/ml-modules";
      final String destinationDhfRoot = "/src/main/ml-modules";

      ArrayList<String> filePaths = new ArrayList<String>(
        Arrays.asList(
          "/root/custom-modules/core.sjs",
          "/root/custom-modules/entity-services-lib-vpp.sjs",
          "/root/custom-modules/google-libphonenumber.sjs",
          "/root/custom-modules/graphHelper.sjs",
          "/root/custom-modules/litegraph.sjs",
          "/root/custom-modules/moment-with-locales.min.sjs",
          "/root/custom-modules/user.sjs",
          "/services/vppBackendServices.sjs"
        ));


      for (final String filePath : filePaths) {
        final InputStream is = Proxy.class.getResourceAsStream(resourcesDhfRoot + filePath);
        final File dest = new File(clientConfig.getMlDhfRoot() + destinationDhfRoot + filePath);

        try {
          FileUtils.copyInputStreamToFile(is, dest);
        } catch (final IOException e) {
          // TODO Auto-generated catch block
          e.printStackTrace();
          System.out.println(e.toString());
        }
      }
    }



  }


}
