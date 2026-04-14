const express = require("express");
const router = express.Router();
const Submission = require("../models/Submission");
const Assignment = require("../models/Assignment");

/**
 * @route POST /api/submission/submit
 * @desc Handle student hand-ins with auto-grading for MCQs
 */
router.post("/submit", async (req, res) => {
  try {
    const { assignment_id, student_id, answers, submission_file_url } = req.body;

    if (!assignment_id || !student_id) {
      return res.status(400).json({ error: "Missing assignment_id or student_id" });
    }

    // 1. Fetch the original assignment for verification and auto-grading
    const assignment = await Assignment.findById(assignment_id);
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });

    // Enforce Deadline
    if (new Date() > new Date(assignment.submission_deadline)) {
        return res.status(400).json({ error: "Deadline has passed. Late submissions are not accepted." });
    }

    let auto_score = 0;
    let graded_answers = [];

    // 2. Performance Auto-Grading if it's an MCQ type
    if (assignment.assignment_type === "mcq" && answers && answers.length > 0) {
      let correctCount = 0;
      graded_answers = answers.map(ans => {
        const question = assignment.questions[ans.question_index];
        const isCorrect = question && question.correct_answer === ans.student_selected_option;
        if (isCorrect) correctCount++;
        return {
          ...ans,
          is_correct: isCorrect
        };
      });
      auto_score = (correctCount / assignment.questions.length) * 100;
    }

    // 3. Create the submission record
    const submission = new Submission({
      assignment_id,
      student_id,
      answers: graded_answers,
      submission_file_url,
      auto_score,
      status: assignment.assignment_type === "mcq" ? "Graded" : "Submitted",
      hand_in_date: new Date(),
      graded_at: assignment.assignment_type === "mcq" ? new Date() : null
    });

    await submission.save();

    res.status(201).json({
      message: "Assignment submitted successfully",
      submission
    });

  } catch (error) {
    console.error("Submission Error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

/**
 * @route GET /api/submission/assignment/:assignmentId
 * @desc Fetch all student submissions for a specific task (Faculty View)
 */
router.get("/assignment/:assignmentId", async (req, res) => {
  try {
    const submissions = await Submission.find({ assignment_id: req.params.assignmentId })
      .populate("student_id", "name roll_no")
      .sort({ hand_in_date: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching submissions" });
  }
});

/**
 * @route GET /api/submission/student/:studentId
 * @desc Fetch all submissions by a student to see their history/grades
 */
router.get("/student/:studentId", async (req, res) => {
  try {
    const submissions = await Submission.find({ student_id: req.params.studentId })
      .populate("assignment_id", "title assignment_type submission_deadline")
      .sort({ hand_in_date: -1 });
    res.json(submissions);
  } catch (error) {
    res.status(500).json({ error: "Error fetching submission history" });
  }
});

/**
 * @route GET /api/submission/student/:studentId/assignment/:assignmentId
 * @desc Check if a student has already submitted a specific assignment
 */
router.get("/student/:studentId/assignment/:assignmentId", async (req, res) => {
  try {
    const submission = await Submission.findOne({ 
      student_id: req.params.studentId,
      assignment_id: req.params.assignmentId
    });
    if (!submission) return res.status(200).json(null);
    res.json(submission);
  } catch (error) {
    res.status(500).json({ error: "Error checking submission status" });
  }
});

/**
 * @route PATCH /api/submission/:submissionId/grade
 * @desc Faculty grades a written/coding submission manually
 */
router.patch("/:submissionId/grade", async (req, res) => {
  try {
    const { manual_grade, faculty_feedback } = req.body;
    const submission = await Submission.findByIdAndUpdate(
      req.params.submissionId,
      {
        manual_grade,
        faculty_feedback,
        status: "Graded",
        graded_at: new Date(),
      },
      { new: true }
    );
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json({ message: "Submission graded successfully", submission });
  } catch (error) {
    res.status(500).json({ error: "Error grading submission" });
  }
});

/**
 * @route PATCH /api/submission/:submissionId/link
 * @desc Student updates their submission link
 */
router.patch("/:submissionId/link", async (req, res) => {
  try {
    const { submission_file_url } = req.body;
    const submission = await Submission.findById(req.params.submissionId).populate("assignment_id");
    
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    
    // Check deadline
    if (new Date() > new Date(submission.assignment_id.submission_deadline)) {
        return res.status(400).json({ error: "Deadline has passed. Edits are no longer allowed." });
    }

    submission.submission_file_url = submission_file_url;
    await submission.save();

    res.json({ message: "Link updated successfully", submission });
  } catch (error) {
    res.status(500).json({ error: "Error updating link" });
  }
});

module.exports = router;
