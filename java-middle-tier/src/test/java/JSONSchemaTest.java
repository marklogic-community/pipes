
import org.everit.json.schema.Schema;
import org.everit.json.schema.ValidationException;
import org.everit.json.schema.loader.SchemaLoader;
import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.junit.jupiter.api.Test;

import java.io.IOException;

import static org.junit.jupiter.api.Assertions.*;

public class JSONSchemaTest {

  @Test
  public void givenInvalidInput_whenValidating_thenInvalid() throws ValidationException, IOException {
    JSONObject jsonSchema = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/schema.json")));
    JSONObject jsonSubject = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/product_invalid.json")));

    Schema schema = SchemaLoader.load(jsonSchema);


    Exception exception = assertThrows(ValidationException.class, () -> {
      schema.validate(jsonSubject);
    });
  }

  @Test
  public void givenValidInput_whenValidating_thenValid() throws ValidationException {
    JSONObject jsonSchema = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/schema.json")));
    JSONObject jsonSubject = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/product_valid.json")));

    Schema schema = SchemaLoader.load(jsonSchema);
    schema.validate(jsonSubject);
  }

  @Test
  public void validUser() throws ValidationException {
    JSONObject jsonSchema = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/user_schema.json")));

    JSONArray jsonArray=new JSONArray( new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/user_valid.json")));
    Schema schema = SchemaLoader.load(jsonSchema);

    for (Object member:jsonArray) {
      JSONObject jsonSubject = (JSONObject) member;
      schema.validate(jsonSubject);
    }
  }

  @Test
  public void invalidUser() throws ValidationException {
    JSONObject jsonSchema = new JSONObject(
      new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/user_schema.json")));

    Schema schema = SchemaLoader.load(jsonSchema);

    assertThrows(org.json.JSONException.class, () -> {
      JSONArray jsonArray=new JSONArray( new JSONTokener(JSONSchemaTest.class.getResourceAsStream("/json/user_invalid.json")));

      for (Object member:jsonArray) {
        JSONObject jsonSubject = (JSONObject) member;
        schema.validate(jsonSubject);
      }
    });
  }

}
