/*
Copyright ©2020 MarkLogic Corporation.
*/

package com.marklogic.pipes.ui;

import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.version.PipesVersionService;
import org.everit.json.schema.Schema;
import org.everit.json.schema.ValidationException;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.web.embedded.tomcat.TomcatServletWebServerFactory;
import org.springframework.boot.web.server.ErrorPage;
import org.springframework.boot.web.servlet.server.ConfigurableServletWebServerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.*;

@SpringBootApplication(scanBasePackages = { "com.marklogic.hub", "com.marklogic.pipes" })
public class Application {
  private static final Logger logger = LoggerFactory.getLogger(Application.class);

  @Autowired
  ClientConfig clientConfig;

  @Autowired
  PipesVersionService pipesVersionService;

  @Bean
  WebMvcConfigurer configurer() {
    return new WebMvcConfigurer() {
      @Override
      public void addResourceHandlers(ResourceHandlerRegistry registry) {

        // check if the property is set

        if (clientConfig.getCustomModulesRoot() != null) {
          final String CUSTOM_JSON_NAME = "user.json";
          final String customJsonPath = clientConfig.getCustomModulesRoot() + File.separator + CUSTOM_JSON_NAME;

          File userjson = new File(customJsonPath);

          if (!userjson.exists()) {
            logger.error(String.format("Trying to add a custom module at this location, but failing: \""
                + customJsonPath + "\". Check your application.properties. Pipes will not start."));
            System.exit(1);
          } else {
            // file exists, let's check the schema

            JSONObject jsonSchema = new JSONObject(
                new JSONTokener(Application.class.getResourceAsStream("/schema/user_schema.json")));

            Schema schema = SchemaLoader.load(jsonSchema);

            try {
              InputStream is = new FileInputStream(userjson);

              JSONArray jsonArray = new JSONArray(pipesVersionService.InputStreamToString(is));

              for (Object member : jsonArray) {
                JSONObject jsonSubject = (JSONObject) member;
                schema.validate(jsonSubject);
              }

            } catch (IOException e) {
              logger.error(String.format("Trying to add a custom module at this location, but failing: \""
                  + customJsonPath + "\". " + "Check your application.properties. Pipes will not start."));
              logger.error(e.getMessage());
            } catch (JSONException e) {
              logger.error(
                  String.format("Custom user module (%s) has invalid format. Pipes will not start.", customJsonPath));
              logger.error(e.toString());
              System.exit(1);
            }
            catch (ValidationException e) {
              logger.error(
                String.format("Custom user module (%s) has invalid format. Pipes will not start.", customJsonPath));
              logger.error(e.toString());
              System.exit(1);
            }

            // file exists, schema is OK, let's try to add it to resources
            registry.addResourceHandler("/statics/library/custom/**").addResourceLocations("file:" + customJsonPath)
                .addResourceLocations().setCachePeriod(0);

            logger.info(String
                .format("Added custom module: \"" + customJsonPath + "\". Don't forget to refresh your browser."));
          }
        } else {
          logger.info(
              "If you intend to use user blocks (user.json/user.sjs) then beware that this feature is unavailabe becase property customModulesRoot is not set in the application properties.");
          registry.addResourceHandler("/resources/**").addResourceLocations("/public", "classpath:/static/")
              .setCachePeriod(0);
        }

      }
    };
  }

  public static void main(final String[] args) {
    SpringApplication.run(Application.class, args);
  }

  /**
   * Copied from https://karl.run/2018/05/07/kotlin-spring-boot-react/ - ensures
   * that for a single page application, any non-root route is routed back to "/".
   *
   * @return
   */
  @Bean
  public ConfigurableServletWebServerFactory webServerFactory() {
    TomcatServletWebServerFactory factory = new TomcatServletWebServerFactory();
    factory.getErrorPages().add(new ErrorPage(HttpStatus.NOT_FOUND, "/"));
    return factory;
  }

}
