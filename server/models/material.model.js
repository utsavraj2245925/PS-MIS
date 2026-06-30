import mongoose, { mongo } from "mongoose";

const materialSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    type:{
        type:String,
        enum:["powderItems", "chemicalItems", "usefulItems"],
        required:true
    },
    mesurmentType:{
        type:String,
        enum:["kg", "ltr", "pcs"],
        default:"kg"
    },
    
  
}, {timestamps:true})

const materialModel = mongoose.model("Material", materialSchema)
export default materialModel