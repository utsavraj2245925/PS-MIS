import mongoose from "mongoose";

const rejectedSchema = new mongoose.Schema(
    {
      modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
      },
      partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "RejectionReasonMaster",
      },
      rejectedQnt:{
        type:Number,
        default: 0
      },
      rejectedType:{
        type:String,
        default: ''
      }

    },
    { timestamps: true }
  );

export default mongoose.model("Rejected", rejectedSchema);