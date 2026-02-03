import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { 
  HiOutlineCalendar, 
  HiOutlineClipboardCheck, 
  HiOutlineBookOpen, 
  HiOutlineArrowRight,
  HiOutlineLogout,
  HiOutlineUser
} from "react-icons/hi";

const StudentDashboard = () => {
  const { auth, logout } = useAuth();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null); 
  const [loading, setLoading] = useState(true);

  // --- CORRECTED TIME FORMATTING LOGIC ---
  const formatTime = (timeString) => {
    if (!timeString) return "";
    
    let [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    
    /** * FIX: If the hour is between 1 and 7, it's an afternoon class (PM).
     * If it's 12 or higher (13, 14, etc.), it's also PM.
     */
    const ampm = (h >= 12 || (h >= 1 && h <= 7)) ? 'PM' : 'AM';
    
    // Convert to 12-hour display format
    let displayHours = h % 12;
    displayHours = displayHours ? displayHours : 12; 
    
    return `${displayHours}:${minutes} ${ampm}`;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/student-dashboard/${auth.studentId}`
        );
        
        console.log("Dashboard Data:", response.data);

        setTimetable(response.data.timetableData || []);
        const profile = response.data.studentDetails || response.data.student || null;
        setStudentInfo(profile);
        
      } catch (error) {
        console.error("Error fetching student dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    if (auth.studentId) {
      fetchDashboardData();
    }
  }, [auth.studentId]);

  const getAcademicYear = (rollNo) => {
    if (!rollNo || typeof rollNo !== 'string') return "";
    const joinYear = parseInt(rollNo.substring(0, 2));
    const currentYearShort = 26; 
    const diff = currentYearShort - joinYear;

    const labels = {
      1: "1st year",
      2: "2nd year",
      3: "3rd year",
      4: "4th year"
    };

    return labels[diff] || "";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-lg font-bold text-blue-600 animate-pulse">Syncing Academic Profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER (CLEANED - NO TABLE GROUPING) --- */}
        <header className="flex justify-between items-center mb-10 py-2">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
              <HiOutlineUser className="w-7 h-7" />
            </div>
            
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-none">
                {studentInfo?.student_id_no || "Roll No Not Found"}
              </span>
              <span className="text-xs font-semibold text-blue-600 uppercase tracking-wide mt-1">
                {studentInfo?.branch_name || "Branch"} • {getAcademicYear(studentInfo?.student_id_no)}
              </span>
            </div>
          </div>

          <button 
            onClick={logout}
            className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition-all border border-red-100 uppercase"
          >
            <span>LOGOUT</span>
            <HiOutlineLogout className="w-4 h-4" />
          </button>
        </header>

        {/* Welcome Section */}
        <div className="mb-8 px-2">
          <h1 className="text-2xl font-black text-gray-800">Student Dashboard</h1>
          <p className="text-gray-500 font-medium">
            Welcome back, <span className="text-blue-600 font-bold">{studentInfo?.student_name || "Student"}</span>
          </p>
        </div>

        {/* Timetable Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {timetable.length > 0 ? (
            timetable.map((course, index) => (
              <div 
                key={index} 
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 relative hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="bg-blue-50 w-11 h-11 rounded-xl flex items-center justify-center text-blue-600">
                    <HiOutlineBookOpen className="w-6 h-6" />
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    course.attendance_status === "Present" 
                      ? "bg-green-100 text-green-700" 
                      : course.attendance_status === "Absent" 
                      ? "bg-red-100 text-red-700" 
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    {course.attendance_status || "Not Marked"}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-gray-800 leading-tight">{course.class_name}</h3>
                <span className="inline-block mt-1 bg-blue-50 text-blue-600 text-[10px] font-bold px-2 py-1 rounded uppercase">
                  {course.class_code}
                </span>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center space-x-3">
                    <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-gray-700 leading-none">{course.day}</span>
                      <span className="text-[11px] text-gray-400 mt-1 font-semibold italic">
                        {formatTime(course.start_time)} - {formatTime(course.end_time)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <HiOutlineClipboardCheck className="w-5 h-5 text-gray-400" />
                    <span className="text-sm font-bold text-gray-600 truncate">
                      Faculty: {course.faculty_name}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => navigate(`/student/subject-details/${course.subject_offering_id}`)}
                  className="w-full mt-8 flex items-center justify-center bg-[#0f172a] text-white py-3.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors shadow-sm"
                >
                  VIEW DETAILS
                  <HiOutlineArrowRight className="ml-2 w-4 h-4" />
                </button>
              </div>
            ))
          ) : (
            <div className="col-span-full bg-white p-20 rounded-3xl text-center border-2 border-dashed border-gray-100">
              <p className="text-gray-400 font-bold italic">No classes found for your profile today.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;