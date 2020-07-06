# Customer 360

This example that shows how to create instances of 2 entities (Customer and Address) from a single CSV table using a basic Pipes graph.

## Prerequisites:

- Download Pipes: https://github.com/marklogic-community/pipes/releases/tag/1.3

- Download DHF 5.2.1 QuickStart UI: https://github.com/marklogic/marklogic-data-hub/releases/download/v5.2.1/marklogic-datahub-5.2.1.war

- Running MarkLogic server 10.0-2 and higher. Make sure ports 8015, 8016 and 8017 are not used by any existing endpoints in MarkLogic.

## How to install

- Run the QuickStart UI (marklogic-datahub-5.2.1.war). For instructions how, have a look here: https://docs.marklogic.com/datahub/projects/create-project-using-quickstart.html

- Run Pipes (marklogic-pipes-1.3.jar). For instructions how, have a look here: https://github.com/marklogic-community/pipes#great-how-do-i-run-it

After this, assuming you have the QuickStart UI running on port 8080 and Pipes running on 8081:

- Go to http://localhost:8080
- Browse to this project folder. Use QuickStart to initialize this project and then deploy the application.

## Run the Customer360 flow

There is one flow defined with two steps:
- **Ingestion**: customer-source
- **Custom**: harmonize-customer360

The ingestion step will ingest a CSV with synthetic customer data: [data/MOCK_DATA.csv](data/MOCK_DATA.csv)

The Custom step has been implemented using Pipes and it will process JSON documents created in the ingest step to produce documents in final for the Customer and Address entities. 

The data model (entities) are defined on the tab "Entities" in the QuickStart UI.

Run the flow (both steps) and, as a result, you should see 1000 Customer and 1000 Address documents in the FINAL database.

## Check out the Pipes graph for the custom step

- Go to Pipes on http://localhost:8081
- In the top bar click on the "Upload graph..." button (2nd from the left)
- Drag and drop the Customer360 graph which can be found here: [pipes-graphs/Customer360-demo-graph-01.3_.json](pipes-graphs/Customer360-demo-graph-01.3_.json)
- You can run a preview for this graph if you click on the "Preview..." button (4th from the right):
    - select the Custom Step option in the radio
    - from the drop-down select "harmonize-customer360"
    - click on "Continue"
    - click on "Continue" (yes, again)
    - click on "EXECUTE PREVIEW"
    - enjoy the result
