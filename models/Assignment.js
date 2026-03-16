const mongoose = require("mongoose");

const assignmentSchema = new mongoose.Schema({
  faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty", required: true },
  subject_offering_id: { type: mongoose.Schema.Types.ObjectId, ref: "SubjectOffering", required: true },
  
  title: { type: String, required: true },
  instructions: { type: String },
  
  // Timing
  publish_date: { type: Date, default: Date.now },
  submission_deadline: { type: Date, required: true }, // Faculty can modify this
  
  // Input Method
  assignment_mode: { type: String, enum: ['Manual_Upload', 'AI_Generated'], required: true },
  assignment_type: { type: String, enum: ['mcq', 'written', 'coding'], required: true },

  // For Manual Mode: Stores Drive Link or local URL
  manual_resource_url: { type: String }, 

  // For AI Mode: Stores structured output from LangGraph Agent
  questions: [{
    question_text: { type: String, required: true },
    options: [String],        // For MCQs
    correct_answer: String,   // For MCQs (used for auto-grading)
    model_answer: String,     // For Written
    starter_code: String,     // For Coding
    explanation: String,
    citations: [String]       // Source labels (e.g., 'artofdatascience.docx')
  }],

  is_active: { type: Boolean, default: true },
  created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Assignment", assignmentSchema);