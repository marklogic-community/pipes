
function getFieldsByCollection(collection) {

    let doc = fn.head(fn.collection(collection))
    let fields = {}
    for (let node of doc.xpath(".//*")){
        let path = xdmp.path(node)
        path= fn.replace(path,"\\[\\d*\\]","")

        if(fields[path]==null) fields[path]={
            label: node.xpath("name(.)"),
            value: node.xpath("name(.)"),
            path: path,
            type: node.nodeType,
            children : [],
            parent : path.substring(0, path.lastIndexOf("/"))
        }
        if(fields[path].parent=="")fields[path].parent="/"
    }

    let results =[]
    Object.keys(fields).map(item => {results.push(fields[item])} )
    for (let path of Object.keys(fields)){

        fields[path].children = results.filter(item => {return (item.parent == path) })




    }



    return results.filter(item => item.parent=="/")

}


function get(context, params) {


    return getFieldsByCollection(params.collection)

};

function post(context, params, input) {


};

function put(context, params, input) {



};

function deleteFunction(context, params) {
    // return at most one document node
};

exports.GET = get;
exports.POST = post;
exports.PUT = put;
exports.DELETE = deleteFunction;
