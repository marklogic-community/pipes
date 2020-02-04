/*
Copyright ©2020 MarkLogic Corporation.
*/
package com.marklogic.pipes.ui;

import com.marklogic.pipes.ui.config.ClientConfig;
import com.marklogic.pipes.ui.customStep.CustomStepService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurerAdapter;

import java.io.File;


@SpringBootApplication
public class Application {
  private static final Logger logger = LoggerFactory.getLogger(Application.class);

  @Autowired
  ClientConfig clientConfig;

  @Bean
  WebMvcConfigurer configurer () {
    return new WebMvcConfigurer() {
      @Override
      public void addResourceHandlers (ResourceHandlerRegistry registry) {

        // check if the property is set

        if(clientConfig.getCustomModulesRoot()!=null) {
          final String CUSTOM_JSON_NAME="user.json";
          final String customJsonPath=clientConfig.getCustomModulesRoot() +File.separator+CUSTOM_JSON_NAME;
          if ( !(new File(customJsonPath)).exists()) {
            logger.error(
              String.format("Trying to add a custom module at this location, but failing: \""+customJsonPath+"\". Check your application.properties. Pipes will not start."));
              System.exit(1);
          }
          else {
            // file exists, let's try to add it to resources
            registry.addResourceHandler("/statics/library/custom/**").
              addResourceLocations("file:"+customJsonPath).addResourceLocations().setCachePeriod(0);

            logger.info(
              String.format("Added custom module: \""+customJsonPath+"\". Don't forget to refresh your browser.")
            );
          }
        }
        else {
          registry.addResourceHandler("/resources/**")
            .addResourceLocations("/public", "classpath:/static/")
            .setCachePeriod(0);
        }


      }
    };
  }

	public static void main(final String[] args) {
		SpringApplication.run(Application.class, args);
	}

}
