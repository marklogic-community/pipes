package com.marklogic.pipes.ui.version;

import com.marklogic.pipes.ui.Application;
import org.springframework.stereotype.Component;

import java.io.InputStream;

@Component
public class Service {

  final String VERSIONFILE="/version.txt";
  public String get() {

    final InputStream is = Application.class.getResourceAsStream(VERSIONFILE);
    return is.toString();

  }
}
