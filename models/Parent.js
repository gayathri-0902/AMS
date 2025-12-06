const mongoose = require("mongoose");

const ParentSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: { type: String, required: true },
    phno: { type: String, required: true },
  },
  { collection: "parents" }
);

module.exports = mongoose.model("Parent", ParentSchema);
