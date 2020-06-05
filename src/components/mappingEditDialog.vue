<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div>

<!-- Reusable mapping edit dialog -->
<q-dialog persistent v-model="showMappingCasesEdit">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ editPopupTitle }}</div>
          <div>The block will recopy the input N to the output based on the value to test. If no configuration is set for a given input to test, the default value will be used.
          </div>
        </q-card-section>

        <q-card-section>
          <q-table
            :columns="columnsCases"
            :data="EditForm.currentProperties"
            binary-state-sort
            row-key="name"
            title="Select Case"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td
                  :props="props"
                  key="value"
                >
                  {{ props.row.value }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.value"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.value"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td
                  :props="props"
                  key="input"
                >
                  {{ props.row.input }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.input"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.input"
                    />
                  </q-popup-edit>
                </q-td>

              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            @click="addMappingCase()"
            color="primary"
            flat
            label="Add case"
          />
          <q-btn
            color="primary"
            flat
            label="OK"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

<!-- Reusable mapping edit dialog -->
<q-dialog persistent v-model="showMappingEdit">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{ editPopupTitle }}</div>
        </q-card-section>

        <q-card-section>
          <q-table
            :columns="columns"
            :data="EditForm.currentProperties"
            binary-state-sort
            row-key="name"
            title="Mappings"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td
                  :props="props"
                  key="source"
                >
                  {{ props.row.source }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.source"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.source"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td
                  :props="props"
                  key="target"
                >
                  {{ props.row.target }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.target"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.target"
                    />
                  </q-popup-edit>
                </q-td>

              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            @click="addMapping()"
            color="primary"
            flat
            label="Add mapping"
          />
          <q-btn
            color="primary"
            flat
            label="OK"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>

<!-- Reusable Range Mapping Dialog -->
<q-dialog persistent v-model="showMappingRangeEdit">
      <q-card>
        <q-card-section>
          <div class="text-h6">{{editPopupTitle}}</div>
        </q-card-section>

        <q-card-section>
          <q-table
            :columns="columnsRange"
            :data="EditForm.currentProperties"
            binary-state-sort
            row-key="name"
            title="Mappings"
          >
            <template v-slot:body="props">
              <q-tr :props="props">
                <q-td
                  :props="props"
                  key="from"
                >
                  {{ props.row.from }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.from"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.from"
                    />
                  </q-popup-edit>
                </q-td>
                <q-td :props="props" key="to" >
                                  {{ props.row.to }}
                                  <q-popup-edit
                                    buttons
                                    title="Update mapping"
                                    v-model="props.row.to"
                                  >
                                    <q-input
                                      autofocus
                                      dense
                                      type="string"
                                      v-model="props.row.to"
                                    />
                                  </q-popup-edit>
                                </q-td>
                <q-td :props="props" key="target">
                  {{ props.row.target }}
                  <q-popup-edit
                    buttons
                    title="Update mapping"
                    v-model="props.row.target"
                  >
                    <q-input
                      autofocus
                      dense
                      type="string"
                      v-model="props.row.target"
                    />
                  </q-popup-edit>
                </q-td>

              </q-tr>
            </template>
          </q-table>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            @click="addMappingRange()"
            color="primary"
            flat
            label="Add mapping"
          />
          <q-btn
            color="primary"
            flat
            label="OK"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
<!-- end of reusable range mapping dialog -->
    </div>
</template>

<script>
import Notifications from '../components/notificationHandler.js';

export default {
   mixins: [
    Notifications
  ],
  data () {
    return {
        showMappingCasesEdit: false,
        showMappingEdit: false,
        showMappingRangeEdit: false,
        EditForm: {
          title: '',
          currentProperties: [],
        },
        columns: [
        { name: 'source', align: 'left', label: 'Source', field: 'source', sortable: true },
        { name: 'target', label: 'Target', field: 'target', sortable: true, align: 'left' },
      ],
        columnsRange: [
         { name: 'from', align: 'left', label: 'From (inc)', field: 'from', sortable: true },
         { name: 'to', label: 'To (inc)', field: 'to', sortable: true, align: 'left' },
         { name: 'target', label: 'Target', field: 'target', sortable: true, align: 'left' },
        ],
        columnsCases: [
        { name: 'value', align: 'left', label: 'Value 2 test', field: 'value', sortable: true },
        { name: 'input', label: 'Input N', field: 'input', sortable: true, align: 'left' },
      ]
    }
  },
  computed: {
    editPopupTitle: function() {
      return ( this.EditForm.title !== null) ? this.EditForm.title : ""
    }
  },
  methods:{

    openForm( block , isRange , isCase ) {

      console.log("Opening the form: " + isRange)


      if ( isCase ) {

      this.EditForm.title = "Edit Select Case"
      this.showMappingCasesEdit = true
      this.EditForm.currentProperties = block.properties.mappingCase
      this.EditForm.block = block
      } else if ( isRange ) {

      this.EditForm.title = "Edit Mapping Range"
      this.showMappingRangeEdit = true
      this.EditForm.currentProperties = block.properties.mappingRange


      } else {

      this.EditForm.title = "Edit Mapping"
      this.showMappingEdit = true
      this.EditForm.currentProperties = block.properties.mapping

    }
    },
    // Close edit dialog and reset everything
    closeForm() {
      this.showMappingEdit = false
      this.showMappingRangeEdit = false
      this.EditForm.currentProperties = null
    },
    addMapping () {
      this.EditForm.currentProperties.push({ source: "val", target: "newVal" })
    },
    addMappingCase () {
      this.EditForm.currentProperties.push({ value: "value", input: "input" })
      this.EditForm.block.addInput('input' + (this.EditForm.currentProperties.length-1),null)
      this.EditForm.block.widgets[0].value= this.EditForm.currentProperties.length
    },
    addMappingRange () {
      this.EditForm.currentProperties.push({ from: "0", to: "0", target: "0" })
    },
  },
  mounted() {
    this.$root.$on('openMappingEdit', this.openForm);
  },
  beforeDestroy () {
   this.$root.$off('openMappingEdit', this.openForm);
  }
}
</script>
