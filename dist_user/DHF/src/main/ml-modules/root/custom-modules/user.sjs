//Copyright ©2020 MarkLogic Corporation.

function init(LiteGraph){

        function myBlock()
        {
            this.addInput("MyInput1");
            this.addOutput("myOutput1");
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
    init:init
};
