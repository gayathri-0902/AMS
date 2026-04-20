const mongoose = require("mongoose");

const ResetTokenSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
  },
  token: {
    type: String,
    required: true,
    unique: true,
  },
  used: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// TTL index: MongoDB auto-deletes the document 15 minutes after createdAt
ResetTokenSchema.index({ createdAt: 1 }, { expireAfterSeconds: 900 });

module.exports = mongoose.model("ResetToken", ResetTokenSchema);
