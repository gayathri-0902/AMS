const mongoose = require("mongoose");

const StudentEnrollmentSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    yr_sem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YrSem",
      required: true,
    },
    academic_yr: { type: String, required: true },
    status: {
      type: String,
      enum: ["active", "inactive", "graduated"],
      required: true,
    },
    start_date: { type: Date },
    end_date: { type: Date },
    is_archived: { type: Boolean, default: false },
  },
  { collection: "student_enrollments" }
);

module.exports = mongoose.model("StudentEnrollment", StudentEnrollmentSchema);
