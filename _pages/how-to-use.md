---
layout: inner
title: How to Use Pipes
lead_text: ''
permalink: /how-to-use/
---

# How Do I Use It?

## Define the entities model in DHF

Pipes creates custom step code for your MarkLogic DataHub flows.

Let's create a custom code which will read in sample customer records and produce instances of Customer and Address entities, based on this data.

As a basis, we'll use a sample DHF project defined in [Examples/Customer360](https://github.com/marklogic-community/pipes/tree/master/Examples/Customer360).

If we deploy this project on a MarkLogic server and run DHF QS UI, we'll see the definition of Customer and Address entities, like below:

![](../images/how-to-use/dhf-entities.png)

The Customer360 project already comes with pre-defined flow and steps so you can skip ahed to [Ingest Data](#Ingest-Data)

## Create the flow

Now that we have the data model defined, let's create a flow to ingest data and transform it using a custom step created with Pipes.

In the DHF QuickStart, click on the Flows tab and then on the "NEW FLOW" button. Create a flow called Customer360. You should see this:

![](../images/how-to-use/dhf-flow-empty.png)

## Add ingest and custom steps

Now click on the flow name (Customer360) to go into the flow definition. It will be empty and look like this:

![](../images/how-to-use/dhf-flow-inside-empty.png)

Now, let's add an Ingest step. Click on "NEW STEP" and define the step as shown in the picture below:

![](../images/how-to-use/dhf-flow-new-ingest-step.png)

When you clean on "SAVE", you should see this:

![](../images/how-to-use/dhf-flow-ingest-step.png)

Configure the Source Directory Path to the folder that contains the MOCK_DATA.csv file. Set "Delimited Text" as Source Format, Field Separator is "," and Target Format should be "JSON".

Let's add a custom step now. As before, click on "NEW STEP" and define a Custom (type: Other) step.

Let's name it "customer-address-custom", and select "Customer-Source" as the Source Collection. Select "Customer" or "Address" as the Target Entity:

![](../images/how-to-use/dhf-flow-creating-custom-step.png)

Click on save and you will see:

![](../images/how-to-use/dhf-flow-full.png)

## Ingest data

Click on the "RUN", deselect the "customer-address-custom" checkbox and click the "RUN" button.

![](../images/how-to-use/dhf-flow-run-ingest.png)

Once the ingest finishes, click on the "Browse Data" tab to check that the data has been ingested as expected. You should see 1000 documents in the "customer-source" collection:

![](../images/how-to-use/dhf-browse-staging-data.png)

Congratulations, you've ingested data into MarkLogic. Now, let's transform it with Pipes.

## Build a graph in Pipes for the custom step using ingested data




## Save the custom step code from Pipes into the DHF project

## Run the custom step


