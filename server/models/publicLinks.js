const mongoose = require("mongoose");

const PublicLinkSchema = new mongoose.Schema({
    hash:{
        type:String
    },
    file:{
        type:Array
    },
    uploadedBy:{
        type:Array,
        default: []
    }
},
{timestamps:true}
);

module.exports = mongoose.model("PublicLinks", PublicLinkSchema)