const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

// Models
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

dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;

app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type"],
  })
);

app.use(express.json());

if (!MONGO_URI) {
  console.error("MONGO_URI is not set in the environment variables.");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Error connecting to MongoDB:", err));

// Routes

// Login Endpoint
app.post("/api/login", async (req, res) => {
  const { body } = req;
  console.log("Login Request:", body);

  try {
    let user = await User.findOne({ user_name: body.identifier });

    // If no user found by username, and role is student, try finding by Roll No
    if (!user && body.role === "student") {
      const student = await Student.findOne({ roll_no: body.identifier });
      if (student) {
        user = await User.findById(student.user_id);
      }
    }

    if (!user || user.password !== body.password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    if (body.role && user.role !== body.role) {
      return res.status(401).json({ message: "Role mismatch" });
    }

    const responseData = {
      message: `${
        user.role.charAt(0).toUpperCase() + user.role.slice(1)
      } login successful`,
      role: user.role,
      userId: user._id,
    };

    if (user.role === "admin") {
      const admin = await Admin.findOne({ user_id: user._id });
      if (admin) responseData.adminId = admin._id;
    } else if (user.role === "faculty") {
      const faculty = await Faculty.findOne({ user_id: user._id });
      if (faculty) responseData.facultyId = faculty._id;
    } else if (user.role === "student") {
      const student = await Student.findOne({ user_id: user._id });
      if (student) {
        responseData.studentId = student._id;
        const enrollment = await StudentEnrollment.findOne({
          student_id: student._id,
          status: "active",
        });
        if (enrollment) {
          responseData.sectionId = enrollment.yr_sem_id;
        }
      }
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Faculty Dashboard: Get classes for today
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
      return res
        .status(200)
        .json({ message: "No classes found for this faculty on this day." });
    }

    const result = timetableEntries.map((entry) => {
      const subject = entry.subject_offering_id;
      const course = subject ? subject.course_master_id : null;
      const yrSem = entry.yr_sem_id;

      return {
        _id: entry._id,
        class_name: course ? course.course_name : "Unknown Course",
        section_name: yrSem
          ? `${yrSem.stream} ${yrSem.yr}-${yrSem.sem}`
          : "Unknown Batch",
        section_id: yrSem ? yrSem._id : null,
        class_id: subject ? subject._id : null,
        session_no : entry.session_no,
      };
    });

    res.json(result);
  } catch (error) {
    console.error("Error fetching faculty dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch students for marking attendance
app.get("/api/faculty-dashboard/students/:sectionId", async (req, res) => {
  const { sectionId } = req.params;

  try {
    const enrollments = await StudentEnrollment.find({
      yr_sem_id: sectionId,
      status: "active",
    }).populate("student_id");

    if (!enrollments || enrollments.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found in this section." });
    }

    const students = enrollments
      .map((enrollment) => {
        const student = enrollment.student_id;
        if (!student) return null;
        return {
          _id: student._id,
          student_name: student.name,
          student_id_no: student.roll_no || "N/A",
        };
      })
      .filter((s) => s !== null);

    students.sort((a, b) => a.student_id_no.localeCompare(b.student_id_no));

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Student Dashboard: Timetable and Attendance Status
app.get("/api/student-dashboard/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const enrollment = await StudentEnrollment.findOne({
      student_id: studentId,
      status: "active",
    });

    if (!enrollment) {
      return res.status(404).json({ error: "Active enrollment not found" });
    }

    const yrSemId = enrollment.yr_sem_id;
    const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });

    const timetableEntries = await TimeTable.find({
      yr_sem_id: yrSemId,
      day_of_week: currentDay,
    })
      .populate({
        path: "subject_offering_id",
        populate: { path: "course_master_id" },
      })
      .populate("faculty_id")
      .sort({ session_no: 1 });

    if (!timetableEntries.length) {
      return res.json({ timetableData: [] });
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const subjectIds = timetableEntries.map((t) => t.subject_offering_id._id);
    const sessionNos = timetableEntries.map((t) => t.session_no);
    const sessions = await ClassSession.find({
      subject_offering_id: { $in: subjectIds },
      date: { $gte: startOfDay, $lte: endOfDay },
      session_no : { $in: sessionNos }
    });

    const sessionIds = sessions.map((s) => s._id);

    const attendanceRecords = await Attendance.find({
      student_id: studentId,
      class_session_id: { $in: sessionIds },
    }).populate("class_session_id");

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const subjectId = record.class_session_id.subject_offering_id.toString();
      const sessNo = record.class_session_id.session_no;
      const key = `${subjectId}_${sessNo}`;
      attendanceMap[key] = record.status;
    });

    const timetableData = timetableEntries.map((entry) => {
      const subject = entry.subject_offering_id;
      const course = subject.course_master_id;
      const subjectIdString = subject._id.toString();
      const sessNo = entry.session_no;
      const key = `${subjectIdString}_${sessNo}`;

      return {
        class_name: course.course_name,
        class_code: course.course_code,
        faculty_name: entry.faculty_id ? entry.faculty_id.name : "Unknown",
        duration: 1,
        day: entry.day_of_week,
        attendance_status: attendanceMap[key] || "Not Marked",
      };
    });

    res.json({ timetableData });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch overall attendance for student
app.get("/api/attendance/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const enrollment = await StudentEnrollment.findOne({
      student_id: studentId,
      status: "active",
    });

    if (!enrollment) return res.status(404).json({ error: "Not enrolled" });

    const subjects = await SubjectOffering.find({
      yr_sem_id: enrollment.yr_sem_id,
    }).populate("course_master_id");

    const subjectAttendance = [];

    for (const subject of subjects) {
      const sessions = await ClassSession.find({
        subject_offering_id: subject._id,
      });
      const sessionIds = sessions.map((s) => s._id);

      const records = await Attendance.find({
        student_id: studentId,
        class_session_id: { $in: sessionIds },
      });

      const present = records.filter((r) => r.status === "Present").length;
      const total = records.length;

      const percentage =
        total > 0 ? ((present / total) * 100).toFixed(2) : "0.00";

      subjectAttendance.push({
        subject_offering_id: subject._id,
        class_name: subject.course_master_id.course_name,
        class_code: subject.course_master_id.course_code,
        present_count: present,
        total_count: total,
        percentage: percentage,
      });
    }

    res.json({ subjectAttendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit attendance from faculty
app.post("/api/attendance", async (req, res) => {
  const { classId, attendanceData, sessionNo } = req.body;

  if (!classId || !attendanceData) {
    return res
      .status(400)
      .json({ message: "Missing classId or attendanceData" });
  }

  try {
    const assignment = await FacultyAssignment.findOne({
      subject_offering_id: classId,
    });
    const facultyId = assignment ? assignment.faculty_id : null;

    const session = new ClassSession({
      subject_offering_id: classId,
      faculty_id: facultyId,
      date: new Date(),
      is_conducted: true,
      session_no : sessionNo,
    });

    await session.save();

    const attendanceRecords = Object.keys(attendanceData)
      .filter((studentId) =>
        ["Present", "Absent"].includes(attendanceData[studentId])
      )
      .map((studentId) => ({
        class_session_id: session._id,
        student_id: studentId,
        status: attendanceData[studentId],
      }));

    if (attendanceRecords.length === 0) {
      return res.status(400).json({ message: "No valid attendance data" });
    }

    await Attendance.insertMany(attendanceRecords);

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// ADMIN ROUTES

// 1. Add Faculty
app.post("/api/admin/faculty", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    let user = await User.findOne({ user_name: email });
    if (user)
      return res
        .status(400)
        .json({ message: "User with this email already exists" });

    user = new User({
      user_name: email,
      password: password,
      role: "faculty",
    });
    await user.save();

    const faculty = new Faculty({
      user_id: user._id,
      name: name,
      email: email,
    });
    await faculty.save();

    res.status(201).json({ message: "Faculty created successfully", faculty });
  } catch (error) {
    console.error("Error adding faculty:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Add Student
app.post("/api/admin/student", async (req, res) => {
  const { name, roll_no, email, stream, yr, sem, academic_yr, password } =
    req.body;

  try {
    let user = await User.findOne({ user_name: email });
    if (user)
      return res
        .status(400)
        .json({ message: "User with this email already exists" });

    let yrSem = await YrSem.findOne({
      yr: Number(yr),
      sem: Number(sem),
      stream: stream,
      academic_yr: academic_yr,
    });

    if (!yrSem) {
      yrSem = new YrSem({
        yr: Number(yr),
        sem: Number(sem),
        stream: stream,
        academic_yr: academic_yr,
      });
      await yrSem.save();
    }

    user = new User({
      user_name: email,
      password: password,
      role: "student",
    });
    await user.save();

    const student = new Student({
      user_id: user._id,
      name: name,
      yr_sem_id: yrSem._id,
      roll_no: roll_no,
      email: email,
    });
    await student.save();

    const enrollment = new StudentEnrollment({
      student_id: student._id,
      yr_sem_id: yrSem._id,
      academic_yr: academic_yr,
      status: "active",
      start_date: new Date(),
    });
    await enrollment.save();

    res.status(201).json({ message: "Student created successfully", student });
  } catch (error) {
    console.error("Error adding student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 3. Add Schedule (Timetable)
app.post("/api/admin/schedule", async (req, res) => {
  const {
    course_code,
    faculty_email,
    stream,
    yr,
    sem,
    academic_yr,
    day,
    start_time,
    end_time,
    location,
    session_no,
  } = req.body;

  const acYr = academic_yr || "2025-26";

  try {
    const faculty = await Faculty.findOne({ email: faculty_email });
    if (!faculty)
      return res
        .status(404)
        .json({ message: "Faculty not found with that email" });

    const yrSem = await YrSem.findOne({
      yr: Number(yr),
      sem: Number(sem),
      stream: stream,
      academic_yr: acYr,
    });
    if (!yrSem)
      return res.status(404).json({
        message: "YrSem (Section) not found. Create it first or check inputs.",
      });

    let course = await CourseMaster.findOne({ course_code: course_code });
    if (!course) {
      course = new CourseMaster({
        course_code: course_code,
        course_name: course_code,
        credits: 3,
      });
      await course.save();
    }

    let subjectOffering = await SubjectOffering.findOne({
      course_master_id: course._id,
      yr_sem_id: yrSem._id,
    });
    if (!subjectOffering) {
      subjectOffering = new SubjectOffering({
        course_master_id: course._id,
        yr_sem_id: yrSem._id,
        is_active: true,
      });
      await subjectOffering.save();
    }

    const assignment = await FacultyAssignment.findOne({
      faculty_id: faculty._id,
      subject_offering_id: subjectOffering._id,
    });
    if (!assignment) {
      await new FacultyAssignment({
        faculty_id: faculty._id,
        subject_offering_id: subjectOffering._id,
      }).save();
    }

    const timetable = new TimeTable({
      yr_sem_id: yrSem._id,
      day_of_week: day,
      session_no: Number(session_no),
      start_time,
      end_time,
      subject_offering_id: subjectOffering._id,
      faculty_id: faculty._id,
      location,
    });

    await timetable.save();
    res
      .status(201)
      .json({ message: "Schedule created successfully", timetable });
  } catch (error) {
    console.error("Error adding schedule:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 4. Add Parent
app.post("/api/admin/parent", async (req, res) => {
  const { name, email, password, phno } = req.body;

  try {
    let user = await User.findOne({ user_name: email });
    if (user)
      return res
        .status(400)
        .json({ message: "User with this email already exists" });

    user = new User({
      user_name: email,
      password: password,
      role: "parent",
    });
    await user.save();

    const parent = new Parent({
      user_id: user._id,
      name: name,
      phno: phno,
    });
    await parent.save();

    res.status(201).json({ message: "Parent created successfully", parent });
  } catch (error) {
    console.error("Error adding parent:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 5. Map Parent to Student
app.post("/api/admin/parent/map", async (req, res) => {
  const { parent_email, student_roll_no, relationship } = req.body;

  try {
    // Find Parent User -> Parent Profile
    const parentUser = await User.findOne({ user_name: parent_email });
    if (!parentUser)
      return res.status(404).json({ message: "Parent user not found" });

    const parent = await Parent.findOne({ user_id: parentUser._id });
    if (!parent)
      return res.status(404).json({ message: "Parent profile not found" });

    // Find Student
    const student = await Student.findOne({ roll_no: student_roll_no });
    if (!student) return res.status(404).json({ message: "Student not found" });

    const mapping = new ParentStudentMap({
      parent_id: parent._id,
      student_id: student._id,
      relationship: relationship,
    });
    await mapping.save();

    res
      .status(201)
      .json({ message: "Parent linked to student successfully", mapping });
  } catch (error) {
    console.error("Error mapping parent-student:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// CLASS NOTES ROUTES

// 1. Add Note
app.post("/api/notes", async (req, res) => {
  const { subject_offering_id, faculty_id, title, description, file_url } =
    req.body;
  // faculty_id should ideally come from auth token, but taking from body for prototype simplicity

  try {
    const note = new ClassNotes({
      subject_offering_id,
      faculty_id,
      title,
      description,
      file_url,
      upload_date: new Date(),
      is_visible: true,
    });

    await note.save();
    res.status(201).json({ message: "Note added successfully", note });
  } catch (error) {
    console.error("Error adding note:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// 2. Get Notes for Subject
app.get("/api/notes/:subjectOfferingId", async (req, res) => {
  const { subjectOfferingId } = req.params;
  try {
    const notes = await ClassNotes.find({
      subject_offering_id: subjectOfferingId,
      is_visible: true,
    })
      .populate("faculty_id", "name")
      .sort({ upload_date: -1 });

    res.json(notes);
  } catch (error) {
    console.error("Error fetching notes:", error);
    res.status(500).json({ message: "Server error" });
  }
});

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
