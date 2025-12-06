const mongoose = require("mongoose");

const CourseMasterSchema = new mongoose.Schema(
  {
    course_code: { type: String, required: true, unique: true },
    course_name: { type: String, required: true },
    credits: { type: Number, required: true },
  },
  { collection: "course_masters" }
);

module.exports = mongoose.model("CourseMaster", CourseMasterSchema);
