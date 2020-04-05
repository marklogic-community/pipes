<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div>
<!-- Reusable mapping edit dialog -->
<q-dialog persistent v-model="showDynamicEdit"
    >
      <q-card>
        <q-card-section>
          <div class="text-h6">Edit data mapping</div>
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
        showDynamicEdit: false,
        EditForm: {
          title: '',
          currentProperties: [],
        },
        columns: [
        { name: 'source', align: 'left', label: 'Source', field: 'source', sortable: true },
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

    openForm( properties ) {
      this.EditForm.currentProperties = properties
    //  this.EditForm.oldValue = ...[this.EditForm.editProp]
      this.EditForm.title = "Edit Mapping"
      this.showDynamicEdit = true
    },
    // Close edit dialog and reset everything
    closeForm() {
      this.showDynamicEdit = false
   //   this.EditForm = FORM_DEFAULTS
    },
    addMapping () {
      this.EditForm.currentProperties.push({ source: "val", target: "newVal" })
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
