const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

const fs = require('fs');
const multer = require("multer");
const path=require("path");

const { Schema, model, Types } = mongoose;


dotenv.config();
const app = express();
const MONGO_URI = process.env.MONGO_URI;

app.use(
  cors({
    origin: ["http://localhost:5173","https://ams-dx9j.onrender.com"],
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


//mongoose.connect(MONGO_URI, {
//  useNewUrlParser: true,
//  useUnifiedTopology: true,
//}).then(async () => {
//  console.log("Connected to MongoDB");;

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
  { collection: "faculty" }
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
  { collection: "student" }
);
const Student = mongoose.model("Student", StudentSchema);

const SectionSchema = new mongoose.Schema(
  {
    section_id_no: Number,
    section_name: String,
  },
  { collection: "section" }
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
  { collection: "classes" }
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
  { collection: "timetable" }
);

const Timetable = mongoose.model("Timetable", TimetableSchema);

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "Student" },
    classId: { type: mongoose.Schema.Types.ObjectId, ref: "Class" },
    status: String,
    date: { type: Date, default: Date.now },
  },
  { collection: "attendance" }
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
    }

    const responseData = {
      message: `${
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
    }

    return res.status(200).json(responseData);
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Server error" });
  }
});

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

    if (!timetableEntries.length) {
      return res
        .status(200)
        .json({ message: "No classes found for this faculty on this day." });
    }

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
    const students = await Student.find({ section_id: sectionId }).select(
      "student_name student_id_no"
    );

    if (!students || students.length === 0) {
      return res
        .status(404)
        .json({ message: "No students found in this section." });
    }

    students.sort((a, b) => a.student_id_no.localeCompare(b.student_id_no));

    res.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Fetch student for student dashboard
app.get("/api/student-dashboard/:studentId", async (req, res) => {
  const { studentId } = req.params;

  try {
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
      .populate("faculty_id");

    if (!timetableEntries.length) {
      return res.json({ timetableData: [] });
    }

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
    // Fetch all subjects (classes) in the system
    const allClasses = await Class.find();

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

    res.json({ subjectAttendance });
  } catch (error) {
    console.error("Error fetching attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// Submit attendance from faculty
app.post("/api/attendance", async (req, res) => {
  const { classId, attendanceData } = req.body;

  try {
    const attendanceRecords = Object.keys(attendanceData).map((studentId) => ({
      studentId,
      classId,
      status: attendanceData[studentId],
    }));

    await Attendance.insertMany(attendanceRecords);

    res.status(200).json({ message: "Attendance marked successfully" });
  } catch (error) {
    console.error("Error marking attendance:", error);
    res.status(500).json({ message: "Server error" });
  }
});

// API Endpoint for Yearly Changes
app.post('/api/yearly-update', async (req, res) => {
  try {
    // Fetch all students
    const students = await Student.find();

    // Process each student
    for (const student of students) {

      const year = await Year.findById(student.year_id).exec();


      if (!year) {
        // Handle case where no year data is found
        console.log(`No year data found for student: ${student.student_name}`);
        continue;
      }

      const yearCode = year.year_code; 


      if (yearCode >400) {
        // Archive final year students
        const archivedStudent = new ArchivedStudent({
          student_id_no: student.student_id_no,
          student_name: student.student_name,
          password: student.password,
          guardian_mail: student.guardian_mail,
          section_id: student.section_id,
          year_id: student.year_id
          // archived_date will be auto-set
        });

        await archivedStudent.save();
        await Student.findByIdAndDelete(student._id);
      } else {

        const year_dict = {
          "1": "67379f9aa030fcad2b0d8190",
          "2": "67379f9aa030fcad2b0d8191",
          "3" : "67379f9aa030fcad2b0d8192",
          "4" : "67379f9aa030fcad2b0d8193"
        };

        const section_dict = {
          "101": "67379fb9a030fcad2b0d8194",
          "102": "67379fb9a030fcad2b0d8195",
          "103": "67379fb9a030fcad2b0d8196",
          "104": "67379fb9a030fcad2b0d8197",
          "201": "67379fb9a030fcad2b0d8198",
          "202": "67379fb9a030fcad2b0d8199",
          "203": "67a3a9bd9d6f2d735fdc63a5",
          "204": "67a3a9e19d6f2d735fdc63a8",
          "301": "67379fb9a030fcad2b0d819a",
          "302": "67a3a99b9d6f2d735fdc63a3",
          "303": "67a3a9cc9d6f2d735fdc63a6",
          "304": "67a3a9ec9d6f2d735fdc63a9",
          "401": "67a3a9839d6f2d735fdc63a2",
          "402": "67a3a9a69d6f2d735fdc63a4",
          "403": "67a3a9d79d6f2d735fdc63a7",
          "404": "67a3a9f69d6f2d735fdc63aa"
        };

        const year = await Year.findById(student.year_id).exec();
        const section = await section_dict.findById(student.section_id).exec();

        if (!year) {
          // Handle case where no year data is found
          console.log(`No year data found for student: ${student.student_name}`);
          continue;
        }
  
        const yearCode = year.year_code; 

        if (!section) {
          // Handle case where no year data is found
          console.log(`No section data found for student: ${student.student_name}`);
          continue;
        }
  
        const sectionCode = section.section_id_no; 


        // Promote other students (auto-calculating new year_id & section_id)
        const newYearId = year_dict[yearCode+1];
        const newSectionId = section_dict[sectionCode+100];

        await Student.findByIdAndUpdate(student._id, {
          year_id: newYearId,
          section_id: newSectionId
        });
      }
    }

    res.status(200).json({ message: 'Yearly update completed successfully.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'An error occurred during the yearly update.' });
  }
  res.status(200).json({ message: 'Yearly update completed successfully.' });
});

// res.status(200).json({ message: 'Yearly update completed successfully.' });

const upload = multer({ dest: "uploads/" });


// load students 
app.post("/api/upload-students", async (req, res) => {
  console.log("Received request at /api/upload-students");
  res.status(200).json({ message: "File uploaded successfully" });
  console.log("Received file:", req.file);  // Debugging line
  
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  

  try {
    // Read JSON file
    const data = JSON.parse(req.file.buffer.toString("utf8"));

    console.log("Parsed Data:", data); // Debugging line

    // Convert section_id and year_id to ObjectIDs
    const formattedData = data.map(student => ({
      ...student,
      // section_id: new mongoose.ObjectId(student.section_id),
      // year_id: new mongoose.ObjectId(student.year_id),
      section_id: isValidObjectId(student.section_id) ? new mongoose.ObjectId(student.section_id) : null,
      year_id: isValidObjectId(student.year_id) ? new mongoose.ObjectId(student.year_id) : null,
    }));

    if (formattedData.some(student => student.section_id === null || student.year_id === null)) {
      return res.status(400).json({ message: "Invalid ObjectId in section_id or year_id" });
    }

    // Insert into MongoDB using Mongoose
    await Student.insertMany(formattedData);

    res.json({ message: "Students added successfully" });
  } catch (error) {
    console.error("Error processing file:", error); // Debugging line
    res.status(500).json({ message: "Error inserting data", error: error.message });
  }
});


// changes are made here


  app.use(express.static(path.join(__dirname, 'dist')));
  
  // Handle React routing, return all requests to React app
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });





app.listen(3001, () => {
  console.log("Server is running on port 3001");
});
