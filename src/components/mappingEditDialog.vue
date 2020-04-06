<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div>
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
    }
  },
  computed: {
    editPopupTitle: function() {
      return ( this.EditForm.title !== null) ? this.EditForm.title : ""
    }
  },
  methods:{

    openForm( properties , isRange ) {

      console.log("Opening the form: " + isRange)

      this.EditForm.currentProperties = properties

      if ( isRange ) {

      this.EditForm.title = "Edit Mapping Range"
      this.showMappingRangeEdit = true

      } else {

      this.EditForm.title = "Edit Mapping"
      this.showMappingEdit = true
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
