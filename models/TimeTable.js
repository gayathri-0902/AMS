const mongoose = require("mongoose");

const TimeTableSchema = new mongoose.Schema(
  {
    yr_sem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YrSem",
      required: true,
    },
    day_of_week: {
      type: String,
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      required: true,
    },
    session_no: { type: Number, required: true },
    start_time: { type: String, required: true }, // Format "HH:mm"
    end_time: { type: String, required: true }, // Format "HH:mm"
    subject_offering_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectOffering",
      required: true,
    },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    location: { type: String, required: true },
  },
  { collection: "time_table" }
);

module.exports = mongoose.model("TimeTable", TimeTableSchema);
