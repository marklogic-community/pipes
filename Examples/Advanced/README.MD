# Advanced examples

## Prerequisites:

- Download Pipes: https://github.com/marklogic-community/pipes/releases/tag/1.0.1

- Download DHF 5.2.1 QuickStart UI: https://github.com/marklogic/marklogic-data-hub/releases/download/v5.2.1/marklogic-datahub-5.2.1.war

- Running MarkLogic server 10.0-2 and higher. Make sure ports 8025, 8026 and 8027 are not used by any existing endpoints in MarkLogic.


## How to install

- Run the QuickStart UI (marklogic-datahub-5.2.1.war). For instructions how, have a look here: https://docs.marklogic.com/datahub/projects/create-project-using-quickstart.html

- Run Pipes (marklogic-pipes-1.0.1.jar). For instructions how, have a look here: https://github.com/marklogic-community/pipes#great-how-do-i-run-it

After this, assuming you have the QuickStart UI running on port 8080 and Pipes running on 8081:

- Go to http://localhost:8080
- Browse to this project folder. Use QuickStart to initialize this project and then deploy the application.


### **Example 1 - FAERS Safety Reports (a pharmaceutical data example)**

This example  shows how to create instances for 3 different entities (Safety Report, Reaction and Drug) from single complex XML records originating from the FDA Adverse Event Reporting System (FAERS). We will be using MarkLogic and Pipes for MarkLogic Data Hub to do this. This data contains reports about patients experiencing one or multiple adverse events after taking certain medication(s).

#### Data model
- SafetyReport
- Drug
- Reaction

#### Run the SafetyReport flow

There is one flow defined with two steps:
- **Ingestion**: safety-report-source
- **Custom**: transform-safety-reports

The ingestion step will ingest several XML documents from here: [data/SafetyReports](data/SafetyReports/)

Each document contains one safety report with patient data, one or more adverse effects (reactions) and more or more drugs that the patient took.

The Custom step has been implemented using Pipes and it will process the JSON documents created in the ingest step to produce documents in final for the Safety Report, Reaction and Drug entities. 

The data model (entities) are defined on the tab "Entities" in the QuickStart UI.

Run the flow (both steps) and, as a result, you should see 86 documents in the SafetyReport collection in FINAL database.

#### Check out the Pipes graph for the custom step

##### What's interesting about this graph?
It uses one source and produces multiple documents on the output. There is always going to be 1 instance of the SafetyReport entity and multiple instance for both Drug and Reaction entities.

##### Load and run it in Pipes

- Go to Pipes on http://localhost:8081
- In the top bar click on the "Upload graph..." button (2nd from the left)
- Drag and drop the graph which can be found here: [SafetyReport-00.01.json](pipes-graphs/SafetyReport-00.01.json)
- You can run a preview for this graph if you click on the "Preview..." button (4th from the right):
    - select the Custom Step option in the radio
    - from the drop-down select "transform-safety-reports"
    - click on "Continue"
    - click on "Continue" (yes, again)
    - click on "EXECUTE PREVIEW"
    - enjoy the result


### **Example 2 - Contractor360**

This example shows how to create one resulting instance of the Contractor entity that takes value from 2 different collections via lookups. The source data is:
- a list of companies (contractors) doing business with a city
- list of business persons associated with the company (owner, secretary etc.) as entered in the company register

Effectively, the custom step produced with Pipes here joins documents from 2 collections to produce the resulting document.

#### Data model
- Contractor
- BusinessPerson

#### Run the Contractor360 flow

There is one flow defined with two steps:
- **Ingestion 1**: contractor-source
- **Ingestion 2**: business-person-source
- **Custom**: harmonize-contractor360

The ingestion steps will each ingest CSV files from:
- [data/Businesses/Contractors](data/Bussineses/Contractors/)
- [data/Businesses/Owners](data/Bussineses/Owners/)


The data model (entities) are defined on the tab "Entities" in the QuickStart UI.

Run the flow (both steps) and, as a result, you should see 4989 documents in the Contractor collection in FINAL database.


#### Check out the Pipes graph for the custom step

##### What's interesting about this graph?
It joins documents from different collections and packages the results into 1 resulting target entity (Contractor)

##### Load and run it in Pipes

- Go to Pipes on http://localhost:8081
- In the top bar click on the "Upload graph..." button (2nd from the left)
- Drag and drop the  graph which can be found here: [pipes-graphs/Contractors360-00.01.json](pipes-graphs/Contractors360-00.01.json)
- You can run a preview for this graph if you click on the "Preview..." button (4th from the right):
    - select the Custom Step option in the radio
    - from the drop-down select "harmonize-contractor360"
    - click on "Continue"
    - click on "Continue" (yes, again)
    - click on "EXECUTE PREVIEW"
    - enjoy the result
