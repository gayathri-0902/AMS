const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    user_name: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["admin", "faculty", "student", "parent"],
      required: true,
    },
  },
  { collection: "users" }
);

module.exports = mongoose.model("User", UserSchema);
