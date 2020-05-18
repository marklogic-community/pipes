---
layout: inner
title: Connect
lead_text: ''
permalink: /components/connect/
---

# Connect

Connect provides a whiteboard like canvas for modeling the key business concepts required to solve a business problem by expressing them as entities and relationships.  

As the model is created, entity services descriptors are generated in the MarkLogic Data Hub that can be used for mapping and harmonizing source data.

When creating an entity, you can add an "Entity" or a "Concept" to the whiteboard.  Entities result in an entity services model and will be persisted as the model and subsequently as harmonized records in the data hub. Concepts are projections of a property value from an entity.  Concepts result in a Semantics triple in the system.  

Simply put, on the modeling canvas: solid line circles are documents, dotted line circles are IRIs.
<br><br> 
![Connect](/envision/images/ConnectGH.png)
<br><br>

### Getting Started

If you are working with an existing data hub, the first time you open Connect you will see your current model displayed.  You can now name relationships and edit the model and whatever you edit or append will be roundtripped back to the data hub.

If you are starting from scratch, as you create the new model, it will be stored in the data hub.

Note: Whenever you change models in Connect, the model in the hub is also updated. Connect only allows you to use one model at a time in the data hub.  

### Defining Connections between Entities
A key is required to connect entities.

Assuming the data is coming from csv files, then it will not be far-fetched to expect the existence of a key in the values to join the data.  The property names don't have to be the same, but there must be a value in each entity that you can point to and say "If the value for EntityA.property and EntityB.property are equal, then the relationship exists.

For this to work, the following conditions must be met in the model:

* An identifier must be defined for one of the 2 entities participating in a connection with each other 
The identifier sets the property to be used as the unique id for an entity
Identifiers for an entity in the Connect app can be arrays

* A property name for the key MUST exist in both entities.  
An Order has an orderId related to a Product with an orderId
This property name does not need to be the same in both entities
The value for the properties defined is what is important for making the connection
Order.orderId, Product.ord_id == GOOD!

### Making the Connection
Ideally, we’ll have ways to define relationships by more complex rules, but we are just getting started and for our purposes, this is sufficient to make our beginning.

#### **Create an id for an Entity** 
  * Select an entity from the Connect canvas
  * Select the ‘INFO tab for that entity
  * Select the property for the selected Entity to be used as its identifier.
<br><br> 
![Create an id.](/envision/images/connect-1.png)
<br><br>
  * Once set, the property used as the identifier will be noted with an ‘id’ in the properties pane.
<br><br> 
![View in Properties Pane.](/envision/images/connect-2.png)
<br><br>

#### **Define the join keys for the Relationship**
  * Select an entity from the Connect canvas
  * Select the ‘RELATIONSHIPS’ tab for that entity
  * Click the pencil icon to edit the relationship you wish to define the key for
  * For the key fields, select the property from the dropdown properties from each list that exists in the ‘Target Entity’ that points back to the ‘From Entity’
  * If one of these entities does not have an identifier defined, an error message will be displayed. You will not be able to link the entities until you define an identifier for one of the entities.
  * Click ‘SAVE’
<br><br> 
![Define Join Keys.](/envision/images/connect-3.png)
<br><br>

#### **Setting the Label for What is Visualized in the Concept Explorer**
  * The label is set in Concept Connector.  You can change the label here at any time to change what the label is in the Concept Explorer.
  * Select an entity from the Connect canvas
  * Select the ‘INFO’ tab
  * Select the ‘Entity Label’ from the dropdown menu
<br><br> 
![Setting Node Label.](/envision/images/connect-4.png)
<br><br>

 


