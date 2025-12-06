const mongoose = require("mongoose");

const ClassNotesSchema = new mongoose.Schema(
  {
    subject_offering_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubjectOffering",
      required: true,
    },
    faculty_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Faculty",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String },
    file_url: { type: String, required: true },
    upload_date: { type: Date, default: Date.now },
    is_visible: { type: Boolean, default: true },
    content_text: { type: String }, // For RAG mainly
  },
  { collection: "class_notes" }
);

module.exports = mongoose.model("ClassNotes", ClassNotesSchema);
