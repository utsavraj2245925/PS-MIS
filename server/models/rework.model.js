import mongoose from "mongoose";

const reworkSchema = new mongoose.Schema({
      modelId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Model",
      },

      partId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Part",
      },


      reworkedQnt: {
        type: Number,
        default: 0
      },

      reworkedType: {
        type: String,
        default: 0
      },
    },
    { timestamps: true }
  );

  const reworkModel = mongoose.model("Rework", reworkSchema);
export default reworkModel