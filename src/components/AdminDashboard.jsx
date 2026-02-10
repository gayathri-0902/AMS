import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Navigate } from "react-router-dom";
// import { HiOutlineLogout } from "react-icons/hi"; // Icons not installed, using text

function AdminDashboard() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  
  // Faculty Form State
  const [faculty, setFaculty] = useState({
    name: "",
    email: "",
    password: "",
  });

  // Student Form State
  const [student, setStudent] = useState({
    name: "",
    roll_no: "",
    email: "",
    stream: "",
    yr: "",
    sem: "",
    academic_yr: "2022-26",
    password: "",
  });

  // Parent Form State
  const [parent, setParent] = useState({
    name: "",
    email: "",
    phno: "",
    password: "",
  });

  // Parent Mapping State
  const [mapping, setMapping] = useState({
    parent_email: "",
    student_roll_no: "",
    relationship: "Father",
  });

  // Schedule Form State
  const [schedule, setSchedule] = useState({
    course_code: "",
    faculty_email: "",
    stream: "",
    yr: "",
    sem: "",
    day: "",
    start_time: "",
    end_time: "",
    location: "Room 101",
    session_no: 1,
  });

  // Handlers
  const handleFacultyChange = (e) => {
    setFaculty({ ...faculty, [e.target.name]: e.target.value });
  };

  const handleStudentChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const handleParentChange = (e) => {
    setParent({ ...parent, [e.target.name]: e.target.value });
  };

  const handleMappingChange = (e) => {
    setMapping({ ...mapping, [e.target.name]: e.target.value });
  };

  const handleScheduleChange = (e) => {
    setSchedule({ ...schedule, [e.target.name]: e.target.value });
  };

  // Submit Handlers
  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/faculty`, faculty);
      alert("Faculty added successfully");
      setFaculty({ name: "", email: "", password: "" });
    } catch (error) {
      console.error("Error adding faculty:", error);
      alert(error.response?.data?.message || "Error adding faculty");
    }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/student`, student);
      alert("Student added successfully");
      setStudent({
        name: "",
        roll_no: "",
        email: "",
        stream: "",
        yr: "",
        sem: "",
        academic_yr: "2025-26",
        password: "",
      });
    } catch (err) {
      console.error("Error adding student:", err);
      alert(err.response?.data?.message || "Error adding student");
    }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/parent`, parent);
      alert("Parent added successfully");
      setParent({ name: "", email: "", phno: "", password: "" });
    } catch (err) {
      console.error("Error adding parent:", err);
      alert(err.response?.data?.message || "Error adding parent");
    }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/parent/map`, mapping);
      alert("Parent linked to student successfully");
      setMapping({ parent_email: "", student_roll_no: "", relationship: "Father" });
    } catch (err) {
      console.error("Error mapping parent:", err);
      alert(err.response?.data?.message || "Error mapping parent");
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/schedule`, schedule);
      alert("Schedule added successfully");
      setSchedule({
        course_code: "",
        faculty_email: "",
        stream: "",
        yr: "",
        sem: "",
        day: "",
        start_time: "",
        end_time: "",
        location: "Room 101",
        session_no: 1,
      });
    } catch (err) {
      console.error("Error adding schedule:", err);
      alert(err.response?.data?.message || "Error adding schedule");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-3xl font-bold text-blue-600">Admin Dashboard</h2>

        <button
            onClick={() => navigate("/admin/timetable")}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition"
          >
          Add Timetable
          </button>
        
        <button
           onClick={logout}
           className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Add Faculty */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Add Faculty</h3>
          <form onSubmit={handleFacultySubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Faculty Name"
              value={faculty.name}
              onChange={handleFacultyChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <input
              type="email"
              name="email"
              placeholder="Faculty Email (Username)"
              value={faculty.email}
              onChange={handleFacultyChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={faculty.password}
              onChange={handleFacultyChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
            >
              Add Faculty
            </button>
          </form>
        </div>

        {/* Add Student */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Add Student</h3>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <input
              type="text"
              name="name"
              placeholder="Student Name"
              value={student.name}
              onChange={handleStudentChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <div className="flex gap-4">
              <input
                type="text"
                name="roll_no"
                placeholder="Roll No"
                value={student.roll_no}
                onChange={handleStudentChange}
                className="w-1/2 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
               <input
                type="text"
                name="stream"
                placeholder="Stream (CSE)"
                value={student.stream}
                onChange={handleStudentChange}
                className="w-1/2 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
            </div>
            <div className="flex gap-4">
               <input
                type="number"
                name="yr"
                placeholder="Year"
                value={student.yr}
                onChange={handleStudentChange}
                className="w-1/3 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
               <input
                type="number"
                name="sem"
                placeholder="Sem"
                value={student.sem}
                onChange={handleStudentChange}
                className="w-1/3 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
               <input
                type="text"
                name="academic_yr"
                placeholder="Acad. Yr"
                value={student.academic_yr}
                onChange={handleStudentChange}
                className="w-1/3 p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
                required
              />
            </div>

            <input
              type="email"
              name="email"
              placeholder="Student Email"
              value={student.email}
              onChange={handleStudentChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={student.password}
              onChange={handleStudentChange}
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
            >
              Add Student
            </button>
          </form>
        </div>

        {/* Add Parent */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold mb-4 border-b pb-2">Add Parent</h3>
           <form onSubmit={handleParentSubmit} className="space-y-4">
             <input
               type="text"
               name="name"
               placeholder="Parent Name"
               value={parent.name}
               onChange={handleParentChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <input
               type="text"
               name="phno"
               placeholder="Phone Number"
               value={parent.phno}
               onChange={handleParentChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <input
               type="email"
               name="email"
               placeholder="Parent Email"
               value={parent.email}
               onChange={handleParentChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <input
               type="password"
               name="password"
               placeholder="Password"
               value={parent.password}
               onChange={handleParentChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <button
               type="submit"
               className="w-full bg-purple-600 text-white py-2 rounded hover:bg-purple-700 transition"
             >
               Add Parent
             </button>
           </form>
        </div>

        {/* Map Parent to Student */}
        <div className="bg-white p-6 rounded-lg shadow-md">
           <h3 className="text-xl font-semibold mb-4 border-b pb-2">Link Parent to Student</h3>
           <form onSubmit={handleMappingSubmit} className="space-y-4">
             <input
               type="email"
               name="parent_email"
               placeholder="Parent Email"
               value={mapping.parent_email}
               onChange={handleMappingChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <input
               type="text"
               name="student_roll_no"
               placeholder="Student Roll No"
               value={mapping.student_roll_no}
               onChange={handleMappingChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
               required
             />
             <select
               name="relationship"
               value={mapping.relationship}
               onChange={handleMappingChange}
               className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
             >
               <option value="Father">Father</option>
               <option value="Mother">Mother</option>
               <option value="Guardian">Guardian</option>
             </select>
             <button
               type="submit"
               className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition"
             >
               Link Parent
             </button>
           </form>
        </div>

        {/* Add Schedule */}
        <div className="bg-white p-6 rounded-lg shadow-md md:col-span-2">
          <h3 className="text-xl font-semibold mb-4 border-b pb-2">Add Class Schedule (TimeTable)</h3>
          <form onSubmit={handleScheduleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input
              type="text"
              name="course_code"
              placeholder="Course Code (e.g. CS101)"
              value={schedule.course_code}
              onChange={handleScheduleChange}
              className="p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
             <input
              type="email"
              name="faculty_email"
              placeholder="Faculty Email"
              value={schedule.faculty_email}
              onChange={handleScheduleChange}
              className="p-2 border border-gray-300 rounded focus:border-blue-500 outline-none"
              required
            />
             <div className="flex gap-2">
                 <input
                  type="text"
                  name="stream"
                  placeholder="Stream"
                  value={schedule.stream}
                  onChange={handleScheduleChange}
                  className="w-1/3 p-2 border border-gray-300 rounded"
                  required
                />
                 <input
                  type="number"
                  name="yr"
                  placeholder="Yr"
                  value={schedule.yr}
                  onChange={handleScheduleChange}
                  className="w-1/3 p-2 border border-gray-300 rounded"
                  required
                />
                 <input
                  type="number"
                  name="sem"
                  placeholder="Sem"
                  value={schedule.sem}
                  onChange={handleScheduleChange}
                  className="w-1/3 p-2 border border-gray-300 rounded"
                  required
                />
             </div>
             
             <div className="flex gap-2">
                 <select
                  name="day"
                  value={schedule.day}
                  onChange={handleScheduleChange}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                  required
                >
                  <option value="">Select Day</option>
                  <option value="Mon">Mon</option>
                  <option value="Tue">Tue</option>
                  <option value="Wed">Wed</option>
                  <option value="Thu">Thu</option>
                  <option value="Fri">Fri</option>
                  <option value="Sat">Sat</option>
                  <option value="Sun">Sun</option>
                </select>
                
                 <input
                  type="number"
                  name="session_no"
                  placeholder="Session #"
                  value={schedule.session_no}
                  onChange={handleScheduleChange}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                  required
                />
             </div>

             <div className="flex gap-2">
                 <input
                  type="time"
                  name="start_time"
                  value={schedule.start_time}
                  onChange={handleScheduleChange}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                  required
                />
                 <input
                  type="time"
                  name="end_time"
                  value={schedule.end_time}
                  onChange={handleScheduleChange}
                  className="w-1/2 p-2 border border-gray-300 rounded"
                  required
                />
             </div>
             <input
                type="text"
                name="location"
                placeholder="Location (e.g. Room 101)"
                value={schedule.location}
                onChange={handleScheduleChange}
                className="p-2 border border-gray-300 rounded"
                required
              />

            <div className="md:col-span-2">
              <button
                type="submit"
                className="w-full bg-yellow-500 text-white py-2 rounded hover:bg-yellow-600 transition"
              >
                Create Schedule Entry
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
