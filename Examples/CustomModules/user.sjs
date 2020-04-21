//Copyright ©2020 MarkLogic Corporation.

// backend logic for a sample custom Block
function init(LiteGraph){

        function myBlock()
        {
            this.addInput("myInput1");
            this.addOutput("myOutput1");
            this.blockOption = this.addWidget("combo","option A", "blockOption", function(v){}, { values:["option A","option B","option C"]} );
        }

        myBlock.prototype.onExecute = function()
        {
            this.setOutputData(0, "My custom block. Option set to " + this.blockOption.value + ": input is " + this.getInputData(0) + " output is " + this.getOutputData(0) )

        }

  LiteGraph.registerNodeType("User/myBlock", myBlock );

}

module.exports = {
    init:init
};
