const express = require("express");
const router = express.Router();
const axios = require("axios");
const Assignment = require("../models/Assignment");

// Flask Agent URL
const FLASK_API = process.env.FLASK_API_URL || "http://localhost:5001";

/**
 * @route POST /api/assignment/generate
 * @desc Generate an assignment using the AI Agent and save to Mongo
 */
router.post("/generate", async (req, res) => {
  try {
    const { faculty_id, subject_offering_id, title, instructions, free_text, year, branch } = req.body;
    const finalInstructions = instructions || free_text;

    if (!finalInstructions) {
      return res.status(400).json({ error: "Missing required fields: instructions is required" });
    }

    if (req.body.should_save && (!faculty_id || !subject_offering_id || !title)) {
      return res.status(400).json({ error: "Missing required fields for saving: faculty_id, subject_offering_id, and title are required" });
    }

    // 1. Proxy request to Flask Python Agent (Streaming)
    console.log(`[Node] Requesting AI Generation for: ${title}`);
    
    // We use axios here with responseType: 'stream' because Node native fetch 
    // has a hardcoded 5-minute timeout that kills long AI generation requests.
    const flaskResponse = await axios({
      method: 'post',
      url: `${FLASK_API}/api/assignment/generate`,
      data: {
        free_text: finalInstructions,
        year: year || 4,
        branch: branch || "CSDS",
        title: title || "New Assignment"
      },
      responseType: 'stream',
      timeout: 0 // Infinite timeout for long-running AI queries
    });

    // Set headers for SSE
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const stream = flaskResponse.data;

    stream.on('data', async (chunk) => {
        const textChunk = chunk.toString();
        res.write(textChunk);

        // If this is the 'complete' event, we ALSO save it to MongoDB if should_save is true
        if (req.body.should_save && textChunk.includes('"status": "complete"')) {
            try {
                // Extract the JSON from the SSE data: line
                const lines = textChunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const data = JSON.parse(line.slice(6));
                        if (data.status === 'complete') {
                            const { assignment, metadata } = data;
                            const newAssignment = new Assignment({
                                faculty_id,
                                subject_offering_id,
                                title,
                                instructions,
                                publish_date: new Date(),
                                submission_deadline: req.body.due_date ? new Date(req.body.due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                                assignment_mode: "AI_Generated",
                                assignment_type: metadata.type || "mcq",
                                questions: assignment.questions.map(q => ({
                                    question_text: q.question_text,
                                    options: q.options || [],
                                    correct_answer: q.correct_answer,
                                    model_answer: q.model_answer || q.model_code,
                                    starter_code: q.starter_code || "",
                                    explanation: q.explanation,
                                    citations: q.citations || []
                                })),
                                is_active: true
                            });
                            await newAssignment.save();
                            console.log("[Node] Assignment saved to DB successfully.");
                        }
                    }
                }
            } catch (saveError) {
                console.error("[Node] Error saving streamed assignment:", saveError);
            }
        }
    });

    stream.on('end', () => {
        res.end();
    });

    stream.on('error', (err) => {
        console.error("Stream connection errored:", err);
        if (!res.headersSent) {
            res.status(500).json({ error: "Stream error from AI backend" });
        } else {
            res.write(`data: ${JSON.stringify({ status: "error", message: "Stream closed abruptly" })}\n\n`);
            res.end();
        }
    });

  } catch (error) {
    console.error("Assignment Generation Error:", error.message);
    if (!res.headersSent) {
      res.status(500).json({ 
        error: "Failed to generate assignment", 
        details: error.response ? error.response.data : error.message 
      });
    } else {
      // If headers are already sent, we are in the middle of an SSE stream.
      // Send an SSE error event instead of trying to restart the response.
      res.write(`data: ${JSON.stringify({ status: "error", message: "Stream interrupted or failed" })}\n\n`);
      res.end();
    }
  }
});

/**
 * @route POST /api/assignment/save
 * @desc Save an already generated AI assignment to the database
 */
router.post("/save", async (req, res) => {
  try {
    const { faculty_id, subject_offering_id, title, instructions, due_date, assignment, metadata } = req.body;

    if (!faculty_id || !subject_offering_id || !title || !assignment) {
      return res.status(400).json({ error: "Missing required fields for saving" });
    }

    const newAssignment = new Assignment({
        faculty_id,
        subject_offering_id,
        title,
        instructions,
        publish_date: new Date(),
        submission_deadline: due_date ? new Date(due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        assignment_mode: "AI_Generated",
        assignment_type: metadata?.type || assignment.assignment_type || "mcq",
        questions: assignment.questions.map(q => ({
            question_text: q.question_text,
            options: q.options || [],
            correct_answer: q.correct_answer,
            model_answer: q.model_answer || q.model_code,
            starter_code: q.starter_code || "",
            explanation: q.explanation,
            citations: q.citations || []
        })),
        is_active: true
    });

    const saved = await newAssignment.save();
    res.status(201).json({ message: "Assignment saved successfully", assignment: saved });
  } catch (error) {
    console.error("Error saving assignment directly:", error);
    res.status(500).json({ error: "Failed to save assignment" });
  }
});

/**
 * @route POST /api/assignment/manual
 * @desc Create an assignment manually (link-based)
 */
router.post("/manual", async (req, res) => {
  try {
    const { faculty_id, subject_offering_id, title, file_url, due_date } = req.body;

    if (!faculty_id || !subject_offering_id || !title) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const newAssignment = new Assignment({
      faculty_id,
      subject_offering_id,
      title,
      instructions: "Manual Upload - See attached link.",
      manual_resource_url: file_url,
      publish_date: new Date(),
      submission_deadline: due_date ? new Date(due_date) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      assignment_mode: "Manual_Upload",
      assignment_type: "written", // Manual uploads are usually written documents
      is_active: true
    });

    await newAssignment.save();
    res.status(201).json({ message: "Assignment posted successfully", assignment: newAssignment });
  } catch (error) {
    res.status(500).json({ error: "Error creating manual assignment" });
  }
});

/**
 * @route GET /api/assignment/faculty/:facultyId
 * @desc Fetch all assignments created by a specific faculty
 */
router.get("/faculty/:facultyId", async (req, res) => {
  try {
    const assignments = await Assignment.find({ faculty_id: req.params.facultyId })
      .populate("subject_offering_id")
      .sort({ created_at: -1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching assignments" });
  }
});

/**
 * @route GET /api/assignment/:id
 * @desc Fetch a single assignment by ID
 */
router.get("/:id", async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id).populate("faculty_id", "name");
    if (!assignment) return res.status(404).json({ error: "Assignment not found" });
    res.json(assignment);
  } catch (error) {
    res.status(500).json({ error: "Error fetching assignment" });
  }
});

/**
 * @route GET /api/assignment/subject/:subjectId
 * @desc Fetch all assignments for a specific subject (for students)
 */
router.get("/subject/:subjectId", async (req, res) => {
  try {
    const assignments = await Assignment.find({ 
      subject_offering_id: req.params.subjectId,
      is_active: true 
    }).sort({ submission_deadline: 1 });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Error fetching assignments" });
  }
});

/**
 * @route PATCH /api/assignment/:id/deadline
 * @desc Extend or change the submission deadline
 */
router.patch("/:id/deadline", async (req, res) => {
  try {
    const { deadline } = req.body;
    const assignment = await Assignment.findByIdAndUpdate(
      req.params.id,
      { submission_deadline: new Date(deadline) },
      { new: true }
    );
    res.json({ message: "Deadline updated", assignment });
  } catch (error) {
    res.status(500).json({ error: "Error updating deadline" });
  }
});

/**
 * @route DELETE /api/assignment/:id
 * @desc Delete an assignment
 */
router.delete("/:id", async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    // Note: In a real app, you might also want to delete all submissions for this assignment
    res.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Error deleting assignment" });
  }
});

module.exports = router;
