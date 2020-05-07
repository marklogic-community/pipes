<template>
  <!-- eslint-disable vue/no-v-html -->
  <div
    class="vqb-group card"
    :class="'depth-' + depth.toString()"
  >
    <div class="vqb-group-heading card-header">
      <div class="match-type-container form-inline row">


        <q-select
          id="vqb-match-type"
          :label="labels.matchType"
          v-model="query.logicalOperator"
          class="form-control"
          :options="labels.matchTypes"
          option-value="id"
          option-label="label"
          style="width:90%"
        >
        
        </q-select>

        <q-btn
          v-if="depth > 1"
          type="button"
          class="close ml-auto"
          @click="remove"
          v-html="labels.removeGroup"
        >
        </q-btn>
      </div>
    </div>

    <div class="vqb-group-body card-body ">
      <div class="rule-actions form-inline">
        <div class="form-group row">
          <q-select  size="sm"
            v-model="selectedRule"
            :options="rules"
            option-value="id"
            stack-label
            option-label="label"
            class="form-control mr-2"
          >
          
          </q-select>

           <q-btn
            type="button" style="width:50px;height:50px" size="sm"
            class="btn btn-secondary mr-2"
            @click="addRule"
          >
            {{ labels.addRule }}
          </q-btn>

            <q-btn
            v-if="depth < maxDepth"
            type="button" style="width:50px;height:50px" size="sm"
            class="btn btn-secondary"
            @click="addGroup"
          >
            {{ labels.addGroup }}
          </q-btn>
        </div>
      </div>

      <query-builder-children v-bind="$props" />
    </div>
  </div>
</template>

<script>
import QueryBuilderGroup from "vue-query-builder/dist/group/QueryBuilderGroup.umd.js";
import QueryBuilderRule from "./queryBuilderRule.vue";

export default {
  name: "QueryBuilderGroup",

  components: {
    QueryBuilderRule: QueryBuilderRule
  },

  extends: QueryBuilderGroup
};
</script>

<style>
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