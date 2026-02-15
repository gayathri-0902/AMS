const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");

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
const Feedback = require("./models/Feedback");

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
    console.log("Fetching timetable for faculty ID:", facultyId);

    const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });

    //const currentDay = "Tue";
    //console.log("Current day:", currentDay);


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
  console.log("Fetching students for section ID:", sectionId);

  try {
    const enrollments = await StudentEnrollment.find({
      yr_sem_id: sectionId,
      status: "active",
    }).populate("student_id")
    .sort({ "student_id.roll_no": 1 });

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
    //const currentDay = new Date().toLocaleString("en-US", { weekday: "short" });

    const currentDay = "Mon";

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
      session_no : sessionNo
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

  //const acYr = academic_yr || "2025-26";

  try {
    const faculty = await Faculty.findOne({ email: faculty_email });
    if (!faculty)
      return res
        .status(404)
        .json({ message: "Faculty not found with that email" });

    const yrSem = await YrSem.findOne({
      yr: Number(yr),
      sem: Number(sem),
      stream: stream
      //academic_yr: academic_yr,
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

//Feedback
app.get("/api/feedback/eligibility/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
    const enrollment = await StudentEnrollment.findOne({ student_id: studentId });

    if (!enrollment || !enrollment.end_date) {
      return res.json({ feedbackAllowed: false });
    }

    const todayStr = new Date().toISOString().slice(0, 10);
    const endDateStr = new Date(enrollment.end_date).toISOString().slice(0, 10);

    console.log("Today:", todayStr);
    console.log("End Date:", endDateStr);

    res.json({
      feedbackAllowed: todayStr === endDateStr,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/feedback", async (req, res) => {
  const {
    student_id,
    subject_offering_id,
    regularity,
    interaction,
    explanation,
    resources,
    counselling,
    remedial,
    syllabus_alignment,
    pace,
    comments,
  } = req.body;

  try {
    const enrollment = await StudentEnrollment.findOne({ student_id });

    if (!enrollment || !enrollment.end_date) {
      return res.status(403).json({
        message: "Enrollment information not found",
      });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endDate = new Date(enrollment.end_date);
    endDate.setHours(0, 0, 0, 0);

    if (today.getTime() !== endDate.getTime()) {
      return res.status(403).json({
        message: "Feedback allowed only on semester end date",
      });
    }

    const feedback = new Feedback({
      student_id,
      subject_offering_id,
      regularity,
      interaction,
      explanation,
      resources,
      counselling,
      remedial,
      syllabus_alignment,
      pace,
      comments,
    });

    await feedback.save();
    res.status(201).json({ message: "Feedback submitted successfully" });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        message: "Feedback already submitted for this subject",
      });
    }
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

app.post("/api/admin/setup-faculty", async (req, res) => {
  try {
    const { users_entries, faculties_entries } = req.body;

    if (!users_entries || !faculties_entries) {
      return res.status(400).json({
        message: "users_entries or faculties_entries missing"
      });
    }

    const userMap = {}; // email → user document
    const summary = {
      users_created: [],
      users_existing: [],
      faculty_created: [],
      faculty_existing: []
    };

    // -----------------------------
    // 1️⃣ USERS (with bcrypt)
    // -----------------------------
    for (const userData of users_entries) {
      let user = await User.findOne({ user_name: userData.user_name });

      if (!user) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(userData.password, salt);

        user = new User({
          user_name: userData.user_name,
          password: hashedPassword,
          role: userData.role
        });

        await user.save();
        summary.users_created.push(user.user_name);
      } else {
        summary.users_existing.push(user.user_name);
      }

      userMap[user.user_name] = user;
    }

    // -----------------------------
    // 2️⃣ FACULTY
    // -----------------------------
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

    if (!Array.isArray(courses_entries)) {
      return res.status(400).json({
        message: "courses_entries must be an array"
      });
    }

    let created = [];
    let skipped = [];

    for (const course of courses_entries) {
      if (!course.course_code || !course.course_name) {
        continue;
      }

      const existing = await CourseMaster.findOne({
        course_code: course.course_code
      });

      if (existing) {
        skipped.push(course.course_code);
        continue;
      }

      const newCourse = await CourseMaster.create({
        course_code: course.course_code,
        course_name: course.course_name,
        credits: course.credits ?? 0
      });

      created.push(newCourse.course_code);
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

    if (!batch_info || !Array.isArray(courses_entries)) {
      return res.status(400).json({
        message: "batch_info or courses_entries missing/invalid"
      });
    }

    const { yr, sem, academic_yr, stream } = batch_info;

    // 1️⃣ Resolve yr_sem_id
    const yrSem = await YrSem.findOne({
      yr: yr,
      sem: sem,
      academic_yr: academic_yr,
      stream: stream
    });

    if (!yrSem) {
      return res.status(404).json({
        message: "yr_sem not found for given batch_info"
      });
    }

    const yr_sem_id = yrSem._id;

    let created = [];
    let skipped = [];
    let missing_courses = [];

    // 2️⃣ Process each course
    for (const course of courses_entries) {
      if (!course.course_code) continue;

      const courseMaster = await CourseMaster.findOne({
        course_code: course.course_code
      });

      if (!courseMaster) {
        missing_courses.push(course.course_code);
        continue;
      }

      // 3️⃣ Check if subject offering already exists
      const exists = await SubjectOffering.findOne({
        course_master_id: courseMaster._id,
        yr_sem_id : yr_sem_id
      });

      if (exists) {
        skipped.push(course.course_code);
        continue;
      }

      // 4️⃣ Create subject offering
      await SubjectOffering.create({
        course_master_id: courseMaster._id,
        yr_sem_id,
        is_active: true
      });

      created.push(course.course_code);
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

    if (!batch_info || !Array.isArray(courses_entries)) {
      return res.status(400).json({
        message: "batch_info or courses_entries missing/invalid"
      });
    }

    const { yr, sem, academic_yr, stream } = batch_info;

    // 1️⃣ Resolve yr_sem_id
    const yrSem = await YrSem.findOne({
      yr: yr,
      sem: sem,
      academic_yr: academic_yr,
      stream: stream
    });

    if (!yrSem) {
      return res.status(404).json({
        message: "yr_sem not found"
      });
    }

    const yr_sem_id = yrSem._id;

    let created = [];
    let skipped = [];
    let missing = [];

    // 2️⃣ Process each course entry
    for (const entry of courses_entries) {
      const { course_code, faculty_name } = entry;

      if (!course_code || !faculty_name) continue;

      // 🔹 Faculty
      const faculty = await Faculty.findOne({ name: faculty_name });
      if (!faculty) {
        missing.push({ course_code, reason: "faculty not found" });
        continue;
      }

      // 🔹 Course Master
      const courseMaster = await CourseMaster.findOne({
        course_code: course_code
      });

      if (!courseMaster) {
        missing.push({ course_code, reason: "course_master not found" });
        continue;
      }

      // 🔹 Subject Offering
      const subjectOffering = await SubjectOffering.findOne({
        course_master_id: courseMaster._id,
        yr_sem_id
      });

      if (!subjectOffering) {
        missing.push({ course_code, reason: "subject_offering not found" });
        continue;
      }

      // 🔹 Faculty Assignment
      const exists = await FacultyAssignment.findOne({
        faculty_id: faculty._id,
        subject_offering_id: subjectOffering._id
      });

      if (exists) {
        skipped.push(course_code);
        continue;
      }

      await FacultyAssignment.create({
        faculty_id: faculty._id,
        subject_offering_id: subjectOffering._id,
        start_date: new Date()
      });

      created.push(course_code);
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

    if (!batch_info || !Array.isArray(timetable_entries)) {
      return res.status(400).json({
        message: "batch_info or timetable_entries missing/invalid"
      });
    }

    const { yr, sem, academic_yr, stream } = batch_info;

    // 1️⃣ Resolve yr_sem_id
    const yrSem = await YrSem.findOne({
      yr: yr,
      sem: sem,
      academic_yr: academic_yr,
      stream: stream
    });

    if (!yrSem) {
      return res.status(404).json({
        message: "yr_sem not found"
      });
    }

    const yr_sem_id = yrSem._id;

    // 2️⃣ Day mapping
    const dayMap = {
      Monday: "Mon",
      Tuesday: "Tue",
      Wednesday: "Wed",
      Thursday: "Thu",
      Friday: "Fri",
      Saturday: "Sat",
      Sunday: "Sun"
    };

    let created = [];
    let skipped = [];
    let missing = [];

    // 3️⃣ Process timetable entries
    for (const tt of timetable_entries) {
      const {
        day_of_week,
        session_number,
        start_time,
        end_time,
        course_code,
        location
      } = tt;

      const mappedDay = dayMap[day_of_week];
      if (!mappedDay) {
        missing.push({ course_code, reason: "invalid day" });
        continue;
      }

      // 🔹 Course Master
      const courseMaster = await CourseMaster.findOne({ course_code });
      if (!courseMaster) {
        missing.push({ course_code, reason: "course_master not found" });
        continue;
      }

      // 🔹 Subject Offering
      const subjectOffering = await SubjectOffering.findOne({
        course_master_id: courseMaster._id,
        yr_sem_id
      });

      if (!subjectOffering) {
        missing.push({ course_code, reason: "subject_offering not found" });
        continue;
      }

      // 🔹 Faculty Assignment
      const facultyAssignment = await FacultyAssignment.findOne({
        subject_offering_id: subjectOffering._id
      });

      if (!facultyAssignment) {
        missing.push({ course_code, reason: "faculty_assignment not found" });
        continue;
      }

      // 🔹 Check unique slot
      const exists = await TimeTable.findOne({
        yr_sem_id,
        day_of_week: mappedDay,
        session_no: session_number
      });

      if (exists) {
        skipped.push({
          day_of_week: mappedDay,
          session_number
        });
        continue;
      }

      // 🔹 Create timetable entry
      await TimeTable.create({
        yr_sem_id,
        day_of_week: mappedDay,
        session_no: session_number,
        start_time,
        end_time,
        subject_offering_id: subjectOffering._id,
        faculty_id: facultyAssignment.faculty_id,
        location
      });

      created.push({
        day_of_week: mappedDay,
        session_number,
        course_code
      });
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

    // 🔎 Check existing
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

    // ➕ Create
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
});



app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
