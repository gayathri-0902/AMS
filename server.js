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

dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;
const PORT = process.env.PORT || 3002;

// --- Automated Port Management (Linux Fix) ---
// This prevents the "Address already in use" crash you experienced
if (process.env.NODE_ENV !== 'production') {
  exec(`fuser -k ${PORT}/tcp`, (err) => {
    if (!err) console.log(`Cleared stale processes on port ${PORT}`);
  });
}

// --- Middleware ---
app.use(
  cors({
    origin: ["http://localhost:5173"], // Matches your Vite frontend port
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

// --- ROUTES ---

// 1. Login Endpoint
app.post("/api/login", async (req, res) => {
  const { body } = req;
  try {
    // Search by username primarily
    let user = await User.findOne({ user_name: body.identifier });
    
    // Fallback for students using Roll Number
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

    // Role-specific data fetching
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
        session_no : entry.session_no,
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

// 5. Parent Dashboard Route
app.get("/api/parent/dashboard/:parentId", async (req, res) => {
  try {
    const { parentId } = req.params;
    const mapping = await ParentStudentMap.findOne({ parent_id: parentId }).populate("student_id");
    if (!mapping || !mapping.student_id) {
      return res.status(404).json({ message: "No linked student found" });
    }

    const student = mapping.student_id;
    const enrollment = await StudentEnrollment.findOne({ 
      student_id: student._id, 
      status: "active" 
    }).populate("yr_sem_id");

    const records = await Attendance.find({ student_id: student._id })
      .populate({
        path: "class_session_id",
        populate: { path: "subject_offering_id", populate: { path: "course_master_id" } }
      })
      .sort({ createdAt: -1 })
      .limit(5);

    const allRecords = await Attendance.find({ student_id: student._id });
    const presentCount = allRecords.filter(r => r.status === "Present").length;
    const percentage = allRecords.length > 0 ? ((presentCount / allRecords.length) * 100).toFixed(1) : 0;

    res.json({
      studentDetails: {
        student_name: student.name,
        student_id_no: student.roll_no,
        branch_name: enrollment?.yr_sem_id?.stream || "N/A",
      },
      attendanceStats: {
        percentage: percentage,
        subjectsWithLowAttendance: [] 
      },
      recentAttendance: records.map(r => ({
        class_name: r.class_session_id.subject_offering_id.course_master_id.course_name,
        date: new Date(r.class_session_id.date).toLocaleDateString(),
        session_no: r.class_session_id.session_no,
        status: r.status
      }))
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
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
      session_no : sessionNo
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

// 8. Admin: Create Faculty
app.post("/api/admin/faculty", async (req, res) => {
  const { name, email, password } = req.body;
  try {
    let user = await User.findOne({ user_name: email });
    if (user) return res.status(400).json({ message: "User already exists" });
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    user = new User({ user_name: email, password: hashedPassword, role: "faculty" });
    await user.save();
    const faculty = new Faculty({ user_id: user._id, name, email });
    await faculty.save();
    res.status(201).json({ message: "Faculty created successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
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

// 12. Notes Routes
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

// 13. Assignment Routes
app.post("/api/faculty/assignments", async (req, res) => {
  const { subject_offering_id, title, instructions, due_date, file_url } = req.body;
  try {
    const assignment = new Assignment({ 
      subject_offering_id, 
      title, 
      instructions, 
      file_url, 
      due_date: new Date(due_date), 
      is_active: true 
    });
    await assignment.save();
    res.status(201).json({ message: "Assignment posted successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
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
      if (user && !(await Faculty.findOne({ user_id: user._id }))) {
        await new Faculty({ user_id: user._id, name: facultyData.name, email: facultyData.email }).save();
      }
    }
    res.status(201).json({ message: "Processed successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

app.post("/api/admin/ensure-course-masters", async (req, res) => {
  try {
    const { courses_entries } = req.body;
    for (const course of courses_entries) {
      if (!course.course_code) continue;
      const existing = await CourseMaster.findOne({ course_code: course.course_code });
      if (!existing) await CourseMaster.create({ course_code: course.course_code, course_name: course.course_name, credits: course.credits ?? 0 });
    }
    res.status(200).json({ message: "Check completed" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
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
    res.status(201).json({ message: "Processed successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
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
    res.status(201).json({ message: "Processed successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
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
    res.status(201).json({ message: "Timetable processed successfully" });
  } catch (error) { res.status(500).json({ message: "Server error" }); }
});

// --- NEW ROUTE: 16. Detailed Course View for Student ---
app.get("/api/student/course-details/:studentId/:subjectOfferingId", async (req, res) => {
  const { studentId, subjectOfferingId } = req.params;
  try {
    // 1. Get Subject Info
    const subject = await SubjectOffering.findById(subjectOfferingId).populate("course_master_id");
    if (!subject) return res.status(404).json({ message: "Subject not found" });

    // 2. Calculate Attendance for this specific subject
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

    // 3. Get Notes
    const notes = await ClassNotes.find({ 
      subject_offering_id: subjectOfferingId, 
      is_visible: true 
    }).sort({ upload_date: -1 });

    // 4. Get Assignments
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

// --- Server Startup ---
// Do not use 'const' here because PORT was already declared at line 30
server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is busy. Please run "fuser -k ${PORT}/tcp"`);
    process.exit(1);
  } else {
    console.error("Server Error:", e);
  }
});