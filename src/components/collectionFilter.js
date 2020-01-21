// Copyright ©2020 MarkLogic Corporation.
const CollectionFilter = {
  data() {},
  methods: {

// Parse out DHF and MarkLogic reserved collections, plus Pipes data collections 
filterCollections: function(collections) {
        var filtered = []
        if (collections !== null && typeof collections === 'object' && collections.length >= 1) {
          filtered = collections.filter(
            collection => (!collection.label.startsWith('http://marklogic.com/')
              && (!collection.label.startsWith('marklogic-pipes/'))
            )
          )
        }
        return filtered;
      }
}

}
export default CollectionFilter