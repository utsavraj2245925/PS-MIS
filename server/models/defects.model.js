import mongoose from "mongoose";

const defectSchema = new mongoose.Schema({
  defectedModel:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Model"
  },
  defectedPart:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Part"
  },
  defectedQnt:{
    type: Number,
    default: 0,
  },
  plantId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:"Plant"
  },
}, {timestamps: true});

const defectModel = mongoose.model("Defect", defectSchema);
export default defectModel