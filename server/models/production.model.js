import mongoose from "mongoose";

const productionSchema = new mongoose.Schema({
  modelId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Model"
  },
  partId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Part"
  },
  defectId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Defect"
  },
  reworkId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Rework"
  },
  rejectedId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Reject"
  },
  consumedId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Consume"
  },
  downnTimeId:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"downtimeTypes"
  }],

  unplannedDowntimeId:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"downtimeTypes"
  }],

  plantId:{
    type: mongoose.Schema.Types.ObjectId,
    ref:"Plant"
  },
  
  totalRejected:{
    type: Number,
    default: 0
  },
  totalDefects:{
    type: Number,
    default: 0
  },

  totalRework:{
    type: Number,
    default: 0
  },

  shiftInfo:{
    shiftType:{
      type: String,
      enum: ["A", "B"],
      default: "A"
    },
    shiftStart: Date,
    shiftEnd: Date,
    userId:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    },
    totalManPower:{
      type: Number,
      default: 0
    },
    requiredManPower: {
      type: Number,
      default: 0
    },
    availableManPower: {
      type: Number,
      default: 0
    }
  }

  },{ timestamps: true });

const productionModel = mongoose.model("Production", productionSchema);
export default productionModel