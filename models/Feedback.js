const mongoose = require("mongoose");

const FeedbackSchema = new mongoose.Schema(
  {
    student_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    subject_offering_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectOffering",
      required: true,
    },

    regularity: { type: Number, min: 1, max: 5, required: true },
    interaction: { type: Number, min: 1, max: 5, required: true },
    explanation: { type: Number, min: 1, max: 5, required: true },
    resources: { type: Number, min: 1, max: 5, required: true },
    counselling: { type: Number, min: 1, max: 5, required: true },
    remedial: { type: Number, min: 1, max: 5, required: true },
    syllabus_alignment: { type: Number, min: 1, max: 5, required: true },
    pace: { type: Number, min: 1, max: 5, required: true },

    comments: { type: String },
  },
  { timestamps: true }
);

FeedbackSchema.index(
  { student_id: 1, subject_offering_id: 1 },
  { unique: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
