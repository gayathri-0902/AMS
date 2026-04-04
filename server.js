const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const { exec } = require('child_process'); // For automated port management

// --- Models ---
const User = require("./models/User");
const Admin = require("./models/Admin");
const Faculty = require("./models/Faculty");
const Student = require("./models/Student");
const YrSem = require("./models/YrSem");
const StudentEnrollment = require("./models/StudentEnrollment");
const CourseMaster = require("./models/CourseMaster");
const SubjectOffering = require("./models/SubjectOffering");
const FacultyAssignment = require("./models/FacultyAssignment");
const TimeTable = require("./models/TimeTable");
const ClassSession = require("./models/ClassSession");
const Attendance = require("./models/Attendance");
const Parent = require("./models/Parent");
const ParentStudentMap = require("./models/ParentStudentMap");
const ClassNotes = require("./models/ClassNotes");
const Feedback = require("./models/Feedback");
const Assignment = require("./models/Assignment");
const Submission = require("./models/Submission");

// --- Routes ---
const assignmentRoutes = require("./routes/assignmentRoutes");
const submissionRoutes = require("./routes/submissionRoutes");

dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3002;

// --- Automated Port Management (Linux Fix) ---
if (process.env.NODE_ENV !== 'production') {
  exec(`fuser -k ${PORT}/tcp`, (err) => {
    if (!err) console.log(`Cleared stale processes on port ${PORT}`);
  });
}

// --- Middleware ---
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

// --- Database Connection ---
if (!MONGO_URI) {
  console.error("MONGO_URI is not set in the environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// --- Route Middlewares ---
app.use("/api/assignment", assignmentRoutes);
app.use("/api/submission", submissionRoutes);

// --- ROUTES ---

// 1. Login Endpoint (MODIFIED: Ensures Parent Profile ID is used for mapping)
app.post("/api/login", async (req, res) => {
  const { body } = req;
  try {
    let user = await User.findOne({ user_name: body.identifier });

    if (!user && body.role === "student") {
      const student = await Student.findOne({ roll_no: body.identifier });
      if (student) {
        user = await User.findById(student.user_id);
      }
    }

    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(body.password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (body.role && user.role !== body.role) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    const responseData = {
      message: `${user.role.charAt(0).toUpperCase() + user.role.slice(1)} login successful`,
      role: user.role,
      userId: user._id,
    };

    if (user.role === "admin") {
      const admin = await Admin.findOne({ user_id: user._id });
      if (admin) responseData.adminId = admin._id;
    } else if (user.role === "faculty") {
      const faculty = await Faculty.findOne({ user_id: user._id });
      if (faculty) {
        responseData.facultyId = faculty._id;
        responseData.name = faculty.name;
      }
    } else if (user.role === "student") {
      const student = await Student.findOne({ user_id: user._id });
      if (student) {
        responseData.studentId = student._id;
        responseData.name = student.name;
        const enrollment = await StudentEnrollment.findOne({
          student_id: student._id,
          status: "active",
        });
        if (enrollment) {
          responseData.sectionId = enrollment.yr_sem_id;
        }
      }
    } else if (user.role === "parent") {
      const parent = await Parent.findOne({ user_id: user._id });
      if (parent) {
        // Fix: Use the Parent Profile ID (...7e8), not the user_id (...7e4)
        responseData.parentId = parent._id;
        responseData.name = parent.name;
      }
    }
    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Faculty Dashboard: Get classes for today
app.get("/api/faculty-dashboard/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });
    const timetableEntries = await TimeTable.find({
      faculty_id: facultyId,
      day_of_week: currentDay,
    })
      .populate({
        path: "subject_offering_id",
        populate: { path: "course_master_id" },
      })
      .populate("yr_sem_id")
      .sort({ session_no: 1 });

    if (!timetableEntries.length) {
      return res.status(200).json({ message: "No classes found for today." });
    }
    const result = timetableEntries.map((entry) => {
      const subject = entry.subject_offering_id;
      const course = subject ? subject.course_master_id : null;
      const yrSem = entry.yr_sem_id;
      return {
        _id: entry._id,
        class_name: course ? course.course_name : "Unknown Course",
        section_name: yrSem ? `${yrSem.stream} ${yrSem.yr}-${yrSem.sem}` : "Unknown Batch",
        section_id: yrSem ? yrSem._id : null,
        class_id: subject ? subject._id : null,
        session_no: entry.session_no,
        start_time: entry.start_time,
        end_time: entry.end_time
      };
    });
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Fetch students for marking attendance
app.get("/api/faculty-dashboard/students/:sectionId", async (req, res) => {
  const { sectionId } = req.params;
  try {
    const enrollments = await StudentEnrollment.find({
      yr_sem_id: sectionId,
      status: "active",
    }).populate("student_id").sort({ "student_id.roll_no": 1 });

    if (!enrollments || enrollments.length === 0) {
      return res.status(404).json({ message: "No students found in this section." });
    }

    const students = enrollments.map((enrollment) => {
      const student = enrollment.student_id;
      if (!student) return null;
      return {
        _id: student._id,
        student_name: student.name,
        student_id_no: student.roll_no || "N/A",
      };
    }).filter((s) => s !== null);

    students.sort((a, b) => a.student_id_no.localeCompare(b.student_id_no));
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 4. Student Dashboard: Timetable and Attendance Status
app.get("/api/student-dashboard/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const enrollment = await StudentEnrollment.findOne({
      student_id: studentId,
      status: "active",
    }).populate("yr_sem_id");

    if (!enrollment) return res.status(404).json({ error: "Active enrollment not found" });

    const yrSem = enrollment.yr_sem_id;
    const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });

    const timetableEntries = await TimeTable.find({
      yr_sem_id: yrSem._id,
      day_of_week: currentDay,
    })
      .populate({
        path: "subject_offering_id",
        populate: { path: "course_master_id" },
      })
      .populate("faculty_id")
      .sort({ session_no: 1 });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const sessions = await ClassSession.find({
      yr_sem_id: yrSem._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    const attendanceRecords = await Attendance.find({
      student_id: studentId,
      class_session_id: { $in: sessions.map(s => s._id) },
    }).populate("class_session_id");

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const key = `${record.class_session_id.subject_offering_id}_${record.class_session_id.session_no}`;
      attendanceMap[key] = record.status;
    });

    const timetableData = timetableEntries.map((entry) => {
      const subject = entry.subject_offering_id || {};
      const course = subject.course_master_id || {};
      const key = `${subject._id}_${entry.session_no}`;

      return {
        class_name: course.course_name || "Unknown Subject",
        class_code: course.course_code || "N/A",
        subject_offering_id: subject._id,
        faculty_name: entry.faculty_id ? entry.faculty_id.name : "Unknown",
        session_no: entry.session_no,
        day: entry.day_of_week,
        start_time: entry.start_time,
        end_time: entry.end_time,
        attendance_status: attendanceMap[key] || "Not Marked",
      };
    });

    res.json({
      studentDetails: {
        student_id_no: student.roll_no,
        branch_name: yrSem.stream,
        student_name: student.name,
        current_year: yrSem.yr,
        current_sem: yrSem.sem
      },
      timetableData
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});


// 5. Parent Dashboard Route (STABILIZED)
app.get("/api/parent/dashboard/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;

    // 1. Find the Parent Profile using either User ID or Profile ID
    const parentProfile = await Parent.findOne({
      $or: [{ _id: parentId }, { user_id: parentId }]
    });

    if (!parentProfile) {
      return res.status(404).json({ message: "Parent profile not found." });
    }

    // 2. Find student mappings
    const mappings = await ParentStudentMap.find({ parent_id: parentProfile._id }).populate("student_id");

    // If no mappings exist, send empty array instead of crashing
    if (!mappings || mappings.length === 0) {
      return res.json([]);
    }

    const childrenData = await Promise.all(mappings.map(async (mapping) => {
      const student = mapping.student_id;
      if (!student) return null;

      // 3. Safe Enrollment Check (Optional Chaining prevents 500 errors)
      const enrollment = await StudentEnrollment.findOne({
        student_id: student._id,
        status: "active"
      }).populate("yr_sem_id");

      // 4. Safe Attendance Calculation
      const allRecords = await Attendance.find({ student_id: student._id });

      let percentage = "0.0";
      if (allRecords.length > 0) {
        const presentCount = allRecords.filter(r => r.status === "Present").length;
        percentage = ((presentCount / allRecords.length) * 100).toFixed(1);
      }

      return {
        studentDetails: {
          student_id: student._id,
          student_name: student.name || "Unknown Student",
          student_id_no: student.roll_no || "N/A",
          branch_name: enrollment?.yr_sem_id?.stream || "General",
        },
        attendanceStats: {
          percentage: percentage
        }
      };
    }));

    // Remove any nulls and send to frontend
    res.json(childrenData.filter(child => child !== null));

  } catch (error) {
    console.error("Dashboard Logic Error:", error);
    // Sending a JSON error prevents the frontend from hanging
    res.status(500).json({ message: "Server encountered an error calculating student data." });
  }
});
// 6. Overall Attendance (Student Perspective)
app.get("/api/attendance/:studentId", async (req, res) => {
  const { studentId } = req.params;
  try {
    const enrollment = await StudentEnrollment.findOne({ student_id: studentId, status: "active" });
    if (!enrollment) return res.status(404).json({ error: "Not enrolled" });

    const subjects = await SubjectOffering.find({
      yr_sem_id: enrollment.yr_sem_id,
    }).populate("course_master_id");

    const subjectAttendance = [];
    for (const subject of subjects) {
      const sessions = await ClassSession.find({ subject_offering_id: subject._id });
      const records = await Attendance.find({
        student_id: studentId,
        class_session_id: { $in: sessions.map(s => s._id) },
      });
      const present = records.filter((r) => r.status === "Present").length;
      subjectAttendance.push({
        subject_offering_id: subject._id,
        class_name: subject.course_master_id.course_name,
        class_code: subject.course_master_id.course_code,
        present_count: present,
        total_count: records.length,
        percentage: records.length > 0 ? ((present / records.length) * 100).toFixed(2) : "0.00",
      });
    }
    res.json({ subjectAttendance });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 7. Submit Attendance
app.post("/api/attendance", async (req, res) => {
  const { classId, attendanceData, sessionNo } = req.body;
  try {
    const assignment = await FacultyAssignment.findOne({ subject_offering_id: classId });
    const facultyId = assignment ? assignment.faculty_id : null;

    const session = new ClassSession({
      subject_offering_id: classId,
      faculty_id: facultyId,
      date: new Date(),
      is_conducted: true,
      session_no: sessionNo
    });

    await session.save();

    const attendanceRecords = Object.keys(attendanceData).map((studentId) => ({
      class_session_id: session._id,
      student_id: studentId,
      status: attendanceData[studentId],
    }));

    await Attendance.insertMany(attendanceRecords);
    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

/* version 1 admin dashboard routes
// 9. Admin: Create Student
app.post("/api/admin/student", async (req, res) => {
  const { name, roll_no, email, stream, yr, sem, academic_yr, password } = req.body;
  try {
    let user = await User.findOne({ user_name: email });
    if (user) return res.status(400).json({ message: "User already exists" });

    let yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream, academic_yr });
    if (!yrSem) {
      yrSem = new YrSem({ yr: Number(yr), sem: Number(sem), stream, academic_yr });
      await yrSem.save();
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ user_name: email, password: hashedPassword, role: "student" });
    await user.save();

    const student = new Student({ user_id: user._id, name, yr_sem_id: yrSem._id, roll_no, email });
    await student.save();

    const enrollment = new StudentEnrollment({
      student_id: student._id,
      yr_sem_id: yrSem._id,
      academic_yr,
      status: "active",
      start_date: new Date()
    });
    await enrollment.save();

    res.status(201).json({ message: "Student created successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});*/

// 10. Admin: Create Schedule (Timetable Session)
app.post("/api/admin/schedule", async (req, res) => {
  const { yr_sem_id, course_code, faculty_email, day, start_time, end_time, location, session_no } = req.body;

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Basic Validation
    if (!yr_sem_id || !course_code || !faculty_email || !day || !start_time || !end_time || !session_no) {
      throw new Error("Missing required fields for timetable session");
    }

    if (start_time >= end_time) {
      throw new Error("Start time must be earlier than end time");
    }

    const dayMap = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };
    const shortDay = dayMap[day] || day;

    // 2. Fetch Models
    const faculty = await Faculty.findOne({ email: faculty_email }).session(session);
    if (!faculty) throw new Error(`Faculty with email ${faculty_email} not found`);

    const course = await CourseMaster.findOne({ course_code }).session(session);
    if (!course) throw new Error(`Course with code ${course_code} not found`);

    // 3. Ensure Subject Offering exists for this batch
    const subjectOffering = await SubjectOffering.findOne({
      course_master_id: course._id,
      yr_sem_id
    }).session(session);

    if (!subjectOffering) {
      throw new Error(`The course ${course_code} is not offered for this batch.`);
    }

    // 4. Ensure Faculty is assigned to this Subject Offering (NEW STRICT CHECK)
    const assignment = await FacultyAssignment.findOne({
      faculty_id: faculty._id,
      subject_offering_id: subjectOffering._id
    }).session(session);

    if (!assignment) {
      throw new Error("This faculty is not assigned for this class.");
    }

    // 5. BUSINESS LOGIC VALIDATION

    // A. Check Batch Availability (Unique Session per Section per Day)
    const batchConflict = await TimeTable.findOne({
      yr_sem_id,
      day_of_week: shortDay,
      session_no: Number(session_no)
    }).session(session);

    if (batchConflict) {
      throw new Error(`This batch already has a session assigned for ${day} at Session ${session_no}`);
    }

    // B. Check Faculty Availability
    const facultyConflict = await TimeTable.findOne({
      faculty_id: faculty._id,
      day_of_week: shortDay,
      session_no: Number(session_no)
    }).session(session);

    if (facultyConflict) {
      throw new Error(`${faculty.name} is already teaching another class during ${day} Session ${session_no}`);
    }

    // 6. Create the Entry
    const timetable = new TimeTable({
      yr_sem_id,
      day_of_week: shortDay,
      session_no: Number(session_no),
      start_time,
      end_time,
      subject_offering_id: subjectOffering._id,
      faculty_id: faculty._id,
      location: location || "TBD"
    });

    await timetable.save({ session });

    await session.commitTransaction();
    res.status(201).json({ message: "Schedule created successfully" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Create schedule error:", error);
    res.status(400).json({ message: error.message || "Server error while creating schedule" });
  } finally {
    session.endSession();
  }
});

/*
// 11. Admin: Parent and Mapping
app.post("/api/admin/parent", async (req, res) => {
  const { name, email, password, phno } = req.body;
  try {
    let user = await User.findOne({ user_name: email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ user_name: email, password: hashedPassword, role: "parent" });
    await user.save();
    const parent = new Parent({ user_id: user._id, name, phno });
    await parent.save();
    res.status(201).json({ message: "Parent created successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/admin/parent/map", async (req, res) => {
  const { parent_email, student_roll_no, relationship } = req.body;
  try {
    const parentUser = await User.findOne({ user_name: parent_email });
    const parent = await Parent.findOne({ user_id: parentUser?._id });
    const student = await Student.findOne({ roll_no: student_roll_no });
    if (!parent || !student) return res.status(404).json({ message: "Parent or Student not found" });
    const mapping = new ParentStudentMap({ parent_id: parent._id, student_id: student._id, relationship });
    await mapping.save();
    res.status(201).json({ message: "Parent linked successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});*/

// 8. Notes Routes
app.post("/api/notes", async (req, res) => {
  const { subject_offering_id, faculty_id, title, description, file_url } = req.body;
  try {
    const note = new ClassNotes({
      subject_offering_id,
      faculty_id,
      title,
      description,
      file_url,
      upload_date: new Date(),
      is_visible: true
    });
    await note.save();
    res.status(201).json({ message: "Note added successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.get("/api/notes/:subjectOfferingId", async (req, res) => {
  try {
    const notes = await ClassNotes.find({
      subject_offering_id: req.params.subjectOfferingId,
      is_visible: true
    }).populate("faculty_id", "name").sort({ upload_date: -1 });
    res.json(notes);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// 13. Assignment Routes (Deprecated in favor of /api/assignment router)
// Old routes /api/faculty/assignments and /api/assignments/:id are now handled by assignmentRoutes.js

// 10. Feedback Routes
app.get("/api/feedback/eligibility/:studentId", async (req, res) => {
  try {
    const enrollment = await StudentEnrollment.findOne({ student_id: req.params.studentId });
    if (!enrollment || !enrollment.end_date) return res.json({ feedbackAllowed: false });
    const todayStr = new Date().toISOString().slice(0, 10);
    const endDateStr = new Date(enrollment.end_date).toISOString().slice(0, 10);
    res.json({ feedbackAllowed: todayStr === endDateStr });
  } catch (err) { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/feedback", async (req, res) => {
  try {
    const feedback = new Feedback(req.body);
    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

/* version 2 admin dashboard routes 
app.post("/api/admin/setup-faculty", async (req, res) => {
  try {
    const { users_entries, faculties_entries } = req.body;
    const userMap = {};
    for (const userData of users_entries) {
      let user = await User.findOne({ user_name: userData.user_name });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        user = new User({ user_name: userData.user_name, password: hashedPassword, role: userData.role });
        await user.save();
      }
      userMap[user.user_name] = user;
    }
    for (const facultyData of faculties_entries) {
      const user = userMap[facultyData.email];

      if (!user) {
        console.warn(`User not found for faculty email: ${facultyData.email}`);
        continue;
      }

      let faculty = await Faculty.findOne({ user_id: user._id });

      if (!faculty) {
        faculty = new Faculty({
          user_id: user._id,
          name: facultyData.name,
          email: facultyData.email
        });

        await faculty.save();
        summary.faculty_created.push(facultyData.email);
      } else {
        summary.faculty_existing.push(facultyData.email);
      }
    }

    const nothingCreated =
      summary.users_created.length === 0 &&
      summary.faculty_created.length === 0;

    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated
        ? "Users and faculty already exist. No operation performed."
        : "Users and faculty processed successfully",
      summary
    });

  } catch (error) {
    console.error("Faculty setup error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/ensure-course-masters", async (req, res) => {
  try {
    const { courses_entries } = req.body;
    for (const course of courses_entries) {
      if (!course.course_code) continue;
      const existing = await CourseMaster.findOne({ course_code: course.course_code });
      if (!existing) await CourseMaster.create({ course_code: course.course_code, course_name: course.course_name, credits: course.credits ?? 0 });
    }

    const nothingCreated = created.length === 0;

    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated
        ? "All course masters already exist. No operation performed."
        : "Course masters processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped
    });

  } catch (error) {
    console.error("Error ensuring course masters:", error);
    return res.status(500).json({
      message: "Server error while ensuring course masters"
    });
  }
});

app.post("/api/admin/ensure-subject-offerings", async (req, res) => {
  try {
    const { batch_info, courses_entries } = req.body;
    const yrSem = await YrSem.findOne({ yr: batch_info.yr, sem: batch_info.sem, academic_yr: batch_info.academic_yr, stream: batch_info.stream });
    if (!yrSem) return res.status(404).json({ message: "yr_sem not found" });

    for (const course of courses_entries) {
      const cm = await CourseMaster.findOne({ course_code: course.course_code });
      if (cm && !(await SubjectOffering.findOne({ course_master_id: cm._id, yr_sem_id: yrSem._id }))) {
        await SubjectOffering.create({ course_master_id: cm._id, yr_sem_id: yrSem._id, is_active: true });
      }
    }

    const nothingCreated = created.length === 0;

    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated
        ? "Subject offerings already exist. No operation performed."
        : "Subject offerings processed successfully",
      yr_sem_id,
      created_count: created.length,
      skipped_count: skipped.length,
      missing_courses_count: missing_courses.length,
      created,
      skipped,
      missing_courses
    });

  } catch (error) {
    console.error("Error ensuring subject offerings:", error);
    res.status(500).json({
      message: "Server error while ensuring subject offerings"
    });
  }
});

app.post("/api/admin/ensure-faculty-assignments", async (req, res) => {
  try {
    const { batch_info, courses_entries } = req.body;
    const yrSem = await YrSem.findOne({ yr: batch_info.yr, sem: batch_info.sem, academic_yr: batch_info.academic_yr, stream: batch_info.stream });
    if (!yrSem) return res.status(404).json({ message: "yr_sem not found" });

    for (const entry of courses_entries) {
      const faculty = await Faculty.findOne({ name: entry.faculty_name });
      const cm = await CourseMaster.findOne({ course_code: entry.course_code });
      if (faculty && cm) {
        const so = await SubjectOffering.findOne({ course_master_id: cm._id, yr_sem_id: yrSem._id });
        if (so && !(await FacultyAssignment.findOne({ faculty_id: faculty._id, subject_offering_id: so._id }))) {
          await FacultyAssignment.create({ faculty_id: faculty._id, subject_offering_id: so._id, start_date: new Date() });
        }
      }
    }

    const nothingCreated = created.length === 0;

    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated
        ? "Faculty assignments already exist. No operation performed."
        : "Faculty assignments processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      missing_count: missing.length,
      created,
      skipped,
      missing
    });


  } catch (error) {
    console.error("Error ensuring faculty assignments:", error);
    res.status(500).json({
      message: "Server error while ensuring faculty assignments"
    });
  }
});

app.post("/api/admin/ensure-timetable", async (req, res) => {
  try {
    const { batch_info, timetable_entries } = req.body;
    const yrSem = await YrSem.findOne({ yr: batch_info.yr, sem: batch_info.sem, academic_yr: batch_info.academic_yr, stream: batch_info.stream });
    if (!yrSem) return res.status(404).json({ message: "yr_sem not found" });

    const dayMap = { Monday: "Mon", Tuesday: "Tue", Wednesday: "Wed", Thursday: "Thu", Friday: "Fri", Saturday: "Sat", Sunday: "Sun" };

    for (const tt of timetable_entries) {
      const mappedDay = dayMap[tt.day_of_week];
      const cm = await CourseMaster.findOne({ course_code: tt.course_code });
      if (cm && mappedDay) {
        const so = await SubjectOffering.findOne({ course_master_id: cm._id, yr_sem_id: yrSem._id });
        const fa = await FacultyAssignment.findOne({ subject_offering_id: so?._id });
        if (fa && !(await TimeTable.findOne({ yr_sem_id: yrSem._id, day_of_week: mappedDay, session_no: tt.session_number }))) {
          await TimeTable.create({ yr_sem_id: yrSem._id, day_of_week: mappedDay, session_no: tt.session_number, start_time: tt.start_time, end_time: tt.end_time, subject_offering_id: so._id, faculty_id: fa.faculty_id, location: tt.location });
        }
      }
    }

    const nothingCreated = created.length === 0;

    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated
        ? "Timetable already exists. No operation performed."
        : "Timetable processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      missing_count: missing.length,
      created,
      skipped,
      missing
    });

  } catch (error) {
    console.error("Error ensuring timetable:", error);
    res.status(500).json({
      message: "Server error while ensuring timetable"
    });
  }
});


app.post("/api/admin/ensure-yrsem", async (req, res) => {
  try {
    const { batch_info } = req.body;

    if (!batch_info) {
      return res.status(400).json({
        message: "batch_info missing"
      });
    }

    const { yr, sem, stream, academic_yr } = batch_info;

    if (!yr || !sem || !stream || !academic_yr) {
      return res.status(400).json({
        message: "yr, sem, stream, academic_yr required"
      });
    }

    // Check existing
    const existing = await YrSem.findOne({
      yr,
      sem,
      stream,
      academic_yr
    });

    if (existing) {
      return res.status(409).json({
        message: "Year-Sem already exists",
        yr_sem_id: existing._id
      });
    }

    // Create
    const newYrSem = await YrSem.create({
      yr,
      sem,
      stream,
      academic_yr
    });

    return res.status(200).json({
      message: "Year-Sem created successfully",
      yr_sem_id: newYrSem._id
    });

  } catch (error) {
    console.error("ensure-yrsem error:", error);
    res.status(500).json({
      message: "Server error while ensuring yr_sem"
    });
  }
}); */

/* old one, changes as faculty required changes
app.get("/api/admin/batch-data", async (req, res) => {
  try {
    const { yr, sem, stream, academic_yr } = req.query;

    const yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream, academic_yr });
    if (!yrSem) {
      return res.status(404).json({ message: "Batch not found" });
    }

    // 1. Fetch Students
    const enrollments = await StudentEnrollment.find({ yr_sem_id: yrSem._id })
      .populate("student_id");
    const students = enrollments
      .filter(e => e.student_id)
      .map(e => ({
        _id: e.student_id._id,
        name: e.student_id.name,
        roll_no: e.student_id.roll_no,
        email: e.student_id.email,
        status: e.status
      }));

    // 2. Fetch Courses & Assigned Faculties
    const offerings = await SubjectOffering.find({ yr_sem_id: yrSem._id })
      .populate("course_master_id");
      
    const coursesData = [];
    const faculties = new Map();

    for (const offering of offerings) {
      const assignment = await FacultyAssignment.findOne({ subject_offering_id: offering._id })
        .populate("faculty_id");
        
      coursesData.push({
        subject_offering_id: offering._id,
        course_code: offering.course_master_id?.course_code,
        course_name: offering.course_master_id?.course_name,
        assigned_faculty: assignment?.faculty_id?.name || "Not Assigned",
        assigned_faculty_email: assignment?.faculty_id?.email || ""
      });

      if (assignment?.faculty_id) {
        faculties.set(assignment.faculty_id._id.toString(), {
          _id: assignment.faculty_id._id,
          name: assignment.faculty_id.name,
          email: assignment.faculty_id.email
        });
      }
    }

    res.json({
      yr_sem_id: yrSem._id,
      students,
      courses: coursesData,
      faculties: Array.from(faculties.values())
    });

  } catch (error) {
    console.error("Fetch batch data error:", error);
    res.status(500).json({ message: "Server error while fetching batch data" });
  }
});*/
// 11. get data to corresponding year sem for admin dashboard
// 11. get data for admin dashboard (SUPPORT MULTIPLE BATCHES & PAGINATION)
app.get("/api/admin/batch-data", async (req, res) => {
  try {
    const { yr, sem, stream, academic_yr, page = 1, limit = 50, status = "active" } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    let studentQuery = {};
    let offeringQuery = { is_active: true };
    let isFiltered = false;

    // If any filter is provided, find all matching metadata IDs
    if (yr || sem || stream || academic_yr) {
      const matchCriteria = {};
      if (yr) matchCriteria.yr = Number(yr);
      if (sem) matchCriteria.sem = Number(sem);
      if (stream) matchCriteria.stream = stream;
      if (academic_yr) matchCriteria.academic_yr = academic_yr;

      const matchingYrSems = await YrSem.find(matchCriteria).select("_id").lean();

      if (!matchingYrSems.length) {
        return res.json({
          students: [],
          totalStudents: 0,
          courses: [],
          faculties: [],
          timetable: [],
          hasMore: false,
          isFiltered: true
        });
      }

      const yrSemIds = matchingYrSems.map(y => y._id);
      studentQuery = { yr_sem_id: { $in: yrSemIds }, status };
      offeringQuery = { yr_sem_id: { $in: yrSemIds }, is_active: true };
      isFiltered = true;
    } else {
      // If no ID filters are provided, we show all students matching the requested status (Default: Active)
      studentQuery = { status };
      offeringQuery = { is_active: true };
      isFiltered = false;
    }

    // 1. Fetch Students (reverting to find/populate for immediate compatibility)
    const totalStudentsRaw = await StudentEnrollment.countDocuments(studentQuery);
    const enrollments = await StudentEnrollment.find(studentQuery)
      .populate({ path: "student_id", select: "name roll_no email" })
      .populate({ path: "yr_sem_id", select: "yr sem stream academic_yr" })
      .sort({ "student_id.name": 1 })
      .skip(skip)
      .limit(Number(limit))
      .lean();

    // Map and count valid students (Self-Correction for Orphan Records)
    const students = enrollments
      .filter(e => e.student_id)
      .map(e => ({
        _id: e.student_id._id,
        name: e.student_id.name,
        roll_no: e.student_id.roll_no,
        email: e.student_id.email,
        status: e.status,
        batch: e.yr_sem_id ? `${e.yr_sem_id.stream} Y${e.yr_sem_id.yr}-S${e.yr_sem_id.sem}` : "N/A",
        yr: e.yr_sem_id?.yr,
        sem: e.yr_sem_id?.sem,
        stream: e.yr_sem_id?.stream,
        academic_yr: e.yr_sem_id?.academic_yr
      }));

    // If any orphans were filtered out, the total count should match the visible list
    const totalStudents = students.length < enrollments.length
      ? totalStudentsRaw - (enrollments.length - students.length)
      : totalStudentsRaw;

    // 2. Fetch Courses
    const offerings = await SubjectOffering.find(offeringQuery)
      .populate("course_master_id")
      .populate({ path: "yr_sem_id", select: "yr sem stream academic_yr" })
      .lean();

    const coursesDataRaw = offerings.map(offering => ({
      subject_offering_id: offering._id,
      course_code: offering.course_master_id?.course_code,
      course_name: offering.course_master_id?.course_name,
      batch: offering.yr_sem_id ? `${offering.yr_sem_id.stream} Y${offering.yr_sem_id.yr}-S${offering.yr_sem_id.sem}` : "N/A",
      // Raw batch fields for the Assign Faculty modal
      yr: offering.yr_sem_id?.yr,
      sem: offering.yr_sem_id?.sem,
      stream: offering.yr_sem_id?.stream,
      academic_yr: offering.yr_sem_id?.academic_yr
    }));

    // 3. Fetch ALL Faculties & Assignments (Enriched)
    const allFaculty = await Faculty.find({}).lean();
    const assignments = await FacultyAssignment.find({
      subject_offering_id: { $in: offerings.map(o => o._id) },
      status: "active"
    })
      .populate("faculty_id")
      .populate({
        path: "subject_offering_id",
        populate: [
          { path: "course_master_id", select: "course_name" },
          { path: "yr_sem_id", select: "yr sem stream academic_yr" }
        ]
      })
      .lean();

    const facultiesMap = new Map();
    const offeringToFacultyMap = new Map();

    // Initialize with all Faculty members first
    allFaculty.forEach(f => {
      const fId = f._id.toString();
      facultiesMap.set(fId, {
        _id: f._id,
        name: f.name,
        email: f.email,
        courses: new Set(),
        batches: new Set()
      });
    });

    // Populate assignments for those who have them
    assignments.forEach(a => {
      if (a.faculty_id) {
        const fId = a.faculty_id._id.toString();
        const fData = facultiesMap.get(fId);

        if (fData) {
          const courseName = a.subject_offering_id?.course_master_id?.course_name;
          const yrSem = a.subject_offering_id?.yr_sem_id;
          const batchStr = yrSem ? `${yrSem.stream} Y${yrSem.yr}-S${yrSem.sem}` : "N/A";

          if (courseName) fData.courses.add(courseName);
          if (batchStr !== "N/A") fData.batches.add(batchStr);
        }

        // Map offering -> faculty for the Courses Tab
        if (!offeringToFacultyMap.has(a.subject_offering_id._id.toString())) {
          offeringToFacultyMap.set(a.subject_offering_id._id.toString(), {
            name: a.faculty_id.name,
            email: a.faculty_id.email
          });
        }
      }
    });

    const faculties = Array.from(facultiesMap.values()).map(f => ({
      ...f,
      courses: Array.from(f.courses).sort(),
      batches: Array.from(f.batches).sort()
    }));

    // Enrich coursesData with assigned faculty details
    const coursesData = coursesDataRaw.map(c => {
      const faculty = offeringToFacultyMap.get(c.subject_offering_id.toString());
      return {
        ...c,
        assigned_faculty: faculty ? faculty.name : "Not Assigned",
        assigned_faculty_email: faculty ? faculty.email : null
      };
    });

    // 4. Fetch Timetable
    const timetable = await TimeTable.find(offeringQuery)
      .populate({
        path: "subject_offering_id",
        populate: { path: "course_master_id", select: "course_name course_code" }
      })
      .populate("faculty_id", "name")
      .lean();

    const timetableData = timetable.map(t => ({
      day_of_week: t.day_of_week,
      session_no: t.session_no,
      start_time: t.start_time,
      end_time: t.end_time,
      course_name: t.subject_offering_id?.course_master_id?.course_name || "N/A",
      course_code: t.subject_offering_id?.course_master_id?.course_code || "N/A",
      faculty_name: t.faculty_id?.name || "N/A",
      batch: t.yr_sem_id ? `${t.yr_sem_id.stream} Y${t.yr_sem_id.yr}-S${t.yr_sem_id.sem}` : "N/A",
      location: t.location
    }));

    res.json({
      students,
      totalStudents,
      hasMore: skip + students.length < totalStudents,
      courses: coursesData,
      faculties,
      timetable: timetableData,
      isFiltered
    });

  } catch (error) {
    console.error("Fetch batch data error:", error);
    res.status(500).json({ message: "Server error while fetching batch data" });
  }
});

/* Retained this just incase if required to show timetable for faculty in their dashboard in future
// 11.1 Fetch Timetable by Faculty Email (Faculty Perspective)
app.get("/api/admin/faculty-schedule/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const faculty = await Faculty.findOne({ email }).lean();
    if (!faculty) return res.status(404).json({ message: "Faculty not found" });

    const timetable = await TimeTable.find({ faculty_id: faculty._id })
      .populate({
        path: "subject_offering_id",
        populate: { path: "course_master_id", select: "course_name course_code" }
      })
      .populate({
        path: "yr_sem_id",
        select: "yr sem stream academic_yr"
      })
      .lean();

    const formattedSessions = timetable.map(t => ({
      day_of_week: t.day_of_week,
      session_no: t.session_no,
      start_time: t.start_time,
      end_time: t.end_time,
      course_name: t.subject_offering_id?.course_master_id?.course_name || "N/A",
      course_code: t.subject_offering_id?.course_master_id?.course_code || "N/A",
      batch: t.yr_sem_id ? `${t.yr_sem_id.stream} Y${t.yr_sem_id.yr}-S${t.yr_sem_id.sem}` : "N/A",
      location: t.location
    }));

    res.json({
      facultyName: faculty.name,
      timetable: formattedSessions
    });
  } catch (error) {
    res.status(500).json({ message: "Server error fetching faculty schedule" });
  }
});
*/

/* old code
// 12. Admin: Fetch Courses for a Batch
app.get("/api/admin/courses-by-batch", async (req, res) => {
  try {
    const { yr, sem, stream, academic_yr } = req.query;

    const yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream, academic_yr });
    if (!yrSem) {
      return res.status(404).json({ message: "Batch not found" });
    }

    const offerings = await SubjectOffering.find({ yr_sem_id: yrSem._id })
      .populate("course_master_id");

    const courses = offerings.map(offering => ({
      course_code: offering.course_master_id.course_code,
      course_name: offering.course_master_id.course_name
    }));

    res.json({ yr_sem_id: yrSem._id, courses });
    console.log(res)
  } catch (error) {
    console.error("Fetch courses error:", error);
    res.status(500).json({ message: "Server error while fetching courses" });
  }
});*/

// version 2 for change faculty (Direct ID lookup)
app.put("/api/admin/change-faculty", async (req, res) => {
  const { subject_offering_id, faculty_email } = req.body;

  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    // 1. Find the specific Subject Offering
    const subjectOffering = await SubjectOffering.findById(subject_offering_id).session(session);

    if (!subjectOffering) {
      throw new Error(`Course offering not found. Please refresh the page.`);
    }

    // 2. Find the Faculty
    const faculty = await Faculty.findOne({ email: faculty_email }).session(session);
    if (!faculty) throw new Error(`Faculty not found with email: ${faculty_email}`);

    // 3. Inactivate any existing active assignments for this offering
    await FacultyAssignment.updateMany(
      { subject_offering_id: subjectOffering._id, status: "active" },
      { status: "inactive", end_date: new Date() },
      { session }
    );

    // 4. Create New History-Preserving Assignment
    await FacultyAssignment.create([{
      faculty_id: faculty._id,
      subject_offering_id: subjectOffering._id,
      status: "active",
      start_date: new Date()
    }], { session });

    // 5. Update linked TimeTable sessions to the new faculty
    await TimeTable.updateMany(
      { subject_offering_id: subjectOffering._id },
      { faculty_id: faculty._id },
      { session }
    );

    await session.commitTransaction();

    res.json({
      message: "Faculty assignment updated successfully"
    });

  } catch (error) {

    await session.abortTransaction();

    console.error(error);

    res.status(500).json({
      message: error.message
    });

  } finally {

    session.endSession();

  }
});

// 12. Add New Student (WITH BATCH VALIDATION)
app.post("/api/admin/add-student", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, roll_no, email, password, status, yr, sem, stream, academic_yr } = req.body;

    if (!name || !roll_no || !email || !password || !yr || !sem || !stream || !academic_yr) {
      throw new Error("Missing required fields. Please fill all student and batch information.");
    }

    // 1. Verify if Batch Metadata exists
    const yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream, academic_yr }).session(session);
    if (!yrSem) {
      throw new Error("Target Batch not found. Please ensure Year/Sem/Stream/Cycle are created in Batch Setup first.");
    }

    const existingUser = await User.findOne({ user_name: roll_no }).session(session);
    if (existingUser) throw new Error("Student with this roll number already exists.");

    const hashedPassword = await bcrypt.hash(password, 10);

    const [newUser] = await User.create([{
      user_name: roll_no,
      password: hashedPassword,
      role: "student"
    }], { session });

    const [newStudent] = await Student.create([{
      user_id: newUser._id,
      name,
      roll_no,
      email,
      yr_sem_id: yrSem._id
    }], { session });

    await StudentEnrollment.create([{
      student_id: newStudent._id,
      yr_sem_id: yrSem._id,
      academic_yr,
      status: status || "active",
      start_date: new Date()
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ message: "Student added successfully" });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// 12.1 Add New Faculty
app.post("/api/admin/add-faculty", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, user_name, password } = req.body;

    if (!name || !email || !user_name || !password) {
      throw new Error("Missing required fields");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ user_name }).session(session);
    if (existingUser) {
      throw new Error("User with this username already exists");
    }

    // Check if faculty already exists with this email
    const existingFaculty = await Faculty.findOne({ email }).session(session);
    if (existingFaculty) {
      throw new Error("Faculty with this email already exists");
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create User
    const [newUser] = await User.create([{
      user_name,
      password: hashedPassword,
      role: "faculty"
    }], { session });

    // Create Faculty
    const [newFaculty] = await Faculty.create([{
      user_id: newUser._id,
      name,
      email
    }], { session });

    await session.commitTransaction();

    res.status(201).json({ message: "Faculty added successfully", faculty: newFaculty });
  } catch (error) {
    await session.abortTransaction();
    console.error("Add faculty error:", error);
    const isDuplicate = error.code === 11000;
    const errorMsg = isDuplicate ? "Faculty with this username or email already exists." : error.message;
    res.status(400).json({ message: errorMsg || "Server error while adding faculty" });
  } finally {
    session.endSession();
  }
});

// 13. Add New Course (Directly to a Batch)
app.post("/api/admin/add-course", async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { course_code, course_name, credits, yr, sem, stream, academic_yr } = req.body;

    if (!course_code || !course_name || !credits || !yr || !sem || !stream || !academic_yr) {
      throw new Error("Missing required fields (Course or Batch info)");
    }

    // 1. Find the Batch (YrSem)
    const yrSem = await YrSem.findOne({
      yr: Number(yr),
      sem: Number(sem),
      stream,
      academic_yr
    }).session(session);

    if (!yrSem) {
      throw new Error(`Batch not found for: Yr ${yr}, Sem ${sem}, ${stream} (${academic_yr})`);
    }

    // 2. Check if CourseMaster exists, if not create it
    let course = await CourseMaster.findOne({ course_code }).session(session);
    if (!course) {
      const [newCourse] = await CourseMaster.create([{
        course_code,
        course_name,
        credits: Number(credits) || 0
      }], { session });
      course = newCourse;
    }

    // 3. Create SubjectOffering for this batch
    const existingOffering = await SubjectOffering.findOne({
      course_master_id: course._id,
      yr_sem_id: yrSem._id
    }).session(session);

    if (existingOffering) {
      throw new Error(`This course is already registered for the selected batch.`);
    }

    const [newOffering] = await SubjectOffering.create([{
      course_master_id: course._id,
      yr_sem_id: yrSem._id,
      is_active: true
    }], { session });

    await session.commitTransaction();
    res.status(201).json({
      message: "Course registered and offering created successfully",
      offering: newOffering
    });

  } catch (error) {
    await session.abortTransaction();
    console.error("Add course error:", error);
    res.status(400).json({ message: error.message || "Server error while adding course" });
  } finally {
    session.endSession();
  }
});

// 14. Edit Student (HISTORY-PRESERVING VERSION)
app.put("/api/admin/edit-student/:studentId", async (req, res) => {
  const { studentId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, roll_no, email, password, status, yr, sem, stream, academic_yr } = req.body;

    if (!name || !roll_no || !email || !status || !yr || !sem || !stream || !academic_yr) {
      throw new Error("Missing required fields for student or batch details.");
    }

    // 1. Verify Target Batch existence
    const yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream, academic_yr }).session(session);
    if (!yrSem) {
      throw new Error("New combination for Year/Sem/Stream/Cycle not found in Batch Setup.");
    }

    const student = await Student.findById(studentId).populate("yr_sem_id").session(session);
    if (!student) throw new Error("Student not found");

    // Conflict Check: Roll No
    if (student.roll_no !== roll_no) {
      const conflict = await User.findOne({ user_name: roll_no }).session(session);
      if (conflict) throw new Error("Roll Number is already taken by another user.");
    }

    // Conflict Check: Email
    if (student.email !== email) {
      const conflict = await Student.findOne({ email }).session(session);
      if (conflict && conflict._id.toString() !== studentId) throw new Error("Email is already taken.");
    }

    // Update User
    const userUpdate = { user_name: roll_no };
    if (password) userUpdate.password = await bcrypt.hash(password, 10);
    await User.findByIdAndUpdate(student.user_id, userUpdate, { session });

    // Update Student
    await Student.findByIdAndUpdate(studentId, { name, roll_no, email, yr_sem_id: yrSem._id }, { session });

    // ENROLLMENT HISTORY LOGIC
    // Check if the yr_sem_id changed
    const oldBatchId = student.yr_sem_id?._id || student.yr_sem_id;
    if (!oldBatchId || oldBatchId.toString() !== yrSem._id.toString()) {
      // 1. Inactivate existing active enrollments
      await StudentEnrollment.updateMany(
        { student_id: studentId, status: "active" },
        { status: "inactive", end_date: new Date() },
        { session }
      );
      // 2. Create New Enrollment
      await StudentEnrollment.create([{
        student_id: studentId,
        yr_sem_id: yrSem._id,
        academic_yr,
        status: status || "active",
        start_date: new Date()
      }], { session });
    } else {
      // Just update existing active enrollment status/cycle if it's the same batch
      await StudentEnrollment.findOneAndUpdate(
        { student_id: studentId, yr_sem_id: student.yr_sem_id, status: "active" },
        { status, academic_yr },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Student record updated with history preserved." });

  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// 14.1 Edit Faculty
app.put("/api/admin/edit-faculty/:facultyId", async (req, res) => {
  const { facultyId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { name, email, user_name, password } = req.body;

    if (!name || !email || !user_name) {
      throw new Error("Missing required fields");
    }

    // Find the faculty
    const faculty = await Faculty.findById(facultyId).session(session);
    if (!faculty) {
      throw new Error("Faculty not found");
    }

    // Check if new username conflicts with another user
    const user = await User.findById(faculty.user_id).session(session);
    if (user.user_name !== user_name) {
      const existingUser = await User.findOne({ user_name }).session(session);
      if (existingUser) {
        throw new Error("User with this username already exists");
      }
    }

    // Check if new email conflicts with another faculty
    if (faculty.email !== email) {
      const existingFaculty = await Faculty.findOne({ email: email }).session(session);
      if (existingFaculty && existingFaculty._id.toString() !== facultyId) {
        throw new Error("Faculty with this email already exists");
      }
    }

    // Update User
    const userUpdate = { user_name };
    if (password) {
      userUpdate.password = await bcrypt.hash(password, 10);
    }
    await User.findByIdAndUpdate(faculty.user_id, userUpdate, { session, runValidators: true });

    // Update Faculty
    await Faculty.findByIdAndUpdate(facultyId, {
      name,
      email
    }, { session, runValidators: true });

    await session.commitTransaction();
    res.status(200).json({ message: "Faculty updated successfully" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Edit faculty error:", error);
    const isDuplicate = error.code === 11000;
    const errorMsg = isDuplicate ? "Faculty with this username or email already exists." : error.message;
    res.status(400).json({ message: errorMsg || "Server error while editing faculty" });
  } finally {
    session.endSession();
  }
});

// 14.2 Edit Course
app.put("/api/admin/edit-course/:offeringId", async (req, res) => {
  const { offeringId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { course_code, course_name, credits, assigned_faculty_email } = req.body;

    if (!course_code || !course_name || !credits) {
      throw new Error("Missing required fields");
    }

    // Find the offering to get the CourseMaster ID
    const offering = await SubjectOffering.findById(offeringId).session(session);
    if (!offering) {
      throw new Error("Course offering not found");
    }

    // Update the linked CourseMaster
    await CourseMaster.findByIdAndUpdate(offering.course_master_id, {
      course_code,
      course_name,
      credits: Number(credits) || 0
    }, { session, runValidators: true });

    // Handle Faculty Assignment if email is provided
    if (assigned_faculty_email) {
      const faculty = await Faculty.findOne({ email: assigned_faculty_email }).session(session);
      if (!faculty) throw new Error("Faculty not found with this email");

      // 3. Inactivate any existing active assignments for this offering
      await FacultyAssignment.updateMany(
        { subject_offering_id: offeringId, status: "active" },
        { status: "inactive", end_date: new Date() },
        { session }
      );

      // 4. Create New History-Preserving Assignment
      await FacultyAssignment.create([{
        faculty_id: faculty._id,
        subject_offering_id: offeringId,
        status: "active",
        start_date: new Date()
      }], { session });

      // 5. Update linked TimeTable sessions to the new faculty
      await TimeTable.updateMany(
        { subject_offering_id: offeringId },
        { faculty_id: faculty._id },
        { session }
      );
    }

    await session.commitTransaction();
    res.status(200).json({ message: "Course updated successfully" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Edit course error:", error);
    res.status(400).json({ message: error.message || "Server error while editing course" });
  } finally {
    session.endSession();
  }
});

// 14.3 Remove Faculty Assignment
app.delete("/api/admin/remove-faculty/:offeringId", async (req, res) => {
  const { offeringId } = req.params;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // 1. Remove from FacultyAssignment
    await FacultyAssignment.deleteMany({ subject_offering_id: offeringId }).session(session);

    // 2. Update TimeTable to set faculty_id to null
    await TimeTable.updateMany(
      { subject_offering_id: offeringId },
      { $set: { faculty_id: null } },
      { session }
    );

    await session.commitTransaction();
    res.status(200).json({ message: "Faculty removed from course" });

  } catch (error) {
    await session.abortTransaction();
    console.error("Remove faculty error:", error);
    res.status(400).json({ message: error.message || "Server error while removing faculty" });
  } finally {
    session.endSession();
  }
});

// 15. Detailed Course View for Student
app.get("/api/student/course-details/:studentId/:subjectOfferingId", async (req, res) => {
  const { studentId, subjectOfferingId } = req.params;
  try {
    const subject = await SubjectOffering.findById(subjectOfferingId).populate("course_master_id");
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    const sessions = await ClassSession.find({ subject_offering_id: subjectOfferingId });
    const records = await Attendance.find({
      student_id: studentId,
      class_session_id: { $in: sessions.map(s => s._id) },
    });

    const present = records.filter(r => r.status === "Present").length;
    const attendanceStats = {
      present_count: present,
      total_count: records.length,
      percentage: records.length > 0 ? ((present / records.length) * 100).toFixed(2) : "0.00"
    };

    const notes = await ClassNotes.find({
      subject_offering_id: subjectOfferingId,
      is_visible: true
    }).sort({ upload_date: -1 });

    const assignments = await Assignment.find({
      subject_offering_id: subjectOfferingId,
      is_active: true
    }).sort({ due_date: 1 });

    res.json({
      course_name: subject.course_master_id.course_name,
      course_code: subject.course_master_id.course_code,
      attendanceStats,
      notes,
      assignments
    });
  } catch (error) {
    console.error("Error in course-details route:", error);
    res.status(500).json({ message: "Server error" });
  }
});


// 16. Promote Students (INDEPENDENT DYNAMIC PROGRESSION)
app.post("/api/admin/promote-students", async (req, res) => {
  const { studentIds } = req.body;
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    if (!studentIds || !Array.isArray(studentIds)) {
      throw new Error("No students selected for promotion.");
    }

    // Ensure we only process each student once even if duplicates are passed
    const uniqueIds = [...new Set(studentIds)];
    const report = { promoted: 0, failed: [] };

    for (const studentId of uniqueIds) {
      const student = await Student.findById(studentId).populate("yr_sem_id").session(session);
      if (!student || !student.yr_sem_id) continue;

      const current = student.yr_sem_id;
      let nextYr = current.yr;
      let nextSem = 1;
      let isGraduating = false;

      // Rule: S1 -> S2 (same year), S2 -> S1 (next year)
      if (current.sem === 1) {
        nextSem = 2;
      } else {
        nextYr = current.yr + 1;
        nextSem = 1;
        if (nextYr > 4) isGraduating = true;
      }

      if (isGraduating) {
        await StudentEnrollment.updateMany(
          { student_id: studentId, status: "active" },
          { status: "inactive", end_date: new Date() },
          { session }
        );
        await StudentEnrollment.create([{
          student_id: studentId,
          yr_sem_id: current._id,
          academic_yr: current.academic_yr,
          status: "graduated",
          start_date: new Date()
        }], { session });
        report.promoted++;
      } else {
        // Find next Batch
        const nextBatch = await YrSem.findOne({
          yr: nextYr,
          sem: nextSem,
          stream: current.stream,
          academic_yr: current.academic_yr
        }).session(session);

        if (!nextBatch) {
          report.failed.push(`${student.name} (Batch ${nextYr}-${nextSem} for ${current.stream} not found)`);
          continue;
        }

        // Deactivate Old
        await StudentEnrollment.updateMany(
          { student_id: studentId, status: "active" },
          { status: "inactive", end_date: new Date() },
          { session }
        );
        // Create New
        await StudentEnrollment.create([{
          student_id: studentId,
          yr_sem_id: nextBatch._id,
          academic_yr: current.academic_yr,
          status: "active",
          start_date: new Date()
        }], { session });

        // Update Student Link
        student.yr_sem_id = nextBatch._id;
        await student.save({ session });
        report.promoted++;
      }
    }

    await session.commitTransaction();
    res.json({
      message: `Promotion complete: ${report.promoted} promoted.`,
      failures: report.failed
    });

  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ message: error.message });
  } finally {
    session.endSession();
  }
});

// 17. Academic AI — Proxy to Python Flask backend
const FLASK_URL = process.env.FLASK_URL || "http://localhost:5001";

app.post("/api/academic-ai/query", async (req, res) => {
  try {
    const response = await fetch(`${FLASK_URL}/api/query`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return res.status(response.status).json({ error: errorText });
    }

    // Set headers for Server-Sent Events (SSE)
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Stream the incoming chunks from Flask directly to the client
    if (response.body) {
      for await (const chunk of response.body) {
        res.write(chunk);
      }
    }
    res.end();

  } catch (error) {
    console.error("Academic AI proxy error:", error.message);
    res.status(502).json({
      message: "Academic AI service is unavailable. Make sure the Flask server is running.",
    });
  }
});

// 18. Get All Faculties
app.get("/api/admin/faculties", async (req, res) => {
  try {
    const faculties = await Faculty.find().sort({ name: 1 });

    // For each faculty, we might want to know their username (from User model)
    const result = await Promise.all(faculties.map(async (f) => {
      const user = await User.findById(f.user_id);
      return {
        _id: f._id,
        name: f.name,
        email: f.email,
        user_name: user ? user.user_name : "",
        courses: [] // We could populate this from FacultyAssignment if needed, but start simple
      };
    }));

    res.json(result);
  } catch (error) {
    console.error("Get faculties error:", error);
    res.status(500).json({ message: "Server error while fetching faculties" });
  }
});

// --- Server Startup ---
let server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.setTimeout(1800000); // 30 minutes timeout for long AI generation requests

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Please run "fuser -k ${PORT}/tcp"`);
    process.exit(1);
  } else {
    console.error("Server Error:", e);
  }
});
