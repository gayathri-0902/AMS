const mongoose = require("mongoose");

const FacultySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    is_archived: { type: Boolean, default: false },
  },
  { collection: "faculties" }
);

module.exports = mongoose.model("Faculty", FacultySchema);
