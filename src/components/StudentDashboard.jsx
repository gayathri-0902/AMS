import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineCalendar, 
  HiOutlineClipboardCheck, 
  HiOutlineBookOpen, 
  HiOutlineArrowRight,
  HiOutlineLogout,
  HiOutlineUser,
  HiOutlineSparkles 
} from "react-icons/hi";

// The component now accepts 'overrideId' passed from App.jsx for Parent views
const StudentDashboard = ({ overrideId }) => {
  const { auth, logout } = useAuth();
  const { studentId: urlStudentId } = useParams(); // Get ID from URL if available
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null); 
  const [loading, setLoading] = useState(true);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    let [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = (h >= 12) ? 'PM' : 'AM';
    let displayHours = h % 12 || 12; 
    return `${displayHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // LOGIC: Use overrideId (prop), then urlStudentId (URL), then auth.studentId (Login)
        const targetId = overrideId || urlStudentId || auth?.studentId;
        
        if (!targetId) {
          console.error("No Student ID found");
          setLoading(false);
          return;
        }

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/student-dashboard/${targetId}`
        );
        setTimetable(response.data.timetableData || []);
        setStudentInfo(response.data.studentDetails || response.data.student || null);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [auth?.studentId, urlStudentId, overrideId]);

  const getAcademicYear = (rollNo) => {
    if (!rollNo || typeof rollNo !== 'string') return "";
    
    const joinYear = parseInt(rollNo.substring(0, 2));
    const now = new Date();
    const currentYear = now.getFullYear(); // 2026
    const currentMonth = now.getMonth();    // 0 = Jan, 1 = Feb... 5 = June

    // Strict Graduation Logic:
    if (currentYear > 2026 || (currentYear === 2026 && currentMonth >= 5)) {
      return "ALUMNI";
    }

    const yearDiff = 26 - joinYear; // Based on 2026 baseline
    const labels = { 
      0: "1ST YEAR", 
      1: "2ND YEAR", 
      2: "3RD YEAR", 
      3: "4TH YEAR" 
    };

    return labels[yearDiff] || "ALUMNI";
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center font-antiqua">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-10">
          
          {/* LEFT: Student Info */}
          <div className="flex items-center space-x-4 p-2">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 leading-none tracking-tight">
                {studentInfo?.student_id_no}
              </h2>
              <p className="text-sm font-bold text-blue-600 uppercase mt-1 tracking-widest">
                {studentInfo?.branch_name} • {getAcademicYear(studentInfo?.student_id_no)}
              </p>
            </div>
          </div>

          {/* RIGHT: Logout Button */}
          <button 
            onClick={logout}
            className="flex items-center space-x-2 bg-white border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
          >
            <span>LOGOUT</span>
            <HiOutlineLogout className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Title */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">Student Dashboard</h1>
          <p className="text-xl text-gray-500 mt-1">
            Welcome back, <span className="text-blue-600 font-bold">{studentInfo?.student_name}</span>
          </p>
        </div>

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {timetable.map((course, index) => (
            <div key={index} className="bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-gray-100 group">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <HiOutlineBookOpen className="w-8 h-8" />
                </div>
                <span className="bg-gray-100 text-gray-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest">
                  Not Marked
                </span>
              </div>

              <h3 className="text-2xl font-bold text-gray-800 mb-1">{course.class_name}</h3>
              <span className="bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1 rounded-lg uppercase">
                {course.class_code}
              </span>

              <div className="mt-8 space-y-4 text-gray-600">
                <div className="flex items-center space-x-3">
                  <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                  <div>
                    <p className="font-bold text-gray-800">{course.day}</p>
                    <p className="text-xs text-gray-400">{formatTime(course.start_time)} - {formatTime(course.end_time)}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <HiOutlineClipboardCheck className="w-5 h-5 text-gray-400" />
                  <p className="text-sm">Faculty: <span className="font-bold text-gray-800">{course.faculty_name}</span></p>
                </div>
              </div>

              <button 
                onClick={() => navigate(`/student/subject-details/${course.subject_offering_id}`)}
                className="w-full mt-10 bg-[#1e293b] text-white py-4 rounded-2xl font-bold flex items-center justify-center hover:bg-blue-600 transition-all shadow-lg"
              >
                VIEW COURSE DETAILS <HiOutlineArrowRight className="ml-2 w-5 h-5" />
              </button>
            </div>
          ))}
        </div>

        {/* Floating Academic AI Button */}
        <button 
          onClick={() => alert("Academic AI is launching in June 2026!")}
          className="fixed bottom-10 right-10 flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all z-[1000] border-4 border-white"
        >
          <HiOutlineSparkles className="w-6 h-6" />
          <span className="text-lg">Academic AI</span>
        </button>

      </div>
    </div>
  );
};

export default StudentDashboard;