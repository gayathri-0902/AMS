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

    teaching_quality: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    clarity: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    interaction: {
      type: Number,
      min: 1,
      max: 5,
      required: true,
    },

    comments: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

FeedbackSchema.index(
  { student_id: 1, subject_offering_id: 1 },
  { unique: true }
);

module.exports = mongoose.model("Feedback", FeedbackSchema);
