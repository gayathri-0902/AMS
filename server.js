const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

<<<<<<< HEAD
const fs = require('fs');
const multer = require("multer");
const path=require("path");

const { Schema, model, Types } = mongoose;

=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;

app.use(
  cors({
<<<<<<< HEAD
    origin: ["http://localhost:5173","https://ams-dx9j.onrender.com"],
=======
    origin: ["http://localhost:5173"],
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
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

<<<<<<< HEAD

// Schemas and Models
const AdminSchema = new mongoose.Schema(
  {
    username: String,
    password: String,
  },
  { collection: "admin" }
);
const Admin = mongoose.model("Admin", AdminSchema);

const FacultySchema = new mongoose.Schema(
  {
    faculty_name: String,
    password: String,
    email: String
  },
  { collection: "faculty", versionKey: false }
);
const Faculty = mongoose.model("Faculty", FacultySchema);

const StudentSchema = new mongoose.Schema(
  {
    student_id_no: String,
    password: String,
    student_name: String,
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    year_id: { type: mongoose.Schema.Types.ObjectId, ref: "Year" },
    guardian_mail : String
  },
  { collection: "student", versionKey: false }
);
const Student = mongoose.model("Student", StudentSchema);

const SectionSchema = new mongoose.Schema(
  {
    section_id_no: Number,
    section_name: String,
  },
  { collection: "section" , versionKey: false}
);
const Section = mongoose.model("Section", SectionSchema); // currently not in use, remove if not used in future

const ClassSchema = new mongoose.Schema(
  {
    class_name: String,
    class_code: String,
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    year_id: { type: mongoose.Schema.Types.ObjectId, ref: "Year" },
  },
  { collection: "classes" , versionKey: false}
);
const Class = mongoose.model("Class", ClassSchema);

const TimetableSchema = new mongoose.Schema(
  {
    section_id: { type: mongoose.Schema.Types.ObjectId, ref: "Section" },
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    day: String,
    duration: Number,
    faculty_id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    start_time: String
  },
  { collection: "timetable", versionKey: false }
);

const Timetable = mongoose.model("Timetable", TimetableSchema);

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    status: String,
    date: { type: Date, default: Date.now },
  },
  { collection: "attendance", versionKey: false }
);

const Attendance = mongoose.model("Attendance", AttendanceSchema);

// models/ArchivedStudent.js

const archivedStudentSchema = new mongoose.Schema({
  student_id_no: { type: String, required: true },
  student_name: { type: String, required: true },
  password: { type: String, required: true },
  guardian_mail: { type: String, required: true },
  section_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Section', required: true },
  year_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Year', required: true },
  archived_date: { type: Date, default: Date.now }  // Auto-sets the date when archived
});

const ArchivedStudent = mongoose.model('ArchivedStudent', archivedStudentSchema);



// Routes
app.post("/api/login", async (req, res) => {
  const { body } = req;
  console.log(body);

  try {
    let user = null;
    if (body.role === "admin") {
      user = await Admin.findOne({ username: body.identifier });
    } else if (body.role === "faculty") {
      user = await Faculty.findOne({ faculty_name: body.identifier });
    } else if (body.role === "student") {
      user = await Student.findOne({ student_id_no: body.identifier });
    }

    if (!user || user.password !== body.password) {
      return res
        .status(401)
        .json({ message: `Invalid ${body.role} credentials` });
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
    }

    const responseData = {
      message: `${
<<<<<<< HEAD
        body.role.charAt(0).toUpperCase() + body.role.slice(1)
      } login successful`,
    };

    if (body.role === "admin") {
      responseData.adminId = user._id;
    } else if (body.role === "faculty") {
      responseData.facultyId = user._id;
    } else if (body.role === "student") {
      responseData.studentId = user._id;
      responseData.sectionId = user.section_id;
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

<<<<<<< HEAD
// app.get("/api/faculty-dashboard/:facultyId", async (req, res) => {
//   try {
//     const { facultyId } = req.params;
//     const classes = await Class.find({ faculty_id: facultyId }).populate(
//       "section_id"
//     );
//     if (!classes || classes.length === 0) {
//       return res
//         .status(404)
//         .json({ message: "No classes found for this faculty." });
//     }
//     res.json(classes);
//   } catch (error) {
//     console.error("Error fetching classes:", error);
//     res.status(500).json({ message: "Server error" });
//   }
// });

app.get("/api/faculty-dashboard/:facultyId", async (req, res) => {
  try {
    const { facultyId } = req.params;
    const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });
    //const currentDay = "Monday"
    // Step 1: Fetch class_id and section_id from the timetable using faculty_id and current day
    const timetableEntries = await Timetable.find({
      faculty_id: facultyId,
      day: currentDay,
    });
=======
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
      .populate("yr_sem_id");
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

    if (!timetableEntries.length) {
      return res
        .status(200)
        .json({ message: "No classes found for this faculty on this day." });
    }

<<<<<<< HEAD
    // Step 2: Extract class_ids and section_ids
    const classIds = timetableEntries.map((entry) => entry.class_id);
    const sectionIds = timetableEntries.map((entry) => entry.section_id);

    // Step 3: Fetch class_name from classes collection and section_name from section collection
    const classes = await Class.find({ _id: { $in: classIds } }).select(
      "class_name"
    );
    const sections = await Section.find({ _id: { $in: sectionIds } }).select(
      "section_name"
    );

    // Step 4: Merge data to return structured response
    const result = timetableEntries.map((entry) => {
      const classInfo = classes.find(
        (cls) => cls._id.toString() === entry.class_id.toString()
      );
      const sectionInfo = sections.find(
        (sec) => sec._id.toString() === entry.section_id.toString()
      );
      return {
        _id: entry._id,
        class_name: classInfo ? classInfo.class_name : "Unknown Class",
        section_name: sectionInfo
          ? sectionInfo.section_name
          : "Unknown Section",
        section_id: entry.section_id,
        class_id: entry.class_id,
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
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
<<<<<<< HEAD
    const students = await Student.find({ section_id: sectionId }).select(
      "student_name student_id_no"
    );

    if (!students || students.length === 0) {
=======
    const enrollments = await StudentEnrollment.find({
      yr_sem_id: sectionId,
      status: "active",
    }).populate("student_id");

    if (!enrollments || enrollments.length === 0) {
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
      return res
        .status(404)
        .json({ message: "No students found in this section." });
    }

<<<<<<< HEAD
=======
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

>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
    students.sort((a, b) => a.student_id_no.localeCompare(b.student_id_no));

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

<<<<<<< HEAD
// Fetch student for student dashboard
=======
// Student Dashboard: Timetable and Attendance Status
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
app.get("/api/student-dashboard/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
<<<<<<< HEAD
    const student = await Student.findById(studentId).populate("section_id");
    if (!student) {
      return res.status(404).json({ error: "Student not found" }); // TODO: Manage this case in a better way.
    }

    const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });

    const timetableEntries = await Timetable.find({
      section_id: student.section_id._id,
      day: currentDay,
    })
      .populate("class_id")
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)
      .populate("faculty_id");

    if (!timetableEntries.length) {
      return res.json({ timetableData: [] });
    }

<<<<<<< HEAD
    const classIds = timetableEntries.map((entry) => entry.class_id._id);

    const attendanceRecords = await Attendance.find({
      studentId,
      classId: { $in: classIds },
    });

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      attendanceMap[record.classId.toString()] = record.status;
    });

    const timetableData = timetableEntries.map((entry) => ({
      class_name: entry.class_id.class_name,
      class_code: entry.class_id.class_code,
      faculty_name: entry.faculty_id.faculty_name,
      duration: entry.duration,
      day: entry.day,
      attendance_status:
        attendanceMap[entry.class_id._id.toString()] || "Not Marked",
    }));
=======
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const subjectIds = timetableEntries.map((t) => t.subject_offering_id._id);

    const sessions = await ClassSession.find({
      subject_offering_id: { $in: subjectIds },
      date: { $gte: startOfDay, $lte: endOfDay },
    });

    const sessionIds = sessions.map((s) => s._id);

    const attendanceRecords = await Attendance.find({
      student_id: studentId,
      class_session_id: { $in: sessionIds },
    }).populate("class_session_id");

    const attendanceMap = {};
    attendanceRecords.forEach((record) => {
      const subjectId = record.class_session_id.subject_offering_id.toString();
      attendanceMap[subjectId] = record.status;
    });

    const timetableData = timetableEntries.map((entry) => {
      const subject = entry.subject_offering_id;
      const course = subject.course_master_id;
      const subjectIdString = subject._id.toString();

      return {
        class_name: course.course_name,
        class_code: course.course_code,
        faculty_name: entry.faculty_id ? entry.faculty_id.name : "Unknown",
        duration: 1,
        day: entry.day_of_week,
        attendance_status: attendanceMap[subjectIdString] || "Not Marked",
      };
    });
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

    res.json({ timetableData });
  } catch (error) {
    console.error("Error fetching timetable:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch overall attendance for student
app.get("/api/attendance/:studentId", async (req, res) => {
  const { studentId } = req.params;

<<<<<<< HEAD
  const student = await Student.findById(studentId).populate("section_id");

  try {
    // Fetch all subjects (classes) in the system
    const allClasses = await Class.find({section_id: student.section_id._id});

    // Fetch all attendance records for this student
    const allAttendanceRecords = await Attendance.find({ studentId });

    // Process attendance statistics
    const attendanceStats = {};
    allAttendanceRecords.forEach((record) => {
      const classId = record.classId.toString();
      if (!attendanceStats[classId]) {
        attendanceStats[classId] = { present: 0, total: 0 };
      }
      attendanceStats[classId].total++;
      if (record.status === "Present") {
        attendanceStats[classId].present++;
      }
    });

    // Construct final subject attendance list
    const subjectAttendance = allClasses.map((classInfo) => {
      const classId = classInfo._id.toString();
      const stats = attendanceStats[classId] || { present: 0, total: 0 };

      return {
        class_name: classInfo.class_name || "NA",
        class_code: classInfo.class_code || "NA",
        present_count: stats.present,
        total_count: stats.total,
        percentage:
          stats.total > 0
            ? ((stats.present / stats.total) * 100).toFixed(2)
            : "0.00",
      };
    });
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

    res.json({ subjectAttendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit attendance from faculty
app.post("/api/attendance", async (req, res) => {
  const { classId, attendanceData } = req.body;

<<<<<<< HEAD
  try {
    const attendanceRecords = Object.keys(attendanceData).map((studentId) => ({
      studentId,
      classId,
      status: attendanceData[studentId],
    }));
=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

    await Attendance.insertMany(attendanceRecords);

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

<<<<<<< HEAD
// API Endpoint for Yearly Changes
// app.post('/api/yearly-update', async (req, res) => {
//   try {
//     // Fetch all students
//     const students = await Student.find();

//     // Process each student
//     for (const student of students) {

//       const year = await Year.findById(student.year_id).exec();


//       if (!year) {
//         // Handle case where no year data is found
//         console.log(`No year data found for student: ${student.student_name}`);
//         continue;
//       }

//       const yearCode = year.year_code; 


//       if (yearCode >400) {
//         // Archive final year students
//         const archivedStudent = new ArchivedStudent({
//           student_id_no: student.student_id_no,
//           student_name: student.student_name,
//           password: student.password,
//           guardian_mail: student.guardian_mail,
//           section_id: student.section_id,
//           year_id: student.year_id
//           // archived_date will be auto-set
//         });

//         await archivedStudent.save();
//         await Student.findByIdAndDelete(student._id);
//       } else {

//         const year_dict = {
//           "1": "67379f9aa030fcad2b0d8190",
//           "2": "67379f9aa030fcad2b0d8191",
//           "3" : "67379f9aa030fcad2b0d8192",
//           "4" : "67379f9aa030fcad2b0d8193"
//         };

//         const section_dict = {
//           "101": "67379fb9a030fcad2b0d8194",
//           "102": "67379fb9a030fcad2b0d8195",
//           "103": "67379fb9a030fcad2b0d8196",
//           "104": "67379fb9a030fcad2b0d8197",
//           "201": "67379fb9a030fcad2b0d8198",
//           "202": "67379fb9a030fcad2b0d8199",
//           "203": "67a3a9bd9d6f2d735fdc63a5",
//           "204": "67a3a9e19d6f2d735fdc63a8",
//           "301": "67379fb9a030fcad2b0d819a",
//           "302": "67a3a99b9d6f2d735fdc63a3",
//           "303": "67a3a9cc9d6f2d735fdc63a6",
//           "304": "67a3a9ec9d6f2d735fdc63a9",
//           "401": "67a3a9839d6f2d735fdc63a2",
//           "402": "67a3a9a69d6f2d735fdc63a4",
//           "403": "67a3a9d79d6f2d735fdc63a7",
//           "404": "67a3a9f69d6f2d735fdc63aa"
//         };

//         const year = await Year.findById(student.year_id).exec();
//         const section = await section_dict.findById(student.section_id).exec();

//         if (!year) {
//           // Handle case where no year data is found
//           console.log(`No year data found for student: ${student.student_name}`);
//           continue;
//         }
  
//         const yearCode = year.year_code; 

//         if (!section) {
//           // Handle case where no year data is found
//           console.log(`No section data found for student: ${student.student_name}`);
//           continue;
//         }
  
//         const sectionCode = section.section_id_no; 


//         // Promote other students (auto-calculating new year_id & section_id)
//         const newYearId = year_dict[yearCode+1];
//         const newSectionId = section_dict[sectionCode+100];

//         await Student.findByIdAndUpdate(student._id, {
//           year_id: newYearId,
//           section_id: newSectionId
//         });
//       }
//     }

//     res.status(200).json({ message: 'Yearly update completed successfully.' });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'An error occurred during the yearly update.' });
//   }
//   res.status(200).json({ message: 'Yearly update completed successfully.' });
// });

// res.status(200).json({ message: 'Yearly update completed successfully.' });

const upload = multer({ dest: "uploads/" });


// File upload functionality

const processFileUpload = async (req, res, Model, formatData) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }
  try {
    console.log("Received file:", req.file);
    const fileData = fs.readFileSync(req.file.path, "utf8");
    const records = JSON.parse(fileData);

    const formattedData = records.map(formatData);
    if (formattedData.some(record => Object.values(record).includes(null))) {
      return res.status(400).json({ message: "Invalid ObjectId in data" });
    }
    

    await Model.insertMany(formattedData);
    res.json({ message: "Data added successfully" });
  } catch (error) {
    console.error("Error processing file:", error);
    res.status(500).json({ message: "Error inserting data", error: error.message });
  }
};

app.post("/api/upload-students", upload.single("file"), async (req, res,next) => {
  await processFileUpload(req, res, Student, student => ({
    student_id_no: student.student_id_no,
    password: student.password,
    student_name: student.student_name,
    section_id: mongoose.Types.ObjectId.isValid(student.section_id) ? new mongoose.Types.ObjectId(student.section_id) : null,
    year_id: mongoose.Types.ObjectId.isValid(student.year_id) ? new mongoose.Types.ObjectId(student.year_id) : null,
    guardian_mail: student.guardian_mail,
  }));
});

app.post("/api/upload-faculty", upload.single("file"), async (req, res,next) => {
  await processFileUpload(req, res, Faculty, faculty => ({
    faculty_name: faculty.faculty_name,
    password: faculty.password,
    email: faculty.email,
  }));
});

app.post("/api/upload-classes", upload.single("file"), async (req, res,next) => {
  await processFileUpload(req, res, Class, cls => ({
    class_name: cls.class_name,
    class_code: cls.class_code,
    section_id: mongoose.Types.ObjectId.isValid(cls.section_id) ? new mongoose.Types.ObjectId(cls.section_id) : null,
    faculty_id: mongoose.Types.ObjectId.isValid(cls.faculty_id) ? new mongoose.Types.ObjectId(cls.faculty_id) : null,
    year_id: mongoose.Types.ObjectId.isValid(cls.year_id) ? new mongoose.Types.ObjectId(cls.year_id) : null,
  }));
});

app.post("/api/upload-timetable", upload.single("file"), async (req, res,next) => {
  await processFileUpload(req, res, Timetable, timetable => ({
    section_id: mongoose.Types.ObjectId.isValid(timetable.section_id) ? new mongoose.Types.ObjectId(timetable.section_id) : null,
    class_id: mongoose.Types.ObjectId.isValid(timetable.class_id) ? new mongoose.Types.ObjectId(timetable.class_id) : null,
    faculty_id: mongoose.Types.ObjectId.isValid(timetable.faculty_id) ? new mongoose.Types.ObjectId(timetable.faculty_id) : null,
    day: timetable.day,
    duration: timetable.duration,
    start_time: timetable.start_time,
  }));
});




// changes are made here


  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });




=======
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
>>>>>>> daef7c5 (feat: Add Admin, Faculty, Student dashboards and authentication context)

app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
