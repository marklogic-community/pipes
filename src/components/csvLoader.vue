<!-- Copyright ©2020 MarkLogic Corporation. -->
<template>
  <div class="column gutter-sm">

    <vue-dropzone ref="myVueDropzone" id="dropzone" :options="dropzoneOptions" v-on:vdropzone-files-added="added" :useCustomSlot=true>
      <div class="dropzone-custom-content">
        <h5 class="dropzone-custom-title">Drop a JSON file here to upload a saved graph</h5>
        <h5 class="dropzone-custom-title">or a CSV file to upload block definitions</h5>
        <div class="subtitle">CSV format is: source;sourceField;target;targetField;type</div>
      </div>
    </vue-dropzone>

  </div>
</template>

<script>
  import vue2Dropzone from 'vue2-dropzone'
  import 'vue2-dropzone/dist/vue2Dropzone.min.css'
export default {
  // name: 'ComponentName',
  data () {
    return {

      filename: "mappingRules.csv",
      dropzoneOptions: {
        url: "http://localhost",
        autoQueue:false,
        thumbnailWidth: 150,
        maxFilesize: 1,
        addRemoveLinks: true,
		maxFiles: 1,
		acceptedFiles: ".json,.csv",
        headers: { "My-Awesome-Header": "header value" }
      }
    }
  },
  methods:{
    added(file){

      console.log("Uploaded file: ")
      let  fileReader = new FileReader();
      fileReader.addEventListener("load", function () {
        console.log(fileReader.result)

        if(fileReader.result.includes('"executionGraph":')) {
            let input =String(fileReader.result)
            input= input.replace(/array-node\('([\s\w]*)'\)/g, "$1").replace(/\/object-node\(\)/g, "")
            console.log(input)
            this.$root.$emit("loadGraphJsonCall", JSON.parse(input));
        }
        else {
          this.$root.$emit("csvLoadingRequested",fileReader.result);
        }
        }.bind(this)

      , false);
      fileReader.readAsText(file[0],"UTF-8");

    },
    createBlock(){
    this.$axios.get('/statics/' + this.filename)
      .then((response) => {
        this.$root.$emit("csvLoadingRequested",response.data);
  })
    }
},
  components: {
    vueDropzone: vue2Dropzone
  }
}
</script>

<style>
</style>
