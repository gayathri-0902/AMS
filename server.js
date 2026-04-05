const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
    origin: (origin, callback) => {
      if (process.env.NODE_ENV === "production") {
        const allow = process.env.FRONTEND_ORIGIN;
        if (allow) return callback(null, !origin || origin === allow);
      }
      if (!origin || /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
        return callback(null, true);
      }
      callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve uploaded files statically
app.use(express.static(path.join(__dirname, 'uploads')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('application/') || file.mimetype.includes('word') || file.mimetype.includes('pdf') || file.mimetype.includes('text')) {
      cb(null, true);
    } else {
      cb(new Error('Only PDF, DOCX, TXT allowed'), false);
    }
  }
});

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
        const enrollment = await resolveEnrollmentForStudent(student._id);
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

    const enrollment = await resolveEnrollmentForStudent(studentId);

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

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

    // ===== CHANGE 2: Added currentDay to response =====
    res.json({
      studentDetails: {
        student_id_no: student.roll_no,
        branch_name: yrSem.stream,
        student_name: student.name,
        current_year: yrSem.yr,
        current_sem: yrSem.sem
      },
      timetableData,
      currentDay
    });
    // ===== END CHANGE 2 =====
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Parent Dashboard Route (STABILIZED)
app.get("/api/parent/dashboard/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;

    const parentProfile = await Parent.findOne({
      $or: [{ _id: parentId }, { user_id: parentId }]
    });

    if (!parentProfile) {
      return res.status(404).json({ message: "Parent profile not found." });
    }

    const mappings = await ParentStudentMap.find({ parent_id: parentProfile._id }).populate("student_id");

    if (!mappings || mappings.length === 0) {
      return res.json([]);
    }

    const childrenData = await Promise.all(mappings.map(async (mapping) => {
      const student = mapping.student_id;
      if (!student) return null;

      const enrollment = await StudentEnrollment.findOne({
        student_id: student._id,
        status: "active"
      }).populate("yr_sem_id");

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

    res.json(childrenData.filter(child => child !== null));

  } catch (error) {
    console.error("Dashboard Logic Error:", error);
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
});

// 10. Admin: Create Schedule
app.post("/api/admin/schedule", async (req, res) => {
  const { course_code, faculty_email, stream, yr, sem, day, start_time, end_time, location, session_no } = req.body;
  try {
    const faculty = await Faculty.findOne({ email: faculty_email });
    const yrSem = await YrSem.findOne({ yr: Number(yr), sem: Number(sem), stream });
    if (!faculty || !yrSem) return res.status(404).json({ message: "Faculty or Section not found" });

    let course = await CourseMaster.findOne({ course_code });
    if (!course) {
      course = new CourseMaster({ course_code, course_name: course_code, credits: 3 });
      await course.save();
    }

    let subjectOffering = await SubjectOffering.findOne({ course_master_id: course._id, yr_sem_id: yrSem._id });
    if (!subjectOffering) {
      subjectOffering = new SubjectOffering({ course_master_id: course._id, yr_sem_id: yrSem._id, is_active: true });
      await subjectOffering.save();
    }

    const assignment = await FacultyAssignment.findOne({ faculty_id: faculty._id, subject_offering_id: subjectOffering._id });
    if (!assignment) {
      await new FacultyAssignment({ faculty_id: faculty._id, subject_offering_id: subjectOffering._id }).save();
    }

    const timetable = new TimeTable({
      yr_sem_id: yrSem._id,
      day_of_week: day,
      session_no: Number(session_no),
      start_time,
      end_time,
      subject_offering_id: subjectOffering._id,
      faculty_id: faculty._id,
      location
    });
    await timetable.save();
    res.status(201).json({ message: "Schedule created successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

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
});

// 11.5. Faculty: Get All Assigned Subjects (for notes/assignments on any day)
app.get("/api/faculty/subjects/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;

    const assignments = await FacultyAssignment.find({ faculty_id: facultyId })
      .populate({
        path: "subject_offering_id",
        populate: [
          { path: "course_master_id" },
          { path: "yr_sem_id" }
        ]
      });

    const subjects = assignments
      .filter(a => a.subject_offering_id && a.subject_offering_id.course_master_id)
      .map(a => {
        const so = a.subject_offering_id;
        const course = so.course_master_id;
        const yrSem = so.yr_sem_id;
        return {
          subject_offering_id: so._id,
          course_name: course.course_name,
          course_code: course.course_code,
          credits: course.credits,
          stream: yrSem?.stream || "N/A",
          yr: yrSem?.yr || "",
          sem: yrSem?.sem || "",
          section_label: yrSem ? `${yrSem.stream} ${yrSem.yr}-${yrSem.sem}` : "N/A"
        };
      });

    res.json(subjects);
  } catch (error) {
    console.error("Error fetching faculty subjects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/** Subjects from time_table rows whose linked yr_sem matches stream/yr/sem (covers duplicate or mismatched enrollment yr_sem ObjectIds). */
async function subjectsFromTimetableByStreamYrSem(stream, yr, sem) {
  const rows = await TimeTable.aggregate([
    { $lookup: { from: "yr_sems", localField: "yr_sem_id", foreignField: "_id", as: "ysArr" } },
    { $unwind: "$ysArr" },
    { $match: { "ysArr.stream": stream, "ysArr.yr": yr, "ysArr.sem": sem } },
    { $lookup: { from: "subject_offerings", localField: "subject_offering_id", foreignField: "_id", as: "soArr" } },
    { $unwind: "$soArr" },
    { $lookup: { from: "course_masters", localField: "soArr.course_master_id", foreignField: "_id", as: "cmArr" } },
    { $unwind: { path: "$cmArr", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "faculties", localField: "faculty_id", foreignField: "_id", as: "faArr" } },
    { $unwind: { path: "$faArr", preserveNullAndEmptyArrays: true } },
  ]);
  const seen = new Set();
  const list = [];
  for (const e of rows) {
    const so = e.soArr;
    const cm = e.cmArr;
    const ys = e.ysArr;
    if (!so || !cm) continue;
    const key = String(so._id);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      subject_offering_id: so._id,
      class_name: cm.course_name || "Unknown Subject",
      class_code: cm.course_code || "N/A",
      faculty_name: e.faArr?.name || "Unknown",
      stream: ys?.stream || "N/A",
      yr: ys?.yr ?? "",
      sem: ys?.sem ?? "",
      section_label: ys ? `${ys.stream} ${ys.yr}-${ys.sem}` : "N/A",
    });
  }
  return list;
}

/** Subjects from class sessions the student has attendance on (bypasses yr_sem / timetable mismatches). */
async function subjectsFromStudentAttendance(studentId) {
  const records = await Attendance.find({ student_id: studentId })
    .populate({
      path: "class_session_id",
      populate: [
        { path: "subject_offering_id", populate: { path: "course_master_id" } },
        { path: "faculty_id", select: "name" },
      ],
    })
    .limit(8000)
    .lean();

  const seen = new Set();
  const list = [];
  for (const r of records) {
    const sess = r.class_session_id;
    if (!sess || !sess.subject_offering_id) continue;
    const so = sess.subject_offering_id;
    const cm = so.course_master_id;
    if (!cm) continue;
    const key = String(so._id);
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      subject_offering_id: so._id,
      class_name: cm.course_name || "Unknown Subject",
      class_code: cm.course_code || "N/A",
      faculty_name: sess.faculty_id?.name || "Unknown",
      stream: "N/A",
      yr: "",
      sem: "",
      section_label: "N/A",
    });
  }
  return list;
}

/**
 * Every distinct subject_offering on the timetable for these yr_sem ids.
 * Avoids relying on deep populate (only one slot often hydrated → one tile bug).
 */
async function subjectsFromTimetableYrSemIds(yrSemMongoIds) {
  if (!yrSemMongoIds?.length) return [];
  const idList = yrSemMongoIds.filter(Boolean);
  const offeringIds = await TimeTable.distinct("subject_offering_id", {
    yr_sem_id: { $in: idList },
  });
  if (!offeringIds.length) return [];

  const [offerings, ttRows, assignments] = await Promise.all([
    SubjectOffering.find({ _id: { $in: offeringIds } }).populate("course_master_id"),
    TimeTable.find({
      yr_sem_id: { $in: idList },
      subject_offering_id: { $in: offeringIds },
    })
      .populate("faculty_id")
      .lean(),
    FacultyAssignment.find({ subject_offering_id: { $in: offeringIds } })
      .populate("faculty_id")
      .lean(),
  ]);

  const facultyFromTt = new Map();
  for (const row of ttRows) {
    const k = String(row.subject_offering_id);
    if (!facultyFromTt.has(k) && row.faculty_id?.name) {
      facultyFromTt.set(k, row.faculty_id.name);
    }
  }
  const facultyFromAsg = new Map();
  for (const a of assignments) {
    const k = String(a.subject_offering_id);
    if (!facultyFromAsg.has(k) && a.faculty_id?.name) {
      facultyFromAsg.set(k, a.faculty_id.name);
    }
  }

  const list = [];
  for (const so of offerings) {
    const cm = so.course_master_id;
    if (!cm) continue;
    const k = String(so._id);
    list.push({
      subject_offering_id: so._id,
      class_name: cm.course_name || "Unknown Subject",
      class_code: cm.course_code || "N/A",
      faculty_name: facultyFromTt.get(k) || facultyFromAsg.get(k) || "Unknown",
    });
  }
  return list;
}

/**
 * Pick enrollment whose section matches the real timetable: prefer active if its yr_sem
 * has time_table rows; otherwise any enrollment (e.g. inactive) whose yr_sem appears on the timetable.
 */
async function resolveEnrollmentForStudent(studentId) {
  const list = await StudentEnrollment.find({ student_id: studentId })
    .populate("yr_sem_id")
    .sort({ end_date: -1 });

  if (!list.length) return null;

  const ttYrSemIds = new Set(
    (await TimeTable.distinct("yr_sem_id")).map((id) => String(id))
  );

  const yrSemInTimetable = (e) => {
    const y = e.yr_sem_id;
    if (!y || !y._id) return false;
    return ttYrSemIds.has(String(y._id));
  };

  const active = list.find((e) => e.status === "active");
  if (active && yrSemInTimetable(active)) return active;

  const withTt = list.find(yrSemInTimetable);
  if (withTt) return withTt;

  return active || list[0];
}

// 11.6. Student: Get All Assigned Subjects (for weekend UI)
app.get("/api/student/subjects/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const enrollment = await resolveEnrollmentForStudent(studentId);

    if (!enrollment) return res.status(404).json({ error: "Enrollment not found" });

    const yrSemData = enrollment.yr_sem_id; // { _id, stream, yr, sem }

    // ── Helper: build response from SubjectOffering array ────────────
    const buildResult = async (offeringList) => {
      return Promise.all(
        offeringList.map(async (subject) => {
          const assignment = await FacultyAssignment.findOne({
            subject_offering_id: subject._id,
          }).populate("faculty_id");
          const course = subject.course_master_id || {};
          const yrSem  = subject.yr_sem_id || yrSemData;
          return {
            subject_offering_id: subject._id,
            class_name: course.course_name || "Unknown Subject",
            class_code: course.course_code || "N/A",
            faculty_name: assignment?.faculty_id?.name || "Unknown",
            stream: yrSem?.stream || "N/A",
            yr: yrSem?.yr || "",
            sem: yrSem?.sem || "",
            section_label: yrSem ? `${yrSem.stream} ${yrSem.yr}-${yrSem.sem}` : "N/A",
          };
        })
      );
    };

    // ── STRATEGY 1: Direct yr_sem_id match (normal path) ────────────
    let subjects = await SubjectOffering.find({ yr_sem_id: yrSemData._id })
      .populate("course_master_id")
      .populate("yr_sem_id");

    if (subjects.length > 0) {
      return res.json(await buildResult(subjects));
    }

    // ── STRATEGY 2: Match by same stream + yr + sem across all yr_sems ──
    // (handles duplicate yr_sem IDs — student enrolled under a different
    //  yr_sem document than where subject_offerings were created)
    const matchingYrSems = await YrSem.find({
      stream: yrSemData.stream,
      yr:     yrSemData.yr,
      sem:    yrSemData.sem,
    });
    const matchingIds = matchingYrSems.map((y) => y._id);

    subjects = await SubjectOffering.find({ yr_sem_id: { $in: matchingIds } })
      .populate("course_master_id")
      .populate("yr_sem_id");

    if (subjects.length > 0) {
      console.log(`[subjects] Strategy 2 hit for student ${studentId}: found ${subjects.length} subjects via stream/yr/sem match`);
      return res.json(await buildResult(subjects));
    }

    // ── STRATEGY 3: time_table → yr_sems match by stream/yr/sem (not enrollment ObjectId) ──
    const ttResult = await subjectsFromTimetableByStreamYrSem(yrSemData.stream, yrSemData.yr, yrSemData.sem);
    if (ttResult.length > 0) {
      console.log(`[subjects] Strategy 3 hit for student ${studentId}: derived ${ttResult.length} subjects from timetable (stream/yr/sem join)`);
      // #region agent log
      fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:student-subjects-s3", message: "strategy3 subjects count", data: { studentId: String(studentId), count: ttResult.length }, timestamp: Date.now(), hypothesisId: "H2" }) }).catch(() => {});
      // #endregion
      return res.json(ttResult);
    }

    // ── STRATEGY 4: student profile yr_sem_id vs enrollment ──────────
    const stud = await Student.findById(studentId).populate("yr_sem_id");
    const sy = stud?.yr_sem_id;
    if (sy && sy._id && String(sy._id) !== String(yrSemData._id)) {
      subjects = await SubjectOffering.find({ yr_sem_id: sy._id })
        .populate("course_master_id")
        .populate("yr_sem_id");
      if (subjects.length > 0) {
        console.log(`[subjects] Strategy 4 hit (SubjectOffering via student.yr_sem_id): ${subjects.length}`);
        return res.json(await buildResult(subjects));
      }
      const tt4 = await subjectsFromTimetableByStreamYrSem(sy.stream, sy.yr, sy.sem);
      if (tt4.length > 0) {
        console.log(`[subjects] Strategy 4 hit (timetable triple via student.yr_sem): ${tt4.length}`);
        return res.json(tt4);
      }
    }

    // ── STRATEGY 5: attendance → class_session → subject_offering ────
    const attSubs = await subjectsFromStudentAttendance(studentId);
    if (attSubs.length > 0) {
      console.log(`[subjects] Strategy 5 hit (attendance): ${attSubs.length} subjects`);
      // #region agent log
      fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:student-subjects-s5", message: "strategy5 attendance count", data: { hypothesisId: "M5", studentId: String(studentId), count: attSubs.length }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
      return res.json(attSubs);
    }

    // ── Nothing found ────────────────────────────────────────────────
    console.warn(`[subjects] No subjects found for student ${studentId} | yr_sem: ${yrSemData._id} (${yrSemData.stream} yr${yrSemData.yr} sem${yrSemData.sem})`);
    res.json([]);
  } catch (error) {
    console.error("Error fetching student subjects:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 11.7. Student: Get Enrolled Subjects via TimeTable (multi-strategy, guaranteed fallback)
app.get("/api/student/enrolled-subjects/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log(`\n[enrolled-subjects] ── REQUEST for studentId: ${studentId}`);

    const student = await Student.findById(studentId);
    if (!student) {
      console.warn(`[enrolled-subjects] Student not found: ${studentId}`);
      return res.status(404).json({ error: "Student not found" });
    }

    const enrollment = await resolveEnrollmentForStudent(studentId);

    if (!enrollment) {
      console.warn(`[enrolled-subjects] No enrollment for student: ${studentId}`);
      return res.status(404).json({ error: "Enrollment not found" });
    }

    const yrSemData = enrollment.yr_sem_id;
    // #region agent log
    fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-resolve", message: "enrollment picked", data: { hypothesisId: "ENR", status: enrollment.status, yrSemId: yrSemData?._id ? String(yrSemData._id) : null }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    console.log(`[enrolled-subjects] Enrollment yr_sem_id raw: ${enrollment.yr_sem_id?._id || enrollment.yr_sem_id}`);
    console.log(`[enrolled-subjects] Populated yrSemData: ${JSON.stringify({ _id: yrSemData?._id, stream: yrSemData?.stream, yr: yrSemData?.yr, sem: yrSemData?.sem })}`);

    if (!yrSemData) {
      console.warn(`[enrolled-subjects] yr_sem_id did not populate — the yr_sem document may be missing from DB`);
      return res.json([]);
    }

    // ── STRATEGY 1: distinct subject_offering_id for this yr_sem (full list; no nested-populate gap) ──
    const distinctIdsS1 = await TimeTable.distinct("subject_offering_id", {
      yr_sem_id: yrSemData._id,
    });
    console.log(`[enrolled-subjects] Strategy 1: distinct offering ids for yr_sem ${yrSemData._id}: ${distinctIdsS1.length}`);
    let subjects = await subjectsFromTimetableYrSemIds([yrSemData._id]);
    // #region agent log
    fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s1", message: "distinct vs built", data: { hypothesisId: "DIST", distinctCount: distinctIdsS1.length, builtCount: subjects.length }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    if (subjects.length > 0) {
      console.log(`[enrolled-subjects] Strategy 1 SUCCESS: returning ${subjects.length} subjects`);
      return res.json(subjects);
    }

    // ── STRATEGY 2: all yr_sems with same stream + yr + sem ─────────
    console.log(`[enrolled-subjects] Strategy 2: searching yr_sems where stream=${yrSemData.stream} yr=${yrSemData.yr} sem=${yrSemData.sem}`);
    const matchingYrSems = await YrSem.find({
      stream: yrSemData.stream,
      yr:     yrSemData.yr,
      sem:    yrSemData.sem,
    });
    const matchingIds = matchingYrSems.map((y) => y._id);
    console.log(`[enrolled-subjects] Strategy 2: found ${matchingYrSems.length} matching yr_sem docs → IDs: ${matchingIds}`);

    subjects = await subjectsFromTimetableYrSemIds(matchingIds);
    console.log(`[enrolled-subjects] Strategy 2 built subjects: ${subjects.length}`);
    if (subjects.length > 0) {
      console.log(`[enrolled-subjects] Strategy 2 SUCCESS: returning ${subjects.length} subjects`);
      return res.json(subjects);
    }

    // ── STRATEGY 3: time_table rows joined to yr_sems, match stream/yr/sem (duplicate yr_sem docs) ──
    console.log(`[enrolled-subjects] Strategy 3: aggregation by timetable yr_sem stream=${yrSemData.stream} yr=${yrSemData.yr} sem=${yrSemData.sem}`);
    const tripleList = await subjectsFromTimetableByStreamYrSem(yrSemData.stream, yrSemData.yr, yrSemData.sem);
    console.log(`[enrolled-subjects] Strategy 3 derived count: ${tripleList.length}`);
    // #region agent log
    fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s3", message: "strategy3 enrolled count", data: { studentId: String(studentId), count: tripleList.length }, timestamp: Date.now(), hypothesisId: "H2" }) }).catch(() => {});
    // #endregion
    subjects = tripleList.map((s) => ({
      subject_offering_id: s.subject_offering_id,
      class_name: s.class_name,
      class_code: s.class_code,
      faculty_name: s.faculty_name,
    }));
    if (subjects.length > 0) {
      console.log(`[enrolled-subjects] Strategy 3 SUCCESS: returning ${subjects.length} subjects`);
      return res.json(subjects);
    }

    // ── STRATEGY 4: student profile yr_sem_id (often matches timetable; enrollment yr_sem may differ) ──
    const stud = await Student.findById(studentId).populate("yr_sem_id");
    const studYs = stud?.yr_sem_id;
    // #region agent log
    fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s4", message: "yr_sem compare", data: { hypothesisId: "M1", enrollmentYrSemId: yrSemData?._id ? String(yrSemData._id) : null, studentYrSemId: studYs?._id ? String(studYs._id) : null, idsDiffer: !!(studYs && yrSemData && String(studYs._id) !== String(yrSemData._id)) }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    if (studYs && studYs._id) {
      subjects = await subjectsFromTimetableYrSemIds([studYs._id]);
      if (subjects.length > 0) {
        // #region agent log
        fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s4", message: "strategy4 distinct ok", data: { hypothesisId: "M1", count: subjects.length }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
        console.log(`[enrolled-subjects] Strategy 4 SUCCESS (student.yr_sem_id): ${subjects.length} subjects`);
        return res.json(subjects);
      }
      const fromStudTriple = await subjectsFromTimetableByStreamYrSem(studYs.stream, studYs.yr, studYs.sem);
      subjects = fromStudTriple.map((s) => ({
        subject_offering_id: s.subject_offering_id,
        class_name: s.class_name,
        class_code: s.class_code,
        faculty_name: s.faculty_name,
      }));
      if (subjects.length > 0) {
        // #region agent log
        fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s4", message: "strategy4 triple ok", data: { hypothesisId: "M1", count: subjects.length }, timestamp: Date.now() }) }).catch(() => {});
        // #endregion
        console.log(`[enrolled-subjects] Strategy 4 SUCCESS (student yr_sem triple): ${subjects.length} subjects`);
        return res.json(subjects);
      }
    }

    // ── STRATEGY 5: attendance sessions (timetable yr_sem may not match enrollment) ──
    const attList = await subjectsFromStudentAttendance(studentId);
    if (attList.length > 0) {
      // #region agent log
      fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "server.js:enrolled-subjects-s5", message: "strategy5 attendance count", data: { hypothesisId: "M5", studentId: String(studentId), count: attList.length }, timestamp: Date.now() }) }).catch(() => {});
      // #endregion
      console.log(`[enrolled-subjects] Strategy 5 SUCCESS (attendance): ${attList.length} subjects`);
      return res.json(attList);
    }

    console.warn(`[enrolled-subjects] ALL STRATEGIES FAILED for student ${studentId}`);
    console.warn(`[enrolled-subjects] enrollment.yr_sem_id (raw): ${enrollment.yr_sem_id?._id}`);
    console.warn(`[enrolled-subjects] Check: does TimeTable have ANY entries? Run db.time_tables.countDocuments() in MongoDB`);
    res.json([]);
  } catch (error) {
    console.error("[enrolled-subjects] EXCEPTION:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 12. Notes Routes
app.post("/api/notes", upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    const { subject_offering_id, faculty_id, title, description } = req.body;
    const file_url = `/uploads/${req.file.filename}`;
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
    res.status(201).json({ message: "Note added successfully", note });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Server error" }); 
  }
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

// 13. Assignment Routes
app.post("/api/faculty/assignments", upload.single('file'), async (req, res) => {
  try {
    const { subject_offering_id, title, instructions, due_date } = req.body;
    const file_url = req.file ? `/uploads/${req.file.filename}` : '';
    const assignment = new Assignment({
      subject_offering_id,
      title,
      instructions,
      file_url,
      due_date: new Date(due_date),
      is_active: true
    });
    await assignment.save();
    res.status(201).json({ message: "Assignment posted successfully", assignment });
  } catch (error) { 
    console.error(error);
    res.status(500).json({ message: "Server error" }); 
  }
});

app.get("/api/assignments/:subjectOfferingId", async (req, res) => {
  try {
    const assignments = await Assignment.find({
      subject_offering_id: req.params.subjectOfferingId,
      is_active: true
    }).sort({ due_date: 1 });
    res.json(assignments);
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// 14. Feedback Routes
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

// 15. Admin Utility: Excel Bulk Setup Routes
app.post("/api/admin/setup-faculty", async (req, res) => {
  try {
    const { users_entries, faculties_entries } = req.body;
    const userMap = {};
    const summary = {
      users_created: [],
      users_existing: [],
      faculty_created: [],
      faculty_existing: []
    };

    for (const userData of users_entries) {
      let user = await User.findOne({ user_name: userData.user_name });
      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);
        user = new User({ user_name: userData.user_name, password: hashedPassword, role: userData.role });
        await user.save();
        summary.users_created.push(userData.user_name);
      } else {
        summary.users_existing.push(userData.user_name);
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
        faculty = new Faculty({ user_id: user._id, name: facultyData.name, email: facultyData.email });
        await faculty.save();
        summary.faculty_created.push(facultyData.email);
      } else {
        summary.faculty_existing.push(facultyData.email);
      }
    }

    const nothingCreated = summary.users_created.length === 0 && summary.faculty_created.length === 0;
    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated ? "Users and faculty already exist. No operation performed." : "Users and faculty processed successfully",
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
    const created = [];
    const skipped = [];

    for (const course of courses_entries) {
      if (!course.course_code) continue;
      const existing = await CourseMaster.findOne({ course_code: course.course_code });
      if (!existing) {
        await CourseMaster.create({ course_code: course.course_code, course_name: course.course_name, credits: course.credits ?? 0 });
        created.push(course.course_code);
      } else {
        skipped.push(course.course_code);
      }
    }

    const nothingCreated = created.length === 0;
    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated ? "All course masters already exist. No operation performed." : "Course masters processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      created,
      skipped
    });
  } catch (error) {
    console.error("Error ensuring course masters:", error);
    return res.status(500).json({ message: "Server error while ensuring course masters" });
  }
});

app.post("/api/admin/ensure-subject-offerings", async (req, res) => {
  try {
    const { batch_info, courses_entries } = req.body;
    const created = [];
    const skipped = [];
    const missing_courses = [];

    const yrSem = await YrSem.findOne({ yr: batch_info.yr, sem: batch_info.sem, academic_yr: batch_info.academic_yr, stream: batch_info.stream });
    if (!yrSem) return res.status(404).json({ message: "yr_sem not found" });

    for (const course of courses_entries) {
      const cm = await CourseMaster.findOne({ course_code: course.course_code });
      if (cm && !(await SubjectOffering.findOne({ course_master_id: cm._id, yr_sem_id: yrSem._id }))) {
        await SubjectOffering.create({ course_master_id: cm._id, yr_sem_id: yrSem._id, is_active: true });
        created.push(course.course_code);
      } else if (!cm) {
        missing_courses.push(course.course_code);
      } else {
        skipped.push(course.course_code);
      }
    }

    const nothingCreated = created.length === 0;
    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated ? "Subject offerings already exist. No operation performed." : "Subject offerings processed successfully",
      yr_sem_id: yrSem._id,
      created_count: created.length,
      skipped_count: skipped.length,
      missing_courses_count: missing_courses.length,
      created,
      skipped,
      missing_courses
    });
  } catch (error) {
    console.error("Error ensuring subject offerings:", error);
    res.status(500).json({ message: "Server error while ensuring subject offerings" });
  }
});

app.post("/api/admin/ensure-faculty-assignments", async (req, res) => {
  try {
    const { batch_info, courses_entries } = req.body;
    const created = [];
    const skipped = [];
    const missing = [];

    const yrSem = await YrSem.findOne({ yr: batch_info.yr, sem: batch_info.sem, academic_yr: batch_info.academic_yr, stream: batch_info.stream });
    if (!yrSem) return res.status(404).json({ message: "yr_sem not found" });

    for (const entry of courses_entries) {
      const faculty = await Faculty.findOne({ name: entry.faculty_name });
      const cm = await CourseMaster.findOne({ course_code: entry.course_code });
      if (faculty && cm) {
        const so = await SubjectOffering.findOne({ course_master_id: cm._id, yr_sem_id: yrSem._id });
        if (so && !(await FacultyAssignment.findOne({ faculty_id: faculty._id, subject_offering_id: so._id }))) {
          await FacultyAssignment.create({ faculty_id: faculty._id, subject_offering_id: so._id, start_date: new Date() });
          created.push(`${entry.faculty_name} - ${entry.course_code}`);
        } else if (so) {
          skipped.push(`${entry.faculty_name} - ${entry.course_code}`);
        }
      } else {
        missing.push(`${entry.faculty_name} - ${entry.course_code}`);
      }
    }

    const nothingCreated = created.length === 0;
    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated ? "Faculty assignments already exist. No operation performed." : "Faculty assignments processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      missing_count: missing.length,
      created,
      skipped,
      missing
    });
  } catch (error) {
    console.error("Error ensuring faculty assignments:", error);
    res.status(500).json({ message: "Server error while ensuring faculty assignments" });
  }
});

app.post("/api/admin/ensure-timetable", async (req, res) => {
  try {
    const { batch_info, timetable_entries } = req.body;
    const created = [];
    const skipped = [];
    const missing = [];

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
          created.push(`${tt.course_code} - ${mappedDay} Session ${tt.session_number}`);
        } else if (fa) {
          skipped.push(`${tt.course_code} - ${mappedDay} Session ${tt.session_number}`);
        } else {
          missing.push(`${tt.course_code} - ${mappedDay} (No faculty assignment)`);
        }
      } else {
        missing.push(`${tt.course_code} - ${tt.day_of_week} (Invalid course or day)`);
      }
    }

    const nothingCreated = created.length === 0;
    return res.status(nothingCreated ? 409 : 201).json({
      message: nothingCreated ? "Timetable already exists. No operation performed." : "Timetable processed successfully",
      created_count: created.length,
      skipped_count: skipped.length,
      missing_count: missing.length,
      created,
      skipped,
      missing
    });
  } catch (error) {
    console.error("Error ensuring timetable:", error);
    res.status(500).json({ message: "Server error while ensuring timetable" });
  }
});

app.post("/api/admin/ensure-yrsem", async (req, res) => {
  try {
    const { batch_info } = req.body;

    if (!batch_info) {
      return res.status(400).json({ message: "batch_info missing" });
    }

    const { yr, sem, stream, academic_yr } = batch_info;

    if (!yr || !sem || !stream || !academic_yr) {
      return res.status(400).json({ message: "yr, sem, stream, academic_yr required" });
    }

    const existing = await YrSem.findOne({ yr, sem, stream, academic_yr });

    if (existing) {
      return res.status(409).json({ message: "Year-Sem already exists", yr_sem_id: existing._id });
    }

    const newYrSem = await YrSem.create({ yr, sem, stream, academic_yr });

    return res.status(200).json({ message: "Year-Sem created successfully", yr_sem_id: newYrSem._id });

  } catch (error) {
    console.error("ensure-yrsem error:", error);
    res.status(500).json({ message: "Server error while ensuring yr_sem" });
  }
});

// 16. Detailed Course View for Student
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

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

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