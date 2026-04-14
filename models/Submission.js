const mongoose = require("mongoose");

const submissionSchema = new mongoose.Schema({
  assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
  student_id: { type: mongoose.Schema.Types.ObjectId, ref: "Student", required: true },
  
  hand_in_date: { type: Date, default: Date.now },
  status: { type: String, enum: ['Submitted', 'Graded'], default: 'Submitted' },

  // For MCQs: Array of selected options
  answers: [{
    question_index: Number,
    student_selected_option: String,
    is_correct: Boolean, // Auto-computed on submit
  }],

  // For Written/Coding: Drive link to student's work
  submission_file_url: { type: String }, 

  // Grading
  auto_score: { type: Number }, // Percent for MCQs
  manual_grade: { type: String }, // e.g., 'A', '8/10'
  faculty_feedback: { type: String },
  graded_at: { type: Date }
});

module.exports = mongoose.model("Submission", submissionSchema);
