const mongoose = require("mongoose");

const FacultyAssignmentSchema = new mongoose.Schema(
  {
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    subject_offering_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectOffering",
      required: true,
    },
    start_date: { type: Date, default: Date.now },
  },
  { collection: "faculty_assignments" }
);

module.exports = mongoose.model("FacultyAssignment", FacultyAssignmentSchema);
