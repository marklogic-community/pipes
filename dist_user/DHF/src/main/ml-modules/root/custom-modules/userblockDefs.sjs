

function initUserBlocks(LiteGraph){

    function myBlock()
    {
        this.addInput("MyInput1");
        this.addOutput("myOutput1");
        this.widgetName = this.addWidget("text","widgetName", "defaultValue", function(v){}, { values:[]} );
    }

    myBlock.title = "myBlock";
    myBlock.desc = "myBlock";

    myBlock.prototype.onExecute = function()
    {
       this.setOutputData(0, "Output " + this.getInputData(0) + " by myBlock" )

    }
    LiteGraph.registerNodeType("user/myBlock", myBlock );


}



module.exports = {
    initUserBlocks:initUserBlocks
};
