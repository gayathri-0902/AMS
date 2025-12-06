const mongoose = require("mongoose");

const ParentStudentMapSchema = new mongoose.Schema(
  {
    parent_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parent",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    relationship: {
      type: String,
      enum: ["Father", "Mother", "Guardian"],
      required: true,
    },
  },
  { collection: "parent_student_map" }
);

module.exports = mongoose.model("ParentStudentMap", ParentStudentMapSchema);
