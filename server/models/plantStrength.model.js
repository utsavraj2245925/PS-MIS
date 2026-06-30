import mongoose from "mongoose";

const plantStrengthSchema = new mongoose.Schema({
      plantId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Plant"
      },

      conveyorName:String,

      conveyorLength: {
        type: Number,
        default: 0,
      },

      conveyorSpeed: {
        type: Number,
        default: 0,
      },

      pitchDistance: {
        type: Number,
        default: 0,
      },

      // =====================================
      // SHIFT CONFIGURATION
      // =====================================

      availableTime: {
        type: Number,
        default: 630,
      },

      shiftsPerDay: {
        type: Number,
        default: 1,
      },

      demandPerShift: {
        type: Number,
        default: 0,
      },

      // =====================================
      // HANGER EFFICIENCY
      // =====================================

      hangerEfficiency: {
        type: Number,
        enum: [100, 95, 85, 75],
        default: 85,
      },

      // =====================================
      // AUTO CALCULATED VALUES
      // =====================================

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

      taktTime: {
        type: Number,
        default: 0,
      },

      estimatedProductionCapacity: {
        type: Number,
        default: 0,
      },


      status: {
        type: String,
        enum: ["Active", "Inactive"],
        default: "Active",
      },

    },
    {
      timestamps: true,
    }
  );

export default mongoose.model("PlantStrength", plantStrengthSchema);