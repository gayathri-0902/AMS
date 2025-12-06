const mongoose = require("mongoose");

const SubjectOfferingSchema = new mongoose.Schema(
  {
    course_master_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CourseMaster",
      required: true,
    },
    yr_sem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YrSem",
      required: true,
    },
    is_active: { type: Boolean, default: true },
  },
  { collection: "subject_offerings" }
);

module.exports = mongoose.model("SubjectOffering", SubjectOfferingSchema);
