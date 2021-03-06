<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div id="queryBuilder">

    <!-- Reusable mapping edit dialog -->
    <q-dialog
      persistent
      v-model="showqueryBuilderEdit"
    >

      <q-card style="max-width:900px;min-width:900px;">
        <q-card-section>
          <div class="text-h6">{{ queryBuilderForm.title }}</div>
        </q-card-section>

        <q-card-section>
          <q-select
            :options="availableDB"
            filled
            @input="selectDatabase"
            label="Source Database*"
            v-model="query.selectedDB"
          >
            <q-tooltip
              content-style="font-size: 1em"
              content-class="pipes-tooltip"
            >
              Preview will be executed on documents from this database
            </q-tooltip>
            <template v-slot:prepend>
              <q-icon
                name="fas fa-database"
                @click.stop
              />
            </template>
          </q-select>
        </q-card-section>

        <q-card-section v-if="query.selectedDB">

          <vue-query-builder
            :rules="rules"
            :maxDepth="3"
            :labels="labels"
            v-model="query"
          >
            <template v-slot:default="slotProps">
              <query-builder-group
                v-bind="slotProps"
                :query.sync="query"
              />
            </template>
          </vue-query-builder>
        </q-card-section>

        <q-card-actions align="right">
          <q-btn
            color="primary"
            flat
            label="OK"
            @click="closeForm()"
          />
        </q-card-actions>
        <q-card-section>
          <p>Generated output:</p>

          <pre>{{ JSON.stringify(this.query, null, 2) }}</pre>
        </q-card-section>
      </q-card>

    </q-dialog>

  </div>
</template>

<script>
import Notifications from '../components/notificationHandler.js';
import VueQueryBuilder from 'vue-query-builder';
import QueryBuilderGroup from "./queryBuilderGroup.vue";
import JsonPropertyValueQuery from '../components/jsonPropertyValueQuery.vue';
export default {
  name: "queryBuilder",
  mixins: [
    Notifications
  ],
  components: { VueQueryBuilder, QueryBuilderGroup, JsonPropertyValueQuery },
  data () {
    return {
      queryBuilderForm: {
        title: '',
        currentProperties: [],
      },
      rules: [
        {
          type: "select",
          id: "cts.collectionQuery",
          label: "collectionQuery",
          choices: [
          ]
        },
        {
          type: "text",
          id: "wordQuery",
          operators: ["="],
          label: "wordQuery",
        },
        {
          type: "custom-component",
          id: "jsonPropertyValueQuery",
          label: "jsonPropertyValueQuery",

          operators: ["="],
          component: JsonPropertyValueQuery,
          default: { valueOptions: [], selectedCollection: null, selectedAttribute: null, selectedValue: null, selectedType: "string" }
        }
      ],
      query: {
        selectedDB: this.selectedDB
      },
      labels: {
        "matchType": "Match Type",
        "matchTypes": [
          { "id": "all", "label": "and" },
          { "id": "any", "label": "or" }
        ],
        "addRule": "Add Rule",
        "removeRule": "&times;",
        "addGroup": "Add Group",
        "removeGroup": "&times;",
        "textInputPlaceholder": "value",
      },
      showqueryBuilderEdit: false,
    }
  },
  computed: {
    availableDB: function () {
      return this.$store.getters.availableDatabases
    }
  },
  methods: {
    updateValueOptions (query, options) {
      for (let c in query) {
        console.log(query[c])
        if (query[c].type == "query-builder-rule" && query[c].query.rule == "jsonPropertyValueQuery") {
          query[c].query.value.valueOptions = options
          console.log("update options")
        }
        if (query[c].type == "query-builder-group") {
          this.updateValueOptions(query[c].query.children, options)
        }
      }
    },
    openForm (block) {
      this.queryBuilderForm.title = "Build your query"
      this.showqueryBuilderEdit = true
      this.query = block.properties.queryBuilder
      this.queryBuilderForm.block = block
      this.rules[2].default.valueOptions = block.inputs.map(x => { let result = { name: '${' + x.name + '}', type: x.type }; return result });

      this.updateValueOptions(this.query.children, this.rules[2].default.valueOptions)

      this.rules[0].choices = []
      this.rules[0].choices.push(this.queryBuilderForm.block.inputs.map(x => '${' + x.name + '}'))

      for (let db of this.availableDB) {
        if (db.label === this.queryBuilderForm.block.widgets[1].value) {
          this.query.selectedDB = db
          this.$store.commit('queryBuilderDB', this.query.selectedDB)
        }
      }

      this.selectDatabase()

    },
    // Close edit dialog and reset everything
    closeForm () {
      this.queryBuilderForm.block.widgets[1].value = this.query.selectedDB.label
      this.queryBuilderForm.block.properties.queryBuilder = this.query
      this.showqueryBuilderEdit = false
    },
    selectDatabase () {
      this.$store.commit('queryBuilderDB', this.query.selectedDB)
      this.$root.$emit("updateSelectedDB", this.query.selectedDB)
      this.$axios.get('/v1/resources/vppBackendServices?rs:action=collectionDetails&rs:database=' + this.query.selectedDB.value)
        .then((response) => {
          this.rules[0].choices = []
          this.rules[0].choices.push(...this.queryBuilderForm.block.inputs.map(x => { let result = { label: '${' + x.name + '}', value: '${' + x.name + '}' }; return result }))
          for (let choice of response.data) {
            this.rules[0].choices.push(choice);
          }

        })
    }
  },
  mounted () {
    this.$root.$on('openQueryBuilderEdit', this.openForm);
  },
  beforeDestroy () {
    this.$root.$off('openQueryBuilderEdit', this.openForm);
  }
}
</script>
<style>
.vue-query-builder .vqb-rule {
  background-color: #f5f5f5;
  border-color: #ddd;
  padding: 5px;
}

.match-type-container {
  padding-left: 5px;
  background-color: #f5f5f5;
  border-color: #ddd;
}

.vqb-group-body {
  background-color: #f5f5f5;
  border-color: #ddd;
  padding: 15px;
}

.form-control {
  margin: 5px;
}
.vue-query-builder .vqb-group.depth-1 .vqb-rule,
.vue-query-builder .vqb-group.depth-2 {
  border-left: 2px solid #8bc34a;
}
.vue-query-builder .vqb-group.depth-2 .vqb-rule,
.vue-query-builder .vqb-group.depth-3 {
  border-left: 2px solid #00bcd4;
}
.vue-query-builder .vqb-group.depth-3 .vqb-rule,
.vue-query-builder .vqb-group.depth-4 {
  border-left: 2px solid #ff5722;
}
.vue-query-builder .close {
  opacity: 1;
  color: rgb(150, 150, 150);
}
@media (min-width: 768px) {
  .vue-query-builder .vqb-rule.form-inline .form-group {
    display: block;
  }
}
</style>
