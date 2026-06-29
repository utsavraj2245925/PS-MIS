import mongoose, { mongo } from "mongoose";

const materialSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["powder", "chemical", "items"],
        required:true
    },
    mesurmentType:{
        type:String,
        enum:["kg", "ltr", "pcs"],
        default:"kg"
    },
    plantId:{
        type:mongoose.Schema.Types.ObjectId,
        ref: "Plant"
    },

}, {timestamps:true})

const materialModel = mongoose.model("Material", materialSchema)
export default materialModel