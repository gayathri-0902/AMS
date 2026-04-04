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
  HiOutlineSparkles,
  HiOutlineClock
} from "react-icons/hi";
import AcademicAI from "./AcademicAI";

const StudentDashboard = ({ overrideId }) => {
  const { auth, logout } = useAuth();
  const { studentId: urlStudentId } = useParams();
  const navigate = useNavigate();
  const [timetable, setTimetable] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [currentYear, setCurrentYear] = useState("");
  const [currentSem, setCurrentSem] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);

  const formatTime = (timeString) => {
    if (!timeString) return "";
    let [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = (h >= 12) ? 'PM' : 'AM';
    let displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const getYearLabel = (yr) => {
    const labels = { 1: "1ST YEAR", 2: "2ND YEAR", 3: "3RD YEAR", 4: "4TH YEAR" };
    return labels[yr] || `YEAR ${yr}`;
  };

  // FIX 2: Helper to get status badge styles
  const getStatusStyle = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 text-green-600";
      case "Absent":
        return "bg-red-100 text-red-500";
      case "Not Marked":
      default:
        return "bg-gray-100 text-gray-400";
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
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

        // Use current_year and current_sem from the YrSem table (via studentDetails)
        const details = response.data.studentDetails || response.data.student || {};
        setCurrentYear(details.current_year || "");
        setCurrentSem(details.current_sem || "");

      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [auth?.studentId, urlStudentId, overrideId]);

  useEffect(() => {
    const fetchAssignments = async () => {
      // Must have timetable and a valid student ID to proceed
      if (timetable.length === 0 || !auth?.studentId) return;
      try {
        const allAssignments = [];
        const seenSubjectIds = new Set();
        
        for (const course of timetable) {
          if (!seenSubjectIds.has(course.subject_offering_id)) {
            seenSubjectIds.add(course.subject_offering_id);
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/assignment/subject/${course.subject_offering_id}`);
            allAssignments.push(...res.data);
          }
        }
        
        // Final safety deduplication by assignment _id to ensure no React key collisions
        const uniqueAssignments = Array.from(new Map(allAssignments.map(a => [a._id, a])).values());

        // Fetch student's submissions to filter out completed ones
        const subRes = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/submission/student/${auth.studentId}`);
        // Extract assignment IDs from the populated assignment_id field
        const submittedIds = new Set(subRes.data.map(sub => sub.assignment_id ? sub.assignment_id._id : sub.assignment_id));

        const pendingAssignments = uniqueAssignments.filter(a => !submittedIds.has(a._id));

        setAssignments(pendingAssignments);
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };
    fetchAssignments();
  }, [timetable, auth?.studentId]);

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
                {studentInfo?.branch_name} • {getYearLabel(studentInfo?.current_year)} • SEM {studentInfo?.current_sem}
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

        {/* --- ASSIGNMENT TIMELINE --- */}
        {assignments.length > 0 && (
          <div className="mb-14 px-2">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Pending Assignments</h2>
            <div className="flex overflow-x-auto pb-6 space-x-6 scrollbar-hide">
              {assignments.map((assign, idx) => (
                <div key={idx} className="min-w-[320px] bg-white rounded-[32px] p-6 shadow-sm border-t-8 border-blue-500 border-x border-b border-gray-50 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {assign.assignment_type}
                      </span>
                      <div className="flex items-center text-xs font-bold text-gray-400">
                        <HiOutlineClock size={14} className="mr-1" />
                        {new Date(assign.submission_deadline).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 mb-1 leading-tight">{assign.title}</h3>
                    <p className="text-sm text-gray-400 font-medium truncate">{assign.instructions}</p>
                  </div>
                  <button 
                    onClick={() => navigate(`/hand-in/${assign._id}`)}
                    className="mt-6 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-500 hover:text-white transition-all transition-all active:scale-95"
                  >
                    ATTEMPT TASK
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Course Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
          {timetable.map((course, index) => (
            <div key={index} className="bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-gray-100 group">
              <div className="flex justify-between items-start mb-8">
                <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <HiOutlineBookOpen className="w-8 h-8" />
                </div>
                {/* FIX 1: Use attendance_status from API instead of hardcoded "Not Marked" */}
                <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getStatusStyle(course.attendance_status)}`}>
                  {course.attendance_status || "Not Marked"}
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
          onClick={() => setChatOpen(true)}
          className="fixed bottom-10 right-10 flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all z-[1000] border-4 border-white"
        >
          <HiOutlineSparkles className="w-6 h-6" />
          <span className="text-lg">Academic AI</span>
        </button>

        {/* Academic AI Chat Modal */}
        <AcademicAI
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          studentName={studentInfo?.student_name}
          year={studentInfo?.current_year}
          branch={studentInfo?.branch_name}
        />

      </div>
    </div>
  );
};

export default StudentDashboard;