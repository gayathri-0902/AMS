import React, { useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi"; 
import { 
  MdAdminPanelSettings, 
  MdSchool, 
  MdSupervisorAccount, 
  MdCastForEducation,
  MdEventNote,
  MdArrowForward
} from "react-icons/md";

function AdminDashboard() {
  const { logout } = useAuth();
  
  // --- Form States ---
  const [faculty, setFaculty] = useState({ name: "", email: "", password: "" });
  const [student, setStudent] = useState({
    name: "", roll_no: "", email: "", stream: "", yr: "", sem: "", academic_yr: "2022-26", password: "",
  });
  const [parent, setParent] = useState({ name: "", email: "", phno: "", password: "" });
  const [mapping, setMapping] = useState({ parent_email: "", student_roll_no: "", relationship: "Father" });

  // --- Handlers ---
  const handleFacultyChange = (e) => setFaculty({ ...faculty, [e.target.name]: e.target.value });
  const handleStudentChange = (e) => setStudent({ ...student, [e.target.name]: e.target.value });
  const handleParentChange = (e) => setParent({ ...parent, [e.target.name]: e.target.value });
  const handleMappingChange = (e) => setMapping({ ...mapping, [e.target.name]: e.target.value });

  // --- Submit Logic ---
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
      setStudent({ name: "", roll_no: "", email: "", stream: "", yr: "", sem: "", academic_yr: "2022-26", password: "" });
    } catch (err) { alert(err.response?.data?.message || "Error adding student"); }
  };

  const handleParentSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/parent`, parent);
      alert("Parent Added Successfully");
      setParent({ name: "", email: "", phno: "", password: "" });
    } catch (err) { alert(err.response?.data?.message || "Error adding parent"); }
  };

  const handleMappingSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/admin/mapping`, mapping);
      alert("Parent-Student Link Established");
      setMapping({ parent_email: "", student_roll_no: "", relationship: "Father" });
    } catch (err) { alert(err.response?.data?.message || "Error mapping accounts"); }
  };

  // Reusable Styling Constants
  const inputClass = "w-full px-4 py-3 bg-white border border-[#e2e8f0] rounded-xl text-[#2b2b2b] text-[16px] placeholder-[#94a3b8] focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all";
  const labelClass = "text-[20px] text-[#2b2b2b] mb-4 flex items-center gap-2";

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-8 font-antiqua">
      {/* HEADER */}
      <div className="max-w-7xl mx-auto flex justify-between items-center mb-10">
        <div className="flex items-center gap-3">
          <MdAdminPanelSettings size={36} className="text-[#3b82f6]" />
          <h2 className="text-[32px] text-[#2b2b2b]">
            Admin Management Dashboard
          </h2>
        </div>
        
        <button
          onClick={logout}
          className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm group"
        >
          <span className="text-[18px]">Logout</span>
          <HiOutlineLogout size={22} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Section: Add Faculty */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
          <h3 className={labelClass}><MdCastForEducation size={24} className="text-blue-500"/> Add Faculty Member</h3>
          <form onSubmit={handleFacultySubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Full Name" value={faculty.name} onChange={handleFacultyChange} className={inputClass} required />
            <input type="email" name="email" placeholder="Email Address" value={faculty.email} onChange={handleFacultyChange} className={inputClass} required />
            <input type="password" name="password" placeholder="System Password" value={faculty.password} onChange={handleFacultyChange} className={inputClass} required />
            <button type="submit" className="w-full bg-[#3b82f6] text-white py-3.5 rounded-xl text-[18px] hover:bg-[#2563eb] transition-all">
              Add Faculty
            </button>
          </form>
        </div>

        {/* Section: Add Student */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
          <h3 className={labelClass}><MdSchool size={24} className="text-green-600"/> Add New Student</h3>
          <form onSubmit={handleStudentSubmit} className="space-y-4">
            <input type="text" name="name" placeholder="Student Full Name" value={student.name} onChange={handleStudentChange} className={inputClass} required />
            <div className="grid grid-cols-2 gap-4">
              <input type="text" name="roll_no" placeholder="Roll Number" value={student.roll_no} onChange={handleStudentChange} className={inputClass} required />
              <input type="text" name="stream" placeholder="Stream (e.g. CSE)" value={student.stream} onChange={handleStudentChange} className={inputClass} required />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input type="number" name="yr" placeholder="Year" value={student.yr} onChange={handleStudentChange} className={inputClass} required />
              <input type="number" name="sem" placeholder="Sem" value={student.sem} onChange={handleStudentChange} className={inputClass} required />
              <input type="text" name="academic_yr" placeholder="Acad. Year" value={student.academic_yr} onChange={handleStudentChange} className={inputClass} required />
            </div>
            <input type="email" name="email" placeholder="Student Email" value={student.email} onChange={handleStudentChange} className={inputClass} required />
            <input type="password" name="password" placeholder="System Password" value={student.password} onChange={handleStudentChange} className={inputClass} required />
            <button type="submit" className="w-full bg-[#16a34a] text-white py-3.5 rounded-xl text-[18px] hover:bg-[#15803d] transition-all">
              Register Student
            </button>
          </form>
        </div>

        {/* Section: Add Parent */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
           <h3 className={labelClass}><MdSupervisorAccount size={24} className="text-purple-600"/> Add Parent Record</h3>
           <form onSubmit={handleParentSubmit} className="space-y-4">
             <input type="text" name="name" placeholder="Parent Full Name" value={parent.name} onChange={handleParentChange} className={inputClass} required />
             <input type="text" name="phno" placeholder="Mobile Number" value={parent.phno} onChange={handleParentChange} className={inputClass} required />
             <input type="email" name="email" placeholder="Registered Email" value={parent.email} onChange={handleParentChange} className={inputClass} required />
             <input type="password" name="password" placeholder="System Password" value={parent.password} onChange={handleParentChange} className={inputClass} required />
             <button type="submit" className="w-full bg-[#9333ea] text-white py-3.5 rounded-xl text-[18px] hover:bg-[#7e22ce] transition-all">
               Create Parent Account
             </button>
           </form>
        </div>

        {/* Section: Link Parent */}
        <div className="bg-white p-8 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white">
           <h3 className={labelClass}><MdSupervisorAccount size={24} className="text-indigo-600"/> Link Parent To Student</h3>
           <form onSubmit={handleMappingSubmit} className="space-y-4">
             <input type="email" name="parent_email" placeholder="Parent Email" value={mapping.parent_email} onChange={handleMappingChange} className={inputClass} required />
             <input type="text" name="student_roll_no" placeholder="Student Roll Number" value={mapping.student_roll_no} onChange={handleMappingChange} className={inputClass} required />
             <select name="relationship" value={mapping.relationship} onChange={handleMappingChange} className={inputClass}>
               <option value="Father">Father</option>
               <option value="Mother">Mother</option>
               <option value="Guardian">Guardian</option>
             </select>
             <button type="submit" className="w-full bg-[#4f46e5] text-white py-3.5 rounded-xl text-[18px] hover:bg-[#4338ca] transition-all">
               Link Accounts
             </button>
           </form>
        </div>

        {/* Section: Manage Schedules Button */}
        <div className="bg-white p-10 rounded-[24px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] border border-white md:col-span-2 flex flex-col items-center justify-center space-y-6">
          <div className="bg-blue-50 p-4 rounded-full">
            <MdEventNote size={48} className="text-blue-600"/>
          </div>
          <div className="text-center">
            <h3 className="text-[24px] font-bold text-[#2b2b2b]">Academic Timetables</h3>
            <p className="text-[#94a3b8] mt-2 max-w-md">Configure class timings, assign faculty to rooms, and manage the university's weekly schedule.</p>
          </div>
          <button 
            onClick={() => alert("Redirecting to Schedule Management...")}
            className="group flex items-center gap-3 bg-[#3b82f6] text-white px-10 py-4 rounded-2xl text-[20px] font-semibold hover:bg-[#2563eb] transition-all shadow-lg hover:shadow-blue-200"
          >
            Manage Schedules
            <MdArrowForward size={24} className="group-hover:translate-x-2 transition-transform" />
          </button>
        </div>

      </div>
      
      <footer className="max-w-7xl mx-auto mt-12 mb-8 text-center text-[16px] text-[#94a3b8] italic">
        © 2026 Campus Management System
      </footer>
    </div>
  );
}

export default AdminDashboard;