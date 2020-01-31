package com.marklogic.pipes.ui.config;

import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.EnableWebMvc;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;


@Configuration
@EnableWebMvc
public class MvcConfig implements WebMvcConfigurer {

  @Autowired
  ClientConfig clientConfig;

  @Override
  public void addResourceHandlers(ResourceHandlerRegistry registry) {
    // does the user want to serve their own customizations: user.sjs and user.json?
    // check for the existence of this setting in application.properties
    if (clientConfig.getCustomUserRoot()!=null ) {
      String userJsonFilePath=clientConfig.getCustomUserRoot()+File.separator+"statics"+File.separator+"library"+File.separator+"user.json";
      //property is set
      if ( (new File(userJsonFilePath)).exists() ) {
        // file exists
        registry
          .addResourceHandler("/statics/library/user.json")
          .addResourceLocations("file:"+userJsonFilePath); // this will work on *nix but what about windows?
      }
      else {
        LoggerFactory.getLogger(getClass()).info(
          String.format("You're trying to load custom resources but it looks like this file doesn't exist: "+ userJsonFilePath));
        LoggerFactory.getLogger(getClass()).info(
          String.format("Pipes not able to start, check your application.properties"));
        System.exit(1);
      }

    }



  }
}
