<template>
  <div class="column gutter-sm">

    <vue-dropzone ref="myVueDropzone" id="dropzone" :options="dropzoneOptions" v-on:vdropzone-files-added="added" :useCustomSlot=true>
      <div class="dropzone-custom-content">
        <h5 class="dropzone-custom-title">Drop a file to upload full graph or CSV</h5>
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
        maxFilesize: 10,
        addRemoveLinks: true,
        maxFiles: 1,
        headers: { "My-Awesome-Header": "header value" }
      }
    }
  },
  methods:{
    added(file){

      console.log(file)
      let  fileReader = new FileReader();
      fileReader.addEventListener("load", function () {
        console.log(fileReader.result)

        if(fileReader.result.includes("executionGraph"))
          this.$root.$emit("loadGraphJsonCall",JSON.parse(fileReader.result));
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
