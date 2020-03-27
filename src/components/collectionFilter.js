// Copyright ©2020 MarkLogic Corporation.
const CollectionFilter = {
  data() {},
  methods: {

// Parse out DHF and MarkLogic reserved collections, plus Pipes data collections
filterCollections: function(collections) {

  function compare(a, b) {
    if (a.label.toLowerCase() > b.label.toLowerCase()) return 1;
    if (b.label.toLowerCase() > a.label.toLowerCase()) return -1;
  return 0;
  }
        var filtered = []
        if (collections !== null && typeof collections === 'object' && collections.length >= 1) {
          filtered = collections.filter(
            collection => (!collection.label.startsWith('http://marklogic.com/')
              && (!collection.label.startsWith('marklogic-pipes/'))
            )
          )
        }
        return filtered.sort(compare);
      }
}

}
export default CollectionFilter
