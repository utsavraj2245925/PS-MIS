import mongoose from "mongoose";

const downtimeTypesSchema = new mongoose.Schema(
    {
      name:{
        type:String,
        required:true
    },
   
    type: {
        type: String,
        enum: ["Planned", "Unplanned"],
      },

 }, {timestamps:true})
 
const downtimeTypesModel = mongoose.model("downtimeTypes", downtimeTypesSchema)
export default downtimeTypesModel 