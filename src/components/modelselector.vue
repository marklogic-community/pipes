<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

  <div class="column gutter-sm">

      <div class="row">
        <div class="col-10">
              <q-btn @click="resetBlockFormFields();createBlockStep = 1"
            align="left" label="Start New Source Block" color="primary"/>
        </div>

        <div class="col-2" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                A source block lets you filter out, combine, or create data fields to be used in other parts of a graph
                </q-tooltip>
                </q-icon>
        </div>
      </div>

    <q-form @submit="notifyBlockRequested" dense>

    <q-stepper
      v-model="createBlockStep"
      vertical
      header-nav
      color="primary"
      animated
	    flat
      @transition="stepTransition"
    >

     <!--- STEP 1 BLOCK NAME -->
      <q-step
        :name="1"
        :title="stepTitleBlockName"
        icon="chat_bubble_outline"
        :done="createBlockStep > 1 && blockName !== null && blockName != ''"
        :error="createBlockStep > 1 && (blockName === null || blockName == '')"
        error-icon="error_outline"
      >

      <div class="row">
<!-- Help -->
        <div class="col-12" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                This name will appear in the title of your block. Use something simple that describes the type of data your block will handle
                </q-tooltip>
                </q-icon>
        </div>
      </div>

       <q-input style="font-size: 1.5em"
       ref="blockName"
       bottom-slots
       v-model="blockName"
       label="what's your block called?"
       @keydown.enter.prevent="createBlockStep = 2"
       maxlength="29"/>

      <q-input style="font-size: 1.2em"
	  ref="blockDescription"
	  bottom-slots
	  dense
	  v-model="blockDescription"
	  label="description (optional)"
	  maxlength="80"/>

        <q-stepper-navigation>
          <q-btn :disabled="cleanBlockName() == ''" @click="createBlockStep = 2" color="green" label="Next"></q-btn>
        </q-stepper-navigation>
      </q-step>

 <!--- STEP 2 Source for fields: DHF STEP, DATABASE/COLLECTIONS -->
      <q-step
        :name="2"
        :title="stepTitleDataSource"
        icon="create_new_folder"
        :done="createBlockStep > 2 && dataSourceNextOk"
        :error="createBlockStep > 2 && ! dataSourceNextOk"
        error-icon="error_outline"
      >
      <!-- Help -->
      <div class="row">
        <div class="col-11" align="left" style="font-size: 1.1em">
          Choose where Pipes will look for fields to build the block:
        </div>
        <div class="col-1" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                Source blocks need some fields to be useful. Pipes can sample the documents in a database Collection or use the fields from specific documents in order to build a list of data fields to choose for your block.
                </q-tooltip>
                </q-icon>
        </div>
        </div>

          <q-option-group
          color="blue"
          type="radio"
          v-model="blockSourceOption"
          @input="sourceOptionChanged"
          :options="[
            { label: 'Use the settings from a DHF custom step', value: 'custom_step' },
            { label: 'Sample the documents in a database collection', value: 'db_collection' },
			{ label: 'Do not use fields from existing data. You can still add custom fields', value: 'none' },
          ]"
    > </q-option-group>

<div v-if="blockSourceOption == 'custom_step'">
  <q-select dense outlined v-model="selectedStep" :options="dhfStepSelectOptions" label="Select custom step" />

</div>

<div v-if="blockSourceOption == 'db_collection'">
    <q-select
      name="databaseSelector"
      v-model="selectedDatabase"
      :options.sync="availableDatabases"
      @input="databaseChanged"
      filled
      separator
      label="Source database"
      stack-label
    >

   <q-tooltip v-if="helpMode" self="center right" content-class="tool-tip" v-model="toolTips">
     Database
   </q-tooltip>
       <template v-slot:prepend>
        <q-icon name="fas fa-database"/>
      </template>
    </q-select>

    <q-select
      name="collectionSelector"
      v-model="selectedCollection"
      :options.sync="availableCollections"
      @input="collectionChanged"
      filled
      separator
      label="Source collection"
      stack-label
    >
    <template v-slot:prepend>
        <q-icon name="fas fa-tags">
        </q-icon>
      </template>
    </q-select>

    </div>

  <div class="row">
    <div class="col-11" align="left">
	    <q-checkbox color="blue" v-model="showCustomURIPanel">Add fields from specific document(s) in the database</q-checkbox>
    </div>
    <div class="col-1" align="right">
	    <q-icon v-if="collectionModelPopulated == true" color="green" name="fas fa-check-circle">
		    <q-tooltip content-class="pipes-tooltip">Some fields have been sampled and are ready in next step</q-tooltip>
	    </q-icon>
	    <q-icon v-if="collectionModelPopulated == false" color="grey" name="fas fa-check-circle">
		    <q-tooltip content-class="pipes-tooltip">No document fields sampled yet based on current selection</q-tooltip>
	    </q-icon>
    </div>
  </div>

	<div v-if="showCustomURIPanel">
		 <q-input bottom-slots v-model="customURI" label="Document URI (can enter multiple, space separated)" @keydown.enter.prevent="addURIToList">
      <template v-slot:append>
        <q-btn round dense flat icon="play_arrow" @click="addURIToList">
            <q-tooltip content-class="pipes-tooltip">Add URI</q-tooltip>
         </q-btn>
      </template>
    </q-input>

    <q-list dense class="rounded-borders">
      <q-item v-for="item in customURIList" :key="item.uri">

        <q-item-section avatar>
          <q-icon class="text-green" v-if="item.exists" name="far fa-check-circle"/>
          <q-icon class="text-red" v-if="! item.exists" name="error_outline">
              <q-tooltip content-class="pipes-tooltip" v-if="!item.exists">No document with this URI exists in the database</q-tooltip>
          </q-icon>
        </q-item-section>
        <q-item-section>
          {{ item.uri }}
        </q-item-section>
        <q-item-section side>
           <q-btn round dense icon="remove" @click="removeURIFromList(item.uri)">
              <q-tooltip>Remove from list</q-tooltip>
           </q-btn>
        </q-item-section>
      </q-item>
    </q-list>

	</div>

    <q-stepper-navigation>
     <q-btn @click="createBlockStep = 1" color="primary" label="Back" class="q-ml-sm"></q-btn>
         <q-btn :disabled="! dataSourceNextOk" @click="createBlockStep = 3" color="green" label="Next"  class="q-ml-sm"></q-btn>
    </q-stepper-navigation>

      </q-step>

 <!-------- STEP 3 Select Fields ------>
      <q-step
        :name="3"
        :title="stepTitleFields"
        icon="assignment"
        :done="createBlockStep > 3"
        error-icon="error_outline"
        :error="createBlockStep > 3 && selectedFields.length == 0"
      >
     <!-- Help -->
        <div class="row">
        <div class="col-11" align="left" style="font-size: 1.1em">
          Choose 1 or more fields for the block:&nbsp; <b>{{ selectedFields.length }}</b>&nbsp;fields selected.
        </div>
        <div class="col-1" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                Choose from the document fields sampled from the database, or create your own custom fields. Custom fields let you add a new data field with any name you like.
                </q-tooltip>
                </q-icon>
        </div>
        </div>

  <div class="row">

    <div class="col-1" align="left" style="padding: 0px; margin: 0px;">

		<div class="row">
			<div class="col-2">
			<q-btn dense flat style="padding: 0px; margin: 0px;">
      			<q-icon style="font-size: 1.5em;padding: 0px; margin: 0px;" name="fas fa-minus" @click="$refs.selectionTree.collapseAll()">
            	<q-tooltip content-class="pipes-tooltip">Collapse All</q-tooltip>
    			</q-icon>
			</q-btn>
			</div>
		</div>
		<div class="row">
			<div class="col-2">
			<q-btn dense flat style="padding: 0px; margin: 0px;">
				<q-icon style="font-size: 1.5em;padding: 0px; margin: 0px;" name="fas fa-angle-double-down" @click="$refs.selectionTree.expandAll()">
            	<q-tooltip content-class="pipes-tooltip">Expand All</q-tooltip>
      			</q-icon>
	  		</q-btn>
			</div>
		</div>
    <!--
	<div class="row">
			<div class="col-2">
			<q-btn dense flat style="padding: 0px; margin: 0px;">
      			<q-icon style="font-size: 1.5em;padding: 0px; margin: 0px;" name="far fa-check-square" @click="$refs.selectionTree.collapseAll()">
            	<q-tooltip content-class="pipes-tooltip">Select All</q-tooltip>
    			</q-icon>
			</q-btn>
			</div>
		</div>
    -->
    </div>

    <div class="col-11" align="left">

    <q-tree class="spacer-div"
      ref="selectionTree"
      :nodes="collectionModel"
      node-key="label"
      tick-strategy="strict"
      :ticked.sync="selectedFields"
	  control-color="blue"
	  style="font-size: 1.0em; padding-left: 0px;"
    >

    </q-tree>
    </div>

   </div>

    <q-input style="font-size: 1.5em" ref="customFieldName" maxlength="90" bottom-slots v-model="newCustomFieldName" label="Custom field name (Enter to add to list)"
     :rules="[ val => (cleanCustomFieldName(val).length >= 0 ) || 'Invalid field name']"
     @keydown.enter.prevent="addCustomField" @blur="resetCustomFieldValidation()">

      <template v-slot:append>
        <q-btn round dense icon="add" :disabled="cleanCustomFieldName() == ''" @click="addCustomField"/>
      </template>

    </q-input>

<div>
   <q-tooltip v-if="this.selectedFields.length == 0" content-style="pipes-tooltip">
         A block must have one or more fields
   </q-tooltip>
<q-stepper-navigation>
      <q-btn @click="createBlockStep = 2" color="primary" label="Back" class="q-ml-sm"></q-btn>

       <q-btn :disabled="this.selectedFields.length < 1"
       @click="tickedNodes = $refs['selectionTree'].getTickedNodes(); createBlockStep = 4"
       color="green"
       label="Next"
       class="q-ml-sm">
       </q-btn>
  </q-stepper-navigation>
 </div>
    </q-step>

<!---- STEP 4 BLOCK Input/Output Options -->
  <q-step :name="4"
  title="Block Input/Output options"
  icon="compare_arrows"
  >
       <!-- Help -->
       <div class="row">
        <div class="col-11" align="left" style="font-size: 1.1em">

        </div>
        <div class="col-1" align="right" style="padding: 0px; margin: 0px;">
                <q-icon color="primary" style="font-size: 1.5em" name="far fa-question-circle">
                <q-tooltip content-class="pipes-tooltip tooltip-square">
                Choose which inputs and outputs your block will have to pass data to the rest of the graph. If you're not sure then just use the default.
                </q-tooltip>
                </q-icon>
        </div>
        </div>

  <div class="row">
     <div class="col-3"></div>
     <div class="col-9">
        <!-- hidden tooltip for option descriptions -->
        <q-tooltip
           v-model="showBlockHelp"
           anchor="top right"
           content-class="block-options-tooltip shadow-22">
          {{ blockOptionDescription }}
        </q-tooltip>
      </div>
  </div>
  <div class="row">
    <div class="col-5" align="left">
      <q-btn flat style="font-size: 0.7em" @click="resetBlockOptions">
       <q-icon name="fas fa-redo">
         <q-tooltip content-class="pipes-tooltip">
           Reset options to default
         </q-tooltip>
       </q-icon>
       </q-btn>
    <q-option-group
      color="secondary"
      type="toggle"
      @input="blockOptionChanged"
      v-model="blockOptions"
      :options="[
      { label: 'Get document by URI', value: 'getByUri' },
      { label: 'Accept node as input', value: 'nodeInput' },
      { label: 'Send node as output', value: 'nodeOutput' },
      { label: 'Create field inputs', value: 'fieldsInputs' },
      { label: 'Create field outputs', value: 'fieldsOutputs' }
    ]"
    >
    </q-option-group>

   <q-checkbox dense v-model="userRequestingBlockOptionHelp" @input="blockHelpOnOff">
     Explain options
   <q-tooltip anchor="bottom right" content-class="pipes-tooltip">
      When checked, block options will be explained as they are selected
    </q-tooltip>
    </q-checkbox>

    </div> <!-- Block Options left half -->

    <div class="col-7">

      <!-- Block preview -->
      <div class="row">
        <div class="col-12">Block Preview</div>
      </div>

      <div class="row">
      <div class="col-12">
      <div class="preview-block shadow-5 vertical-bottom">
      <div class="preview-block-title">
      ●&nbsp;&nbsp;{{this.blockName}}
      </div>
      <div class="preview-block-body">
           <div class="row">
            <div class="col-6">
             <ul class="userfield-left">
                <li :class="inputItem.class"
                v-for="inputItem in this.stepBlockFieldsInput"
                :key="inputItem.label">
                        <b>{{ inputItem.label }}</b>
                 </li>
             </ul>
            </div>

            <div class="col-6">
             <ul class="userfield-right">
                <li :class="outputItem.class"
                v-for="outputItem in this.stepBlockFieldsOutput" :key="outputItem.label">
                       <b>{{ outputItem.label }}</b>
                 </li>
             </ul>
            </div>

            </div> <!-- row -->
      </div>
      </div>
      </div>
      </div> <!-- block row -->

      </div>

    </div>

   <q-stepper-navigation>
            <q-tooltip v-model="explainBlockNotReady" :disabled="this.createBlockReady" content-class="pipes-tooltip">
              A source block needs at least one input and output
          </q-tooltip>
          <q-btn @click="createBlockStep = 3" color="primary" label="Back" class="q-ml-sm"></q-btn>
          <q-btn :disabled="! this.createBlockReady" color="red" type="submit" :label="buttonLabel" class="q-ml-sm"></q-btn>
    </q-stepper-navigation>

      </q-step>

    </q-stepper>
   </q-form>

        <q-expansion-item
          expand-separator
          icon="fas fa-cube"
          label="Source Blocks"
        >
    <q-list padding>

<!-- TODO fix reactivity warning here now using stepper -->
    <q-item tag="label" v-for="(block, index) in this.sourceBlocks"
      v-bind:key="block.source + '/' + block.label" @click.native.prevent="">

         <q-item-section avatar>
              <div class="block">
                <div class="block-title block">abc</div>
                <div class="block-body block">
                 <div :class="block.source"/>
                </div>
              </div>
         </q-item-section>

       <q-item-section label>
             <div class="text-left">
             {{ block.label }}
              </div>
         </q-item-section>

         <q-item-section top side>
            <q-btn :disabled="! block.metadata || ! block.metadata.blockCreatedFrom || block.metadata.blockCreatedFrom === null" @click.capture.stop="restoreBlockToForm(block)" flat outline size="sm" style="color: #419e5a" icon="fas fa-arrow-up">
              <q-tooltip self="top middle" content-class="pipes-tooltip">Edit block</q-tooltip>
            </q-btn>
        </q-item-section>
        <q-item-section top side>
            <q-btn @click.capture.stop="deleteBlock(block,true)" flat outline size="sm" style="color: #b81220" icon="fas fa-trash-alt">
              <q-tooltip self="top middle" content-class="pipes-tooltip">Delete</q-tooltip>
            </q-btn>
         </q-item-section>

      </q-item>
    </q-list>

    </q-expansion-item>

  </div>
</template>

<script>
  import VueJsonPretty from 'vue-json-pretty'
  import Notifications from '../components/notificationHandler.js';
  import DatabaseFilter from '../components/databaseFilter.js';
  import CollectionFilter from '../components/collectionFilter.js';
  import { SOURCE_BLOCK_TYPE, BLOCK_FIELDS, BLOCK_FIELD, BLOCK_LABEL, BLOCK_TYPE, BLOCK_OPTIONS,
  BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_NODE_OUTPUT, BLOCK_OPTION_FIELDS_INPUT, BLOCK_OPTION_FIELDS_OUTPUT,
  BLOCK_CHILDREN, BLOCK_PATH, BLOCK_COLLECTION, BLOCK_SOURCE, BLOCK_OPTIONS_DOC_BY_URI } from '../components/constants.js'
  import LiteGraphHelper from '../components/liteGraphHelper.js'

  const FIELD_TREE_DEFAULT = [
          {
          label: "Document Fields",
          icon: 'description',
          selectable: false,
          header: 'test',
          body: 'test',
          tickable: false,
          children: []
        },
          {
            label: "Custom Fields",
            icon: 'person_outline',
            tickable: false,
            children: []
          }
        ]

  export default {
    // name: 'ComponentName',
    components: {
      VueJsonPretty
    },
    mixins: [
      Notifications,
      DatabaseFilter,
      CollectionFilter,
      LiteGraphHelper
    ],
    data() {
      return {
        treeLabel_DocumentFields: "Document Fields",
        treeLabel_CustomFields: "Custom Fields",
        // Block tool tip
        userRequestingBlockOptionHelp: false,
        showBlockOptionTooltip: false,
        //
        formMode: 'create', // 'create' or 'edit'
        createBlockStep: 1,
        blockSourceOption: 'custom_step',
        dhfSteps: [],
        dhfStepSelectOptions: null,
		    showCustomURIPanel: false,
        selectedStep: null,       // DHF custom step currently selected
        selectedDatabase:null,    // Currently selected database
        selectedCollection: null, // Currently selected collection
		    selectedFields: [],       // Node selected in the collectionModel field tree
        availableCollections: [],
        availableDatabases: [],
        blockFieldsWarning : false,
		    tickedNodes: null,        // selected tree nodes here due to Stepper
		    collectionModelPopulated: false,
        collectionModel: FIELD_TREE_DEFAULT,
        previousBlockOptions: [BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT],
        blockOptions: [BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT],
        newSelectedOption: "", // most recently selection block option
        blockOptionDescription: "",
        blockName: "",
        blockDescription: "",
        newCustomFieldName:"",
        customURI:"",
        customURIList: [],
        toolTips:true
      }
    },
  watch: {
      selectedStep: function (val) {
      let availableDbHash = this.availableDatabases.reduce(function (map, obj) {
        map[obj.label] = obj.value;
        return map;
      }, {});
    this.selectedDatabase = { "label": this.dhfSteps[val.label].database, "value": availableDbHash[this.dhfSteps[val.label].database] };
	  this.selectedCollection = { "label": this.dhfSteps[val.label].collection, "value": this.dhfSteps[val.label].collection };
	  console.log("Custom step " + val + " set database = " + JSON.stringify(this.selectedDatabase) + ", collection = " + JSON.stringify(this.selectedCollection))
    },
  selectedCollection:  function (val) {
        console.log("watch discovering new collection: " + JSON.stringify(val))
        this.collectionChanged()
  }
  },
  computed: {
// can user proceed from select data source step?
	dataSourceNextOk: function() {
		return (this.blockSourceOption == "db_collection" && this.selectedCollection !== null) ||
    (this.showCustomURIPanel == true && this.customURIList.length > 0) ||
    (this.blockSourceOption == "custom_step" && this.selectedStep !== null && this.selectedCollection !== null) ||
    this.blockSourceOption == "none"
	},
      showBlockHelp: function() {
        return (this.userRequestingBlockOptionHelp && this.showBlockOptionTooltip)
      },
      userDocumentURIs: function() {
          var URIs = "";
          for (var x = 0; x < this.customURIList.length; x++) {
            URIs += this.customURIList[x].uri + " "
          }
          URIs = URIs.trim()
          return URIs
      },
      stepTitleBlockName: function() {
        return this.createBlockStep > 1 ? "Block Name - " + this.blockName : "Enter Block Name"
      },
      stepTitleDataSource: function() {
        var label = 'Data Source for Fields'
        if ( this.createBlockStep > 2 ) {
          switch(this.blockSourceOption) {
          case 'custom_step':
          label = 'Fields from DHF custom step ' + (this.selectedStep !== null ? this.selectedStep.label : "")
          break;
          case 'db_collection':
          label =  'Fields from Collection ' + (this.selectedCollection !== null ? this.selectedCollection.label : '')
          break;
          case 'none':
          label =  'No fields from database required'
          default:
          break;
          }
      }
        return label
      },
      stepTitleCustomURIs: function() {
        return (this.createBlockStep > 3 ) ? "Document URIs - " + (this.customURIList.length == 0 ? "None" : this.customURIList.length) + " selected" : "Document URIs"
      },
      stepTitleFields: function() {
        var title = 'Fields'
        if (this.createBlockStep > 3 ) {
         title = (this.selectedFields.length > 0 ? this.selectedFields.length : "No") + " fields selected"
        }
        return title
      },
      // data for the input side of block demo in step 5
      stepBlockFieldsInput: function() {
          const MAX = 6 // max 6 input/output lines in the preview block
          var chosenFields = []
          var inputFields = []

          console.log("stepBlockFieldsInput: " + this.newSelectedOption)
          this.newSelectedOption == ''

          if ( this.blockOptions.includes(BLOCK_OPTIONS_DOC_BY_URI) ) {
            var cssClass = "input-uri first last"
            if ( this.userRequestingBlockOptionHelp && this.newSelectedOption == BLOCK_OPTIONS_DOC_BY_URI  ) {
                cssClass += " highlight-input"
            }
             var obj = {}
              obj.label = "Uri"
              obj.class = cssClass
              inputFields.push(obj)
          }

          if ( this.blockOptions.includes(BLOCK_OPTION_NODE_INPUT) ) {
            var cssClass = "input-node first last"
            if ( this.userRequestingBlockOptionHelp && this.newSelectedOption == BLOCK_OPTION_NODE_INPUT  ) {
                cssClass += " highlight-input"
            }
              var obj = {}
              obj.label = "Node"
              obj.class = cssClass
              inputFields.push(obj)
          }

         // Include the user selected fields on input side
           if ( this.blockOptions.includes(BLOCK_OPTION_FIELDS_INPUT)) {

            // Process User Fields
              for (var f = 0; f < this.selectedFields.length; f++ ) {

              var cssClass = "input-field"

            if ( this.userRequestingBlockOptionHelp == true && this.newSelectedOption == BLOCK_OPTION_FIELDS_INPUT ) {
              if ( f == 0) cssClass += " highlight-top"
              else if ( f == this.selectedFields.length - 1) cssClass += " highlight-bottom"
              else cssClass += " highlight-input"
              }

              var simpleLabel = this.selectedFields[f]
               if ( typeof simpleLabel === 'string') {
                  if ( simpleLabel.indexOf("[") > -1 )
                  simpleLabel = simpleLabel.split("[")[0]
                }

              var obj = {}
              obj.label = simpleLabel
              obj.class = cssClass
              chosenFields.push(obj)
            }
          } else {
            return inputFields // no need to add user fields
          }

          if ( (chosenFields.length + inputFields.length) <= MAX) {
            inputFields = inputFields.concat(chosenFields)
          } else {
            const MAX_ITEMS = MAX - inputFields.length - 1
            for (var x = 0; x < (MAX_ITEMS); x++ ) {
                inputFields.push(chosenFields[x])
            }
            var css = 'input-field last'
            if ( this.userRequestingBlockOptionHelp == true && this.newSelectedOption == BLOCK_OPTION_FIELDS_INPUT ) {
            css += " highlight-input"
            }
            var obj = {}
            obj.label = "..."
            obj.class = css
            inputFields.push(obj)
          }
          return inputFields
      },
      // data for the output side of block demo in step 5
      stepBlockFieldsOutput: function() {

        function clipFieldSize(field) {
          return (field.length < 13) ? field : ".." + field.substring(0,12)
        }

          const MAX = 6 // max 6 input/output lines in the preview block
          var chosenFields = []
          var outputFields = [] // final fields to output

           if ( this.blockOptions.includes(BLOCK_OPTION_NODE_OUTPUT) ) {
            var cssClass = "output-field first last"
            if ( this.userRequestingBlockOptionHelp && this.newSelectedOption == BLOCK_OPTION_NODE_OUTPUT  ) {
                cssClass += " highlight-output highlight-output-top highlight-output-bottom"
            }
              var obj = {}
              obj.label = "Node"
              obj.class = cssClass
              outputFields.push(obj)

              obj = {}
              obj.label = "Prov"
              obj.class = cssClass
              outputFields.push(obj)
          }

           // Include the user selected fields on output side
           if ( this.blockOptions.includes(BLOCK_OPTION_FIELDS_OUTPUT)) {

              for (var f = 0; f < this.selectedFields.length; f++ ) {
                var simpleLabel = this.selectedFields[f]

                var cssClass = "output-field"

                if ( typeof simpleLabel === 'string') {
                  if ( simpleLabel.indexOf("[") > -1 )
                  simpleLabel = simpleLabel.split("[")[0]
                  simpleLabel = clipFieldSize(simpleLabel)
                }

          if ( this.userRequestingBlockOptionHelp && this.newSelectedOption == BLOCK_OPTION_FIELDS_OUTPUT  ) {
                if ( f == 0) cssClass += " highlight-top"
                else if ( f == this.selectedFields.length - 1) cssClass += " highlight-bottom"
                else cssClass += " highlight-input-output"
            }
              var obj = {}
              obj.label = simpleLabel
              obj.class = cssClass
              chosenFields.push(obj)
            }
          } else {
            return outputFields // no need to add user fields
          }

          if ( (chosenFields.length + outputFields.length) <= MAX) {
            outputFields = outputFields.concat(chosenFields)
          } else {
            const MAX_ITEMS = MAX - outputFields.length - 1
            for (var x = 0; x < (MAX_ITEMS); x++ ) {
                outputFields.push(chosenFields[x])
            }
            var css = 'output-field last'
            if ( this.userRequestingBlockOptionHelp == true && this.newSelectedOption == BLOCK_OPTION_FIELDS_OUTPUT ) {
            css += " highlight-output"
            }
            var obj = {}
            obj.label = "..."
            obj.class = css
            outputFields.push(obj)
          }
       return outputFields
      },
      createBlockReady: function() {

        var BLOCK_NAME_SET = (this.cleanBlockName() != '')

        var INPUT_CHECK = (
           (  this.blockOptions.includes(BLOCK_OPTION_FIELDS_INPUT) && this.selectedFields.length >= 1) ||
              this.blockOptions.includes(BLOCK_OPTION_NODE_INPUT) ||
             this.blockOptions.includes(BLOCK_OPTIONS_DOC_BY_URI)
        )

       var OUTPUT_CHECK = (
           (  this.blockOptions.includes(BLOCK_OPTION_FIELDS_OUTPUT) && this.selectedFields.length >= 1) ||
              this.blockOptions.includes(BLOCK_OPTION_NODE_OUTPUT)
          )

      return BLOCK_NAME_SET && INPUT_CHECK && OUTPUT_CHECK

      },
      sourceBlocks: function () {
        return this.$store.state.models.filter(function (block) {
        return block.source == "Sources"
    })
  },
      blockModels: function () {
      return this.$store.getters.models
  },
    buttonLabel: function(){
      if ( this.blockName.trim() == '' ) return "CREATE SOURCE BLOCK"
      return this.isblockInModelList(this.blockModels, "Sources/" + this.blockName) ? "UPDATE SOURCE BLOCK" : "CREATE SOURCE BLOCK"
    },
    helpMode: function(){
      return this.$store.state.helpMode
    },
    },

    methods: {
      //
      explainBlockNotReady() {
          return ( ! this.createBlockReady)
      },
      blockHelpOnOff(click) {
          //if ( !click ) this.showBlockOptionTooltip = false
          this.showBlockOptionTooltip = false
          this.newSelectedOption = ''
      },
      stepTransition(newVal,oldVal) {
       // console.log("Step transition " + oldVal + " " + newVal)
        if (newVal == "3") {
          this.$refs.selectionTree.setExpanded("Document Fields",true)
        }
      },
      resetBlockOptions() {
        this.blockOptions = [BLOCK_OPTION_NODE_INPUT, BLOCK_OPTION_FIELDS_OUTPUT]
        this.showBlockOptionTooltip = false
        this.userRequestingBlockOptionHelp = false
      },
      // When user changes data source options
      sourceOptionChanged(currentOptions) {

       if (currentOptions.includes('custom_step') ) {
           this.selectedDatabase = null
           this.selectedCollection = null
       } else if (currentOptions.includes('db_collection')) {
          this.selectedStep = null
       } else if (currentOptions.includes('none')) {
          this.selectedDatabase = null
          this.selectedCollection = null
         }

      },
      // When user clicks on block options
      blockOptionChanged(currentOptions) {

        this.showBlockOptionTooltip = false

        var first = []
        var second = []

        if ( this.previousBlockOptions.length > currentOptions ) {
          // option removed
          first = [...this.previousBlockOptions]
          second = currentOptions
        } else {
          // option added
           first = currentOptions
           second = [...this.previousBlockOptions]
        }
        var difference = first.filter(x => second.indexOf(x) === -1);

        if ( difference === null || difference.length == 0 ) {
            this.showBlockOptionTooltip = false

        } else {

        switch( difference[0] ) {
          case BLOCK_OPTION_NODE_OUTPUT:
          this.newSelectedOption = BLOCK_OPTION_NODE_OUTPUT
          this.blockOptionDescription = "The block will generate a Document node which includes the block fields, plus have a Prov output for provenance information??"
          break;
          case BLOCK_OPTION_FIELDS_OUTPUT:
          this.newSelectedOption = BLOCK_OPTION_FIELDS_OUTPUT
          this.blockOptionDescription = "An output will be created for every field"
          break;
          case BLOCK_OPTION_FIELDS_INPUT:
          this.newSelectedOption = BLOCK_OPTION_FIELDS_INPUT
          this.blockOptionDescription = "An input will be created for every field"
          break;
          case BLOCK_OPTION_NODE_INPUT:
          this.newSelectedOption = BLOCK_OPTION_NODE_INPUT
          this.blockOptionDescription = "The block can accept a Document node"
          break;
          case BLOCK_OPTIONS_DOC_BY_URI:
          this.newSelectedOption = BLOCK_OPTIONS_DOC_BY_URI
          this.blockOptionDescription = "The block will have an input which can be fed a URI to load a specific document"
          break;
          default:
            this.blockOptionDescription = ""
            this.newSelectedOption = ""
            console.log("blockOptionChanged debug: " + difference[0])
           break;
        }
          this.showBlockOptionTooltip = true
        }
        this.previousBlockOptions = currentOptions
      },
      blockOptionsContains(option) {
          return this.blockOptions.includes(option)
      },
      // display help popup for block options
      logBlock(block) {
        console.log(JSON.stringify(block))
      },
      setDHFStep(step) {
      console.log( "setDHFStep: " + JSON.stringify(step) )
       if ( step === null || step == '') return;
       this.blockSourceOption = 'custom_step'
       this.selectedStep = step
       //
	  },
    // Auto set database and collection dropdowns
    // if block included then restore fields
      setDatabaseCollectionsDropdowns(dbName, collectionName, reloadBlock) {
        console.log( "setDatabaseDropdown: " + dbName + "," + collectionName )
        if ( dbName === null || dbName == '') return;
        for (var x = 0; x < this.availableDatabases.length; x++) {
          if ( this.availableDatabases[x].label == dbName ) {
            this.selectedDatabase = this.availableDatabases[x]
            var self = this
            this.discoverCollectionsPromise().then((response) => {
            this.availableCollections = self.filterCollections(response.data)
            if (collectionName !== null && collectionName !== '') {
           //   Try to select Collection
              for (var x = 0; x < self.availableCollections.length; x++) {
                  if ( self.availableCollections[x].label == collectionName ) {
                  self.selectedCollection = self.availableCollections[x]
                  self.discoverModel( this.selectedCollection,"", reloadBlock)
                  return
                  }
			  }
			  console.log("Warning: collection " + collectionName + " not found")
            }
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
          }
        }
      },
      selectFieldPath(node){
        console.log(node)
      }
      ,
      // Add custom URIs for field sampling
      addURIToList() {

      var newURI = this.customURI
       if ( newURI === null || newURI.trim() == '') {
         this.customURI = ''
         return
       }
       newURI = newURI.trim().replace(/\s\s+/g, ' ');
       // Multiple URIs
       if (newURI.indexOf(" ")) {
         var uriList = newURI.split(" ")
         for (var x = 0; x < uriList.length; x++) {
           this.checkCustomDocURI(uriList[x])
         }
       } else {
         this.checkCustomDocURI(newURI)
       }
       this.customURI = ''
       this.collectionChanged();
      },
      removeURIFromList(uri) {
         this.customURIList = this.customURIList.filter(i => i.uri!== uri);
      },
      collectionChanged() {
        this.selectedFields = [];
        this.discoverModel(this.selectedCollection,this.userDocumentURIs,null)
      },
      // Reset block create form to default values
       resetBlockFormFields() {
        this.newCustomFieldName = ''
        this.blockName = ''
        this.blockDescription = ''
        this.customURIList = []
        this.customURI = ''
        this.discoverDatabases('data-hub-STAGING')
        this.selectedCollection = null
        this.selectedStep = null
        this.discoverDhfSteps()
        this.tickedNodes = null
        this.selectedFields = []
		    this.collectionModel = FIELD_TREE_DEFAULT
		    this.collectionModelPopulated = false
        this.resetBlockOptions()
        this.createBlockStep = 1
        this.formMode = 'create'
      },
      resetCustomFieldValidation() {
        this.newCustomFieldName= this.cleanCustomFieldName()
        this.$refs.customFieldName.resetValidation()
      },
      cleanCustomFieldName() {
        // must be a valid javascript property name. Possible further cleaning to come
        var name = ''
        if ( this.newCustomFieldName !== null) {
           name = this.newCustomFieldName.trim().replace(/  +/g, ' ');
        }
        return name
      },
      cleanBlockName() {
        return this.blockName.trim().replace(/  +/g, ' ');
      },
      addCustomField(){

        if ( this.cleanCustomFieldName() !== '' ) {

        var fieldName = this.cleanCustomFieldName()
        // disallow duplicate custom field names
        if ( ! this.$refs.selectionTree.getNodeByKey(fieldName) ) {

        this.collectionModel[1].children.push({
            [BLOCK_LABEL]:fieldName,
            [BLOCK_CHILDREN]:[],
            [BLOCK_FIELD] : fieldName,
            [BLOCK_PATH]:  "//"  + fieldName,
            [BLOCK_TYPE]: "custom"
        })

        this.newCustomFieldName = ''

        this.$refs.selectionTree.setExpanded("Custom Fields",true)
        this.$refs.selectionTree.setTicked(fieldName,true)

        }
          this.newCustomFieldName = ''
          this.resetCustomFieldValidation()
        }
      },
      // confirm a custom doc URI is in the database
      checkCustomDocURI(uri) {
        var self = this;
        return this.$axios.get('/v1/resources/vppBackendServices?rs:action=verifyDocumentUri&rs:uri=' + uri )
          .then((response) => {
            try {
            var response = response.data
            //console.log("Got response : "
            var obj = {}
            obj.uri = uri
            obj.exists = response.documentExists
            this.customURIList.push(obj)
            console.log("Adding custom URI: " + JSON.stringify(obj))
            } catch (e) {
              console.log("checkCustomDocURI " + uri + " : " + e)
            }
          })
          .catch((error) => {
            self.notifyError("checkCustomDocURI", error, self);
          })
      },
      discoverCollections() {
        var self = this;
        let dbOption =""
        if(this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }
          this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
          .then((response) => {
            this.availableCollections = self.filterCollections(response.data)
          })
          .catch((error) => {
            self.notifyError("collectionDetails", error, self);
          })
      },
      // same as discoverCollections but returns promise so we can set dropdown after retreiving collection list
       discoverCollectionsPromise() {
        let dbOption =""
        if(this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }
          return this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails' + dbOption )
      },
      discoverDatabases(preSelectedDB, prefetchCollections) {
        var self = this;
        this.$axios.get('/v1/resources/vppBackendServices?rs:action=databasesDetails')
          .then((response) => {
            this.availableDatabases = this.filterDatabases(response.data)
            if (preSelectedDB !== null && preSelectedDB != '') {
              for (var x = 0; x < this.availableDatabases.length; x++) {
              if ( this.availableDatabases[x].label == preSelectedDB ) {
                    this.selectedDatabase = this.availableDatabases[x]
              }
              }
              if (prefetchCollections) this.discoverCollections()
              }

          })
          .catch((error) => {
            self.notifyError("databasesDetails", error,self);
          })
      },
     discoverDhfSteps () {
      var self = this;
      this.$axios.get('/customSteps').then((response) => {

        this.dhfSteps = response.data.customSteps.reduce(function (map, obj) {
          map[obj.name] = { "database": obj.database, "collection": obj.collection };
          return map;
        }, {});

        this.dhfStepSelectOptions = response.data.customSteps.map(item => { return { "label": item.name, "value": item.name } })
      })
        .catch((error) => {
          self.notifyError("discoverydhfSteps", error, self);
        })
    },
      // Restore a block to main editing panel
      restoreBlockToForm(block) {
        console.log("Restoring source block to form: " + JSON.stringify(block))

            this.resetBlockFormFields()

              this.collectionModel[0].children=[] // clear model and selected fields
              this.collectionModel[1].children=[]
              this.selectedFields=[]
              this.blockName = block.label

        if ( block.metadata ) {

          if ( block.metadata.customURIs && block.metadata.customURIs !== null) {
              this.customURI = block.metadata.customURIs
              this.addURIToList()
          }

          if ( block.metadata.blockCreatedFrom && block.metadata.blockCreatedFrom != '' ) {

            switch (block.metadata.blockCreatedFrom) {
              case 'custom_step':
                var dhfStep = ''
                if (block.metadata.sourceDHFStep && block.metadata.sourceDHFStep != '')
                  dhfStep = block.metadata.sourceDHFStep
                  this.setDHFStep(dhfStep)
                  this.blockOptions = block.options;
                  this.blockSourceOption = 'custom_step'
                  this.restoreFields(block, false) // restore fields from block
              break;
              case 'db_collection':
                var blockSourceDatabase, blockSourceCollection
                if (block.metadata.sourceDatabase && block.metadata.sourceDatabase != '')
                  blockSourceDatabase = block.metadata.sourceDatabase
                if (block.metadata.sourceCollection && block.metadata.sourceCollection != '')
                  blockSourceCollection = block.metadata.sourceCollection
                if ((blockSourceDatabase === null || blockSourceDatabase == '') ||
                  (blockSourceCollection === null || blockSourceCollection == '') ) {
                } else {
                  this.setDatabaseCollectionsDropdowns(blockSourceDatabase,blockSourceCollection,block)
                }
                this.blockOptions = block.options;
                this.blockSourceOption = 'db_collection'
              break;
              default:
                this.blockSourceOption = 'none'
              break;
          }

          } else {
            console.log("No metadata found")
            // if trying to restore an old block etc then default to none
            this.blockSourceOption = 'none'
          }

        }

            this.formMode = 'edit'
            this.createBlockStep = 3 // open the edit fields step

      },
      // remove block Model list
      deleteBlock(block, showDialog) {
        this.$root.$emit("checkGraphBlockDelete",block)
      },
      // Restore collection and custom fields after block reload
      restoreFields(reloadedBlock, expandTree) {

        console.log("Restoring the fields..")

          if ( reloadedBlock.fields.length > 0) {
          for (var i = 0; i < reloadedBlock.fields.length; i++) {

            var block = reloadedBlock.fields[i]

            if ( (block.type == 'custom') ) {

                var fieldName = block.label

                this.collectionModel[1].children.push({
                  [BLOCK_LABEL]: fieldName,
                  [BLOCK_CHILDREN]:[],
                  [BLOCK_FIELD] : fieldName,
                  [BLOCK_PATH]:  "//"  + fieldName,
                  [BLOCK_TYPE]: "custom"
                })

            } else {

                var fieldName = block.label

                this.collectionModel[0].children.push({
                  [BLOCK_LABEL]: fieldName,
                  [BLOCK_FIELD] : block.field,
                  value : block.field,
                  [BLOCK_PATH]:  "//"  + block.field,
                  [BLOCK_CHILDREN]: block.children,
                  [BLOCK_TYPE]: "3",
                  parent: block.parent
                })

            }
            // add all field regardless of type to "selected" so check boxes in tree are filled in
            console.log("Adding field back to tree:" + reloadedBlock.fields[i].label)
            this.selectedFields.push(reloadedBlock.fields[i].label)
         }

            if ( this.collectionModel[1].children.length > 0  && expandTree)
            this.$refs["selectionTree"].setExpanded("Custom Fields",true)
          }
     },
	 // Discover fields and populate the tree view

      discoverModel(collection,custURIs, reloadBlock) {

        var self = this

		    this.collectionModelPopulated = false

        let dbOption =""
        if (this.selectedDatabase!=null && this.selectedDatabase!="") {
          dbOption += "&rs:database=" + this.selectedDatabase.value
        }

        if(collection !== null && collection.value!=null)
          dbOption += "&rs:collection=" + collection.value

        if(custURIs !== null && custURIs != '')
          dbOption += "&rs:customURI=" + custURIs

        console.log("discoverModel with: " + dbOption)

        this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionModel' + dbOption)
          .then((response) => {
            this.collectionModel[0].children = response.data
            if ( reloadBlock != null) self.restoreFields(reloadBlock, false)
            if ( response.data !== null && response.data.length > 0  ) {
				  this.collectionModelPopulated = true
            } else {
				console.log("Warning: No fields returned")
			}
          })
          .catch((e) => {
            this.$q.notify({
              color: 'negative',
              position: 'top',
              message: 'Loading failed ' + e,
              icon: 'report_problem'
            })
          })
      },
      databaseChanged(){
        this.selectedCollection = []
        this.discoverCollections()
         this.$root.$emit("databaseChanged",
           {selectedDatabase: this.selectedDatabase,availableDatabases:this.availableDatabases
           }

          );
      },

      discoverCustomSteps() {
        this.$axios.get('/customSteps') .then((response) => {
           this.dhfSteps = response.data.customSteps.map(item => {return {"label":item.name,"value":item.name}});
      })
      },

    // Send a block creation request
      notifyBlockRequested() {

        this.blockName = this.cleanBlockName()

          let blockMetadata = {
            "description" : this.blockDescription,
            "dateCreated" : new Date().toISOString(),
            "blockCreatedFrom" : this.blockSourceOption,
            "sourceDHFStep" : this.selectedStep,
            "sourceDatabase" : this.selectedDatabase != null ? this.selectedDatabase.label : '' ,
            "sourceCollection" : this.selectedCollection != null ? this.selectedCollection.value : '',
            "customURIs" : this.userDocumentURIs
          }

          let blockDef = {
            [BLOCK_LABEL]: this.blockName,
            collection: this.blockName,
            source: SOURCE_BLOCK_TYPE,
            [BLOCK_FIELDS]: this.tickedNodes,
            options: this.blockOptions,
            metadata: blockMetadata
		  }

          this.$root.$emit("blockRequested", blockDef);
      }

    },
    mounted() {
      this.discoverDatabases('data-hub-STAGING', true)
      this.discoverDhfSteps()
      this.$root.$on('resetBlockFormFields', this.resetBlockFormFields);
    },
    beforeDestroy() {
      this.$root.$off('resetBlockFormFields', this.resetBlockFormFields);
    }
  }

</script>

<style>
.spacer-div { margin-bottom: 8px; }

.block {
  width: 30px;
  border-top-left-radius: 5px;
  border-top-right-radius: 5px;
}

.block-title {
  height: 8px;
  background: rgb(236,75,43);
  color:white;
  font-size:0.2em;
}

.block-body {
  background: rgb(176,165,143);
  height: 20px;
  border-top-right-radius: 0px;
  border-top-left-radius: 0px;
  border-bottom-right-radius: 5px;
  border-bottom-left-radius: 5px;
}

/* Preview Block */
.preview-block {
  width: 260px;
  border-radius: 9px;
  margin-left: 10px;
  padding: 0;
}

.preview-block-title {
  height: 24px;
  background: rgb(236,75,43);
  color:white;
  font-size:1.0em;
  border-top-right-radius: 9px;
  border-top-left-radius: 9px;
  padding-left: 4px;
  padding-top: 2px;
}

.preview-block-body {
  background: rgb(176,165,143);
  height: 120px;
  border-top-right-radius: 0px;
  border-top-left-radius: 0px;
  border-bottom-right-radius: 9px;
  border-bottom-left-radius: 9px;
  padding-left: 4px;
  padding-right: 4px;
  padding-bottom: 0px;
  margin: 0px;
}

/* Preview block fields */
ul.userfield-left {
  list-style-type: circle;
  list-style-position: inside;
  padding: 0;
  margin: 0;
}

ul.userfield-right {
  list-style-type: circle;
  list-style-position: inside;
  direction:rtl;
  padding: 0;
  margin: 0;
}

ul.userfield-left li {
  font-size: 0.9em;
}

ul.userfield-right li {
  font-size: 0.9em;
}

.pipes-tooltip {
  background-color: #7397d1;
  font-size: 1.0em;
}

.tooltip-square {
  max-width: 200px
}

.block-options-tooltip {
  background-color: yellow;
  font-size: 1.0em;
  color: black;
  max-width: 300px;
}

.Entities {
   background: red;
}

.Sources {
  background: blue;
}

.output-field {
  color: black;
}

.input-field {
  color: black;
}

.highlight-input-output {
  color: yellow;
}

.highlight-input {
  color: yellow;
}

.highlight-output {
  color: yellow;
}

.highlight-top {
color: yellow;
}

.highlight-bottom {
  color: yellow;
}

.highlight-user-input {
  color: yellow;
}

</style>
