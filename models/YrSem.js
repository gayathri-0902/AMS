const mongoose = require("mongoose");

const YrSemSchema = new mongoose.Schema(
  {
    yr: { type: Number, required: true }, 
    sem: { type: Number, required: true }, 
    stream: { type: String, required: true },
    academic_yr: { type: String, required: true },
    active_feedback_phase: { 
      type: String, 
      enum: ["None", "Mid-1", "Mid-2", "End-Sem"], 
      default: "None" 
    },
  },
  { collection: "yr_sems" }
);

module.exports = mongoose.model("YrSem", YrSemSchema);
