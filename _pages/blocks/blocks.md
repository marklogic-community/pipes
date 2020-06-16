---
layout: inner
title: Blocks
permalink: /blocks/
---

This section introduces the blocks available in the Pipes default library.
# What is a block?
In Pipes, a block is a visual representation of a transformation which is applied to data.
A block has inputs and outputs, simple configuration options (via Widgets), and some also include advanced options which are accessed by double clicking on the block.

There are three different types of blocks:
## Source Blocks
A _Source block_ is a block you create by choosing fields from a data source, such as the documents in a particular collection. Source Blocks can then use these fields as either their inputs or outputs. The value of a field can be set by feeding data to it via its input, or you can use their existing values by connecting the outputs to the other blocks.
The most common way to use a Source Block is to feed it a node (such as the incoming document from the DHF Customer Step) and the values the fields defined in the block will be automatically filtered and sent out as the outputs. We'll look at all the options for Source Blocks in more detail later.

## Entity Blocks
An _Entity Block_ represents a business entity which has been created in your MarkLogic DHF project. You can create a new Entity by feeding properties of the entity in as inputs and the output side of the block will automatically output an Entity was a node. 
More information about Entity Services can be [found here](https://developer.marklogic.com/learn/entity-services/)

## Function Blocks
A _Function Block_ takes one or more inputs and applies some logic before returning the result through the outputs. Pipes contains a standard library of function blocks that can be used to transform data - right click on the canvas to see the library. If you need a new Function Block you have two options:
* Add a request here in [Issues](https://github.com/marklogic-community/pipes/issues) to ask the community for this block
* Create a custom block with your own logic (see [Creating custom user block for developers](https://github.com/marklogic-community/pipes/wiki/4.-Creating-custom-user-blocks-for-developers))




# Missing a block?
Don't hesitate to suggest new blocks by creating a ticket on this project.

_Blocks with * in the name are not available yet._

***

