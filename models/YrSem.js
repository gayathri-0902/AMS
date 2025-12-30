const mongoose = require("mongoose");

const YrSemSchema = new mongoose.Schema(
  {
    yr: { type: Number, required: true }, 
    sem: { type: Number, required: true }, 
    stream: { type: String, required: true },
    academic_yr: { type: String, required: true },
  },
  { collection: "yr_sems" }
);

module.exports = mongoose.model("YrSem", YrSemSchema);
