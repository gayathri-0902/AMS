const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    class_session_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ClassSession",
      required: true,
    },
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    status: {
      type: String,
      enum: ["Present", "Absent"],
      required: true,
    },
    remarks: { type: String },
  },
  { collection: "attendances" }
);

module.exports = mongoose.model("Attendance", AttendanceSchema);
