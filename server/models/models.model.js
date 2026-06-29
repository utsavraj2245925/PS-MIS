import mongoose from "mongoose";

const modelSchema = new mongoose.Schema({
    modelName: {
      type: String,
      required: true,
      trim: true,
      unique: true,
    },  

    status:{
      type:String,
      enum:["active", "inactive"],
      default : "active"
    }

  },{ timestamps: true});



const modelsModel = mongoose.model("Model", modelSchema);
export default modelsModel

