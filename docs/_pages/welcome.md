---
layout: inner
title: Envision
lead_text: ''
permalink: /
---

# Envision for MarkLogic Data Hub
<p>Envision for MarkLogic Data Hub provides a visual data modeler and two graphical explorers for harmonized and connected data in your true multi-model data hub.</p>
Use **Connect** to model your data visually, **Explore** to view your harmonized data graph along with provenance, and **Know** to search and navigate your semantics ontology.
## Integration with MarkLogic Data Hub
Envision integrates requires **[MarkLogic Data Hub Framework](https://github.com/marklogic/marklogic-data-hub/releases)** 5.1 or greater and **[MarkLogic 10](https://developer.marklogic.com/products/marklogic-server/10.0)** or greater. It will work with on-prem data hubs as well as with cloud including MarkLogic Data Hub Service (DHS)

You can use Connect to create models that you can visualize in Explore with new as well as existing data hubs.  Know provides a visualization for Semantics triples only.
<br>
### Run the jar

The jar is configured so that you can drop it into a DHF project directory and run it there.

`java -jar envision.jar`

_Note: models will be saved in a directory, /conceptConnectorModels, sibing to the .jar file.  You can move your existing models here or see below for how to specify a different models directory._

If you need to point it at another folder where the DHF is installed, run like so:

`java -DdhfDir=/full/path/to/your/datahub -jar envision.jar`

If you have existing Connect models you'd like to use you can also specify a different models directory:

`java -DdhfDir=/full/path/to/your/datahub -DmodelsDir=/full/path/to/your/models/dir -jar envision.jar`

And if you need to specify the DHF environment (it defaults to local):

`java -DdhfEnv=prod -DdhfDir=/full/path/to/your/datahub -DmodelsDir=/full/path/to/your/models/dir -jar envision.jar`
