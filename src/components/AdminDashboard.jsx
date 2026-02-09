import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
// Added HiOutlineLogout to match student dashboard style
import { HiOutlineLogout } from "react-icons/hi"; 
import { 
  MdAdminPanelSettings, 
  MdSchool, 
  MdSupervisorAccount, 
  MdCastForEducation,
  MdEventNote
} from "react-icons/md";

function AdminDashboard() {
  const { logout } = useAuth();
  
  // --- Form States (Kept identical to your logic) ---
  const [faculty, setFaculty] = useState({ name: "", email: "", password: "" });
  const [student, setStudent] = useState({
    name: "", roll_no: "", email: "", stream: "", yr: "", sem: "", academic_yr: "2022-26", password: "",
  });
  const [parent, setParent] = useState({ name: "", email: "", phno: "", password: "" });
  const [mapping, setMapping] = useState({ parent_email: "", student_roll_no: "", relationship: "Father" });
  const [schedule, setSchedule] = useState({
    course_code: "", faculty_email: "", stream: "", yr: "", sem: "", day: "", start_time: "", end_time: "", location: "Room 101", session_no: 1,
  });

  // --- Handlers & Submits (Kept identical to your logic) ---
  const handleFacultyChange = (e) => setFaculty({ ...faculty, [e.target.name]: e.target.value });
  const handleStudentChange = (e) => setStudent({ ...student, [e.target.name]: e.target.value });
  const handleParentChange = (e) => setParent({ ...parent, [e.target.name]: e.target.value });
  const handleMappingChange = (e) => setMapping({ ...mapping, [e.target.name]: e.target.value });
  const handleScheduleChange = (e) => setSchedule({ ...schedule, [e.target.name]: e.target.value });

  const handleFacultySubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/faculty`, faculty);
      alert("Faculty Added Successfully");
      setFaculty({ name: "", email: "", password: "" });
    } catch (error) { alert(error.response?.data?.message || "Error adding faculty"); }
  };

  const handleStudentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/student`, student);
      alert("Student Added Successfully");
      setStudent({ name: "", roll_no: "", email: "", stream: "", yr: "", sem: "", academic_yr: "2025-26", password: "" });
    } catch (err) { alert(err.response?.data?.message || "Error adding student"); }
  };

  // Reusable Styling Constants
  const inputClass = "w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[#2b2b2b] text-[16px] font-normal placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all font-serif";
  const labelClass = "text-[19px] font-normal text-[#2b2b2b] mb-4 flex items-center gap-2 font-serif";

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-8 font-serif">
      {/* HEADER: Matches Student Dashboard Layout */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <MdAdminPanelSettings size={32} className="text-[#3b82f6]" />
          <h2 className="text-[28px] font-normal text-[#2b2b2b]">
            Admin Management Dashboard
          </h2>
        </div>
        
        {/* LOGOUT BUTTON: Specifically styled to match student view */}
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-white border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 font-normal shadow-sm group"
        >
          <span className="text-[16px]">Logout</span>
          <HiOutlineLogout size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section: Add Faculty */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
          <h3 className={labelClass}><MdCastForEducation className="text-blue-500"/> Add Faculty Member</h3>
          <form onSubmit={handleFacultySubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Full Name" value={faculty.name} onChange={handleFacultyChange} className={inputClass} required />
            <input type="email" name="email" placeholder="Email Address" value={faculty.email} onChange={handleFacultyChange} className={inputClass} required />
            <input type="password" name="password" placeholder="System Password" value={faculty.password} onChange={handleFacultyChange} className={inputClass} required />
            <button type="submit" className="w-full bg-[#3b82f6] text-white py-3.5 rounded-xl font-normal text-[17px] hover:bg-[#2563eb] transition-all">
              Add Faculty
            </button>
          </form>
        </div>

        {/* Section: Add Student */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
          <h3 className={labelClass}><MdSchool className="text-green-600"/> Add New Student</h3>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Student Full Name" value={student.name} onChange={handleStudentChange} className={inputClass} required />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="roll_no" placeholder="Roll Number" value={student.roll_no} onChange={handleStudentChange} className={inputClass} required />
              <input type="text" name="stream" placeholder="Stream (e.g. CSE)" value={student.stream} onChange={handleStudentChange} className={inputClass} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input type="number" name="yr" placeholder="Year" value={student.yr} onChange={handleStudentChange} className={inputClass} required />
              <input type="number" name="sem" placeholder="Semester" value={student.sem} onChange={handleStudentChange} className={inputClass} required />
              <input type="text" name="academic_yr" placeholder="Acad. Year" value={student.academic_yr} onChange={handleStudentChange} className={inputClass} required />
            </div>
            <input type="email" name="email" placeholder="Student Email" value={student.email} onChange={handleStudentChange} className={inputClass} required />
            <input type="password" name="password" placeholder="System Password" value={student.password} onChange={handleStudentChange} className={inputClass} required />
            <button type="submit" className="w-full bg-[#16a34a] text-white py-3.5 rounded-xl font-normal text-[17px] hover:bg-[#15803d] transition-all">
              Register Student
            </button>
          </form>
        </div>

        {/* Section: Add Parent */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
           <h3 className={labelClass}><MdSupervisorAccount className="text-purple-600"/> Add Parent Record</h3>
           <form className="space-y-4">
             <input type="text" placeholder="Parent Full Name" className={inputClass} required />
             <input type="text" placeholder="Mobile Number" className={inputClass} required />
             <input type="email" placeholder="Registered Email" className={inputClass} required />
             <input type="password" placeholder="System Password" className={inputClass} required />
             <button type="submit" className="w-full bg-[#9333ea] text-white py-3.5 rounded-xl font-normal text-[17px] hover:bg-[#7e22ce] transition-all">
               Create Parent Account
             </button>
           </form>
        </div>

        {/* Section: Link Parent */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
           <h3 className={labelClass}><MdSupervisorAccount className="text-indigo-600"/> Link Parent To Student</h3>
           <form className="space-y-4">
             <input type="email" placeholder="Parent Email" className={inputClass} required />
             <input type="text" placeholder="Student Roll Number" className={inputClass} required />
             <select className={inputClass}>
               <option value="Father">Father</option>
               <option value="Mother">Mother</option>
               <option value="Guardian">Guardian</option>
             </select>
             <button type="submit" className="w-full bg-[#4f46e5] text-white py-3.5 rounded-xl font-normal text-[17px] hover:bg-[#4338ca] transition-all">
               Link Accounts
             </button>
           </form>
        </div>

        {/* Section: Schedule (Span 2 columns) */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white md:col-span-2">
          <h3 className={labelClass}><MdEventNote className="text-yellow-600"/> Academic Class Schedule</h3>
          <form className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <input type="text" placeholder="Course Code (e.g. CS101)" className={inputClass} required />
             <input type="email" placeholder="Faculty Email Address" className={inputClass} required />
             <div className="grid grid-cols-3 gap-4">
                 <input type="text" placeholder="Stream" className={inputClass} required />
                 <input type="number" placeholder="Year" className={inputClass} required />
                 <input type="number" placeholder="Sem" className={inputClass} required />
             </div>
             <div className="grid grid-cols-2 gap-4">
                 <select className={inputClass} required>
                  <option value="">Select Day</option>
                  <option value="Mon">Monday</option>
                  <option value="Tue">Tuesday</option>
                </select>
                <input type="number" placeholder="Session Number" className={inputClass} required />
             </div>
             <div className="grid grid-cols-2 gap-4">
                <input type="time" className={inputClass} required />
                <input type="time" className={inputClass} required />
             </div>
             <input type="text" placeholder="Location (e.g. Room 101)" className={inputClass} required />
            <div className="md:col-span-2 mt-2">
              <button type="submit" className="w-full bg-[#eab308] text-white py-4 rounded-xl font-normal text-[18px] hover:bg-[#ca8a04] transition-all">
                Create Schedule Entry
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <footer className="max-w-7xl mx-auto mt-12 mb-8 text-center text-[15px] text-[#94a3b8] font-normal italic">
        © 2026 Campus Management System
      </footer>
    </div>
  );
}

export default AdminDashboard;