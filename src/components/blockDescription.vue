<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>

<!--
  <q-dialog
      :content-css="{minWidth: '60vw', minHeight: '80vh'}"
      v-model="showDetail"
    >
      <q-card>
        <q-card-section class="row items-center">
          <div class="text-h6">{{ description }}</div>
        </q-card-section>
      </q-card>
    </q-dialog>
    -->
    <div class="fixed-bottom">
      <q-tooltip content-class="block-tooltip" v-model='showDetail'>{{ description }}</q-tooltip>
     </div>

</template>

<script>

export default {
  data () {
    return {
          blockDescriptionShow: false,
          blockDescription: ''
    }
  },
  computed: {
    description: function() {
      return this.blockDescription
    },
    showDetail: {
      get: function () {
      return this.blockDescriptionShow
    },
      set: function (newValue) {
      this.blockDescriptionShow = newValue
    }
  }
  },
  methods:{
    open( blockdetails ) {
        if ( blockdetails.description && blockdetails.description != '' ) {
        this.blockDescription = blockdetails.description
        this.blockDescriptionShow = true
        } else {
          this.blockDescription = ''
        }
    },
     close( ) {
        this.blockDescription = ''
        this.blockDescriptionShow = false
     }

  },
  mounted() {
    this.$root.$on('showBlockDescription', this.open);
    this.$root.$on('closeBlockDetails', this.close);
  },
  beforeDestroy () {
    this.$root.$on('showBlockDescription', this.open);
    this.$root.$on('closeBlockDetails', this.close);
  }
}
</script>
<style>
.block-tooltip {
  min-width: 200px;
  background-color: blue;
  color: white;
  font-size: 1em;
}
</style>
