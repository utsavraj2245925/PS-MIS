import mongoose from "mongoose";

const conveyorStrengthSchema = new mongoose.Schema(
  {

    locationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Location",
        required: true,
    },

    locationName: {
        type: String,
        required: true,
        trim: true,
    },

    plantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Plant",
      required: true,
    },

    shiftId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },

    conveyorId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },

    // Snapshot Values
    plantName: {
      type: String,
      trim: true,
    },


    shiftName: {
      type: String,
      trim: true,
    },

    conveyorName: {
      type: String,
      trim: true,
    },

    availableTime: {
      type:Number,
      required:true
    },

    conveyorLength: {
      type:Number,
      required:true,
      min:1
    },

    conveyorSpeed: {
      type: Number,
      required:true,
      default: 0,
    },

    pitchDistance: {
      type: Number,
      required:true,
      default: 0,
    },

    demandPerShift: {
      type: Number,
      required:true,
      default: 0,
    },

    hangerEfficiency: {
      type: Number,
      enum: [100, 95, 85, 75],
      default: 85,
      required:true,
    },

    totalHangers: {
      type: Number,
      default: 0,
    },

    processTime: {
      type: Number,
      default: 0,
    },

    totalRoundsShift: {
      type: Number,
      default: 0,
    },

    hangerPerMinute: {
      type: Number,
      default: 0,
    },

    availableHangerPerShift: {
      type: Number,
      default: 0,
    },

    effectiveHangerPerShift: {
      type: Number,
      default: 0,
    },


    status:{
        type:String,
        enum:["Active","Inactive"],
        default:"Active"
    },
  },
  {
    timestamps: true,
  }
);

/* One configuration per Plant + Shift + Conveyor */
conveyorStrengthSchema.index(
  {
    locationId:1,
    plantId:1,
    shiftId:1,
    conveyorId:1,
  },
  {
    unique: true,
  }
);

const ConveyorStrength =
  mongoose.models.ConveyorStrength ||
  mongoose.model("ConveyorStrength", conveyorStrengthSchema);

export default ConveyorStrength;