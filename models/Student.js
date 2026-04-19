const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    yr_sem_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "YrSem",
      required: true,
    },
    roll_no: { type: String, unique: true },
    email: { type: String, unique: true },
    is_archived: { type: Boolean, default: false },
    archived_at: { type: Date },
  },
  { collection: "students" }
);

module.exports = mongoose.model("Student", StudentSchema);
