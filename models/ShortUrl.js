const mongoose = require("mongoose")
const shorturl = require("shortid")
const UrlShornerSchema = new mongoose.Schema({
    full: {
        type: String,
        require: true,
    },
    short:{
        type:String,
        require:true,
        default:shorturl.generate,
    },
    clicks:{
        type:Number,
        default:0,
        require:true
    }


},{
    timestamps:true
})

module.exports = mongoose.model("ShortUrls",UrlShornerSchema)