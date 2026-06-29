import mongoose from "mongoose";

const downtimeSchema = new mongoose.Schema(
    {
      type: {
        type: String,
        enum: ["Planned", "Unplanned"],
      },

      startTime: Date,
      endTime: Date,
      duration: Number,
      description: String,
      plantId:{
        type: mongoose.Schema.Types.ObjectId,
        ref:"Plant"
      }
    },
    { timestamps: true }
  );

export default mongoose.model("DownTime", downtimeSchema);