const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  subject_offering_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SubjectOffering",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  instructions: {
    type: String,
  },
  file_url: { 
    type: String, // Stores the link to the uploaded document
    required: true,
  },
  due_date: {
    type: Date,
    required: true,
  },
  is_active: {
    type: Boolean,
    default: true,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Assignment", assignmentSchema);