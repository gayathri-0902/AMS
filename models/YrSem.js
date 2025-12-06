const mongoose = require("mongoose");

const YrSemSchema = new mongoose.Schema(
  {
    yr: { type: Number, required: true }, // e.g. 1, 2, 3, 4
    sem: { type: Number, required: true }, // e.g. 1, 2
    stream: { type: String, required: true }, // e.g. CSE, ECE
    academic_yr: { type: String, required: true }, // e.g. 2025-26
  },
  { collection: "yr_sems" }
);

module.exports = mongoose.model("YrSem", YrSemSchema);
