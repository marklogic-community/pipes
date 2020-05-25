<template>
  <!-- eslint-disable vue/no-v-html -->
  <div class="vqb-rule card ">
    <label class="mr-5">{{ rule.label }}</label>
    <div class="form-inline row">
      


      <!-- List of operands (optional) -->
      <select :label="rule.label"
        v-if="typeof rule.operands !== 'undefined'"
        v-model="query.operand"
        class="form-control mr-2 col"
      >
        <option
          v-for="operand in rule.operands"
          :key="operand"
        >
          {{ operand }}
        </option>
      </select>

      <!-- List of operators (e.g. =, !=, >, <) -->
      <select
        v-if="typeof rule.operators !== 'undefined' && rule.operators.length > 1"
        v-model="query.operator"
        class="form-control mr-2 col"
      >
        <option
          v-for="operator in rule.operators"
          :key="operator"
          :value="operator"
        >
          {{ operator }}
        </option>
      </select>

      <!-- Basic text input -->
      <input
        v-if="rule.inputType === 'text'"
        v-model="query.value"
        class="form-control col"
        type="text"
        :placeholder="labels.textInputPlaceholder"
      >

      <!-- Basic number input -->
      <input
        v-if="rule.inputType === 'number'"
        v-model="query.value"
        class="form-control col"
        type="number"
      >

      <!-- Datepicker -->
      <input
        v-if="rule.inputType === 'date'"
        v-model="query.value"
        class="form-control col"
        type="date"
      >

      <!-- Custom component input -->
      <div
        v-if="isCustomComponent"
        class="vqb-custom-component-wrap col"
      >
        <component 
          :is="rule.component"
          :value="query.value"
          :query="query"
          :rule="rule"
          @input="updateQuery"
        />
      </div>

      <!-- Checkbox input -->
      <template
        v-if="rule.inputType === 'checkbox'"
      >
        <div
          v-for="choice in rule.choices"
          :key="choice.value"
          class="form-check form-check-inline col"
        >
          <input
            :id="'depth' + depth + '-' + rule.id + '-' + index + '-' + choice.value"
            v-model="query.value"
            type="checkbox"
            :value="choice.value"
            class="form-check-input"
          >
          <label
            class="form-check-label"
            :for="'depth' + depth + '-' + rule.id + '-' + index + '-' + choice.value"
          >
            {{ choice.label }}
          </label>
        </div>
      </template>

      <!-- Radio input -->
      <template
        v-if="rule.inputType === 'radio'"
      >
        <div
          v-for="choice in rule.choices"
          :key="choice.value"
          class="form-check form-check-inline col"
        >
          <input
            :id="'depth' + depth + '-' + rule.id + '-' + index + '-' + choice.value"
            v-model="query.value"
            :name="'depth' + depth + '-' + rule.id + '-' + index"
            type="radio"
            :value="choice.value"
            class="form-check-input"
          >
          <label
            class="form-check-label"
            :for="'depth' + depth + '-' + rule.id + '-' + index + '-' + choice.value"
          >
            {{ choice.label }}
          </label>
        </div>
      </template>
      <!-- Select without groups -->
      <q-select
        v-if="rule.inputType === 'select' && !hasOptionGroups"
        v-model="query.value"
        class="form-control col"
        :multiple="rule.type === 'multi-select'"
        :options="formatOptions(selectOptions)"
        option-value="value"
      >

        <template v-slot:option="scope">
          <q-item
            v-bind="scope.itemProps"
            v-on="scope.itemEvents"
          >
            <q-item-section>
              <q-item-label v-html="scope.opt.label" />
            </q-item-section>
          </q-item>
        </template>

 
      </q-select>

      <!-- Select with groups -->
      <select
        v-if="rule.inputType === 'select' && hasOptionGroups"
        v-model="query.value"
        class="form-control col"
        :multiple="rule.type === 'multi-select'"
      >
        <optgroup
          v-for="(option, option_key) in selectOptions"
          :key="option_key"
          :label="option_key"
        >
          <option
            v-for="sub_option in option"
            :key="sub_option.value"
            :value="sub_option.value"
          >
            {{ sub_option.label }}
          </option>
        </optgroup>
      </select>

      <!-- Remove rule button -->
      <q-btn style='float: right;'
        type="button"
        class="close ml-auto .col-md .offset-md"
        @click="remove"
        v-html="labels.removeRule"
      >
      </q-btn>
    </div>
  </div>
</template>

<script>
import QueryBuilderRule from "vue-query-builder/dist/rule/QueryBuilderRule.umd.js";

export default {
  extends: QueryBuilderRule,
  methods: {
    formatOptions(options){
      let formattedOptions= []
      for(let option in options){
        formattedOptions.push(options[option])
      }
      return formattedOptions
    }
  }
};
</script>
