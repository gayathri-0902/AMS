const mongoose = require("mongoose");

const ClassSessionSchema = new mongoose.Schema(
  {
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
    date: { type: Date, required: true },
    is_conducted: { type: Boolean, default: true },
    session_no: { type: Number, required: true },
  },
  { collection: "class_sessions" }
);

module.exports = mongoose.model("ClassSession", ClassSessionSchema);
