import mongoose from "mongoose";

const consumableSchema =new mongoose.Schema({
  usedQnt:{
    type: Number,
    default: 0
  },
  materialId: {
    type: mongoose.Schema.Types.ObjectId,
    ref:"Material"
  },
  plantId:{
     type: mongoose.Schema.Types.ObjectId,
     ref: "Plant"
  }
},{timestamps:true});

export default mongoose.model("Consumable", consumableSchema);