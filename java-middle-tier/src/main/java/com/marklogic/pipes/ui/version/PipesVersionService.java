package com.marklogic.pipes.ui.version;

import com.marklogic.pipes.ui.Application;
import org.springframework.stereotype.Component;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;

@Component
public class PipesVersionService {

  final String VERSIONFILE="/version.txt";
  public String get() {

    final InputStream is = Application.class.getResourceAsStream(VERSIONFILE);

    try {
      return InputStreamToString(is);
    } catch (Exception e) {
      //assume file not existing, return a default value
      return "Pipes version: NO-VERSION\n" +
        "Build: NO-BUILD\n";
    }

  }

  public String InputStreamToString(InputStream is) throws IOException {
    InputStreamReader isReader = new InputStreamReader(is);
    //Creating a BufferedReader object
    BufferedReader reader = new BufferedReader(isReader);
    StringBuffer sb = new StringBuffer();
    String str;
    while((str = reader.readLine())!= null){
      sb.append(str+"\n");
    }

    return sb.toString();
  }
}
