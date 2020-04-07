<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

<!-- Reusable property edit dialog -->
 <q-dialog persistent v-model="showDynamicEdit">
      <q-card style="padding: 5px">
        <q-card-section>
          <div class="text-h6 absolute-center">{{ editPopupTitle }}</div>
        </q-card-section>
            <div class="row">
              <div class="col-1">
                <q-icon v-if="EditForm.validationRun && EditForm.contentValid" color="green" name="fas fa-check-circle"/>
	              <q-icon v-if="EditForm.validationRun && ! EditForm.contentValid" color="red" name="fas fa-check-circle">
		            <q-tooltip content-class="pipes-tooltip">Error</q-tooltip>
	              </q-icon>
	              <q-icon v-if="! EditForm.validationRun" color="grey" name="fas fa-check-circle"/>
              </div>
            <div class="col-11" float-left>{{ this.EditForm.validationMessage}}</div>
            </div>

        <q-card-section>
          <div class="q-pa-md" style="min-width: 500px">
            <q-input v-model="EditForm.editProp" filled type="textarea" />
          </div>
          </q-card-section>

          <div class="row" align="middle">

            <div class="col-6">
             <q-btn
              color="secondary"
              label="Cancel"
              @click="cancelBlockPropertyEdit()"
              v-close-popup/>

              </div>

            <div class="col-6">
              <q-btn
              ref="blockPropertySaveBtn"
              color="primary"
              label="Save"
              @preSave=""
              @click="saveBlockPropertyEdit()"/>
            </div>

          </div>

      </q-card>
    </q-dialog>

</template>

<script>
import Notifications from '../components/notificationHandler.js';

const FORM_DEFAULTS = {
          blockRef: null,
          title : "",
          refProp: null,
          propName: "",
          editProp: null,
          oldValue: "",
          validationRun: false,
          contentValid: false,
          validationMessage: ''
        }

export default {
   mixins: [
    Notifications
  ],
  data () {
    return {
        showDynamicEdit: false,
        EditForm: FORM_DEFAULTS
    }
  },
  computed: {
    editPopupTitle: function() {
      return ( this.EditForm.title !== null) ? this.EditForm.title : ""
    }
  },
  methods:{

    openForm(refToLiteGraphNode ) {
      this.EditForm.blockRef = refToLiteGraphNode
      this.EditForm.propName = refToLiteGraphNode.properties.editProp
      this.EditForm.refProp =  refToLiteGraphNode.properties
      this.EditForm.editProp = refToLiteGraphNode.properties[this.EditForm.propName]
      this.EditForm.oldValue = this.EditForm.editProp
      this.EditForm.title = this.isNotEmpty(refToLiteGraphNode.properties.editWindowTitle) ? refToLiteGraphNode.properties.editWindowTitle : "Edit"
      this.showDynamicEdit = true
    },

    // Close edit dialog and reset everything
    closeForm() {
      this.showDynamicEdit = false
      this.EditForm.blockRef = null
      this.EditForm.title  = ""
      this.EditForm.refProp = null
      this.EditForm.propName = ""
      this.EditForm.editProp = null
      this.EditForm.oldValue = ""
      this.EditForm.validationRun = false
      this.EditForm.contentValid = false
      this.EditForm.validationMessage = ''
    },

     saveBlockPropertyEdit() {
      if ( this.EditForm.blockRef.beforePropSave ) {
        var validation = {}
        if (! this.EditForm.blockRef.beforePropSave(this.EditForm.editProp, validation, this) ) {

          // block returning true/false (not deferring to asynch rest call)
          if (! validation.override || ( validation.override && validation.override == false ) ) {
          // block validation logic returned false
          this.EditForm.contentValid = false
          this.EditForm.validationRun = true
          this.EditForm.validationMessage = validation.message
          } else {
          //
          }
          return
        } else {
           // Passed block validation logic
            this.EditForm.refProp[this.EditForm.propName] = this.EditForm.editProp
            this.closeForm()
           }
      } else {
          // No validation log from block. Simply accept edited value and close
          this.closeForm()
      }
    },

    cancelBlockPropertyEdit() {
      this.EditForm.refProp[this.EditForm.propName] = this.EditForm.oldValue
      this.closeForm()
    },
      validateCtsQuery(query) {
      var self = this
      this.EditForm.contentValid = false
      this.EditForm.validationRun = true
      var obj = {}
      obj.query = query
      this.$axios.post('/v1/resources/vppBackendServices?rs:action=ValidateCtsQuery', obj)
        .then((response) => {
          if ( response.data.valid == true ) {
            this.EditForm.refProp[this.EditForm.propName] = this.EditForm.editProp
            this.closeForm()
          } else {
            this.EditForm.validationMessage = 'Not a valid cts query'
            this.EditForm.contentValid = false
            this.EditForm.validationRun = true
          }
        })
        .catch((error) => {
          self.notifyError("LoadingEntities", error, self);
          return false;
        })
    },

   isNotEmpty(prop) {
      return (prop !== null && prop != '')
    }

  },
  mounted() {
    this.$root.$on('openPropertyEdit', this.openForm);
  },
  beforeDestroy () {
   this.$root.$off('openPropertyEdit', this.openForm);
  }
}
</script>
