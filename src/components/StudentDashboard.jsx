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
  HiOutlineClock,
  HiOutlineDocumentText,
  HiOutlineDownload
} from "react-icons/hi";

// Curated color palette for subject tiles (border-left + background tint)
const SUBJECT_COLORS = [
  { border: '#6366f1', bg: 'rgba(99,102,241,0.10)',  text: '#6366f1' },  // Indigo
  { border: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  text: '#f59e0b' },  // Amber
  { border: '#10b981', bg: 'rgba(16,185,129,0.10)',  text: '#10b981' },  // Emerald
  { border: '#ef4444', bg: 'rgba(239,68,68,0.10)',   text: '#ef4444' },  // Red
  { border: '#8b5cf6', bg: 'rgba(139,92,246,0.10)',  text: '#8b5cf6' },  // Violet
  { border: '#ec4899', bg: 'rgba(236,72,153,0.10)',  text: '#ec4899' },  // Pink
  { border: '#14b8a6', bg: 'rgba(20,184,166,0.10)',  text: '#14b8a6' },  // Teal
  { border: '#f97316', bg: 'rgba(249,115,22,0.10)',  text: '#f97316' },  // Orange
  { border: '#06b6d4', bg: 'rgba(6,182,212,0.10)',   text: '#06b6d4' },  // Cyan
  { border: '#84cc16', bg: 'rgba(132,204,22,0.10)',  text: '#84cc16' },  // Lime
];

// Simple hash to deterministically map a string to a color index
const getSubjectColor = (subjectName) => {
  let hash = 0;
  for (let i = 0; i < subjectName.length; i++) {
    hash = subjectName.charCodeAt(i) + ((hash << 5) - hash);
  }
  return SUBJECT_COLORS[Math.abs(hash) % SUBJECT_COLORS.length];
};
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
  const [feedbackStatus, setFeedbackStatus] = useState({ allowed: false, phase: "", pending: [] });
  const [overallAttendance, setOverallAttendance] = useState(null);

  // NEW: Weekend UI State
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectNotes, setSubjectNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

  // NEW: Weekly Timetable State
  const [showWeeklySchedule, setShowWeeklySchedule] = useState(false);
  const [weeklyTimetable, setWeeklyTimetable] = useState([]);
  const [weeklyScheduleLoading, setWeeklyScheduleLoading] = useState(false);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

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

  const getStatusStyle = (status) => {
    switch (status) {
      case "Present":
        return "bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400";
      case "Absent":
        return "bg-red-100 text-red-500";
      case "Not Marked":
      default:
        return "bg-gray-100 dark:bg-slate-800 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500";
    }
  };

  // NEW: Fetch notes for selected subject
  const handleSelectSubject = async (subject) => {
    setSelectedSubject(subject);
    setNotesLoading(true);

    try {
      const response = await axios.get(
        `${API_BASE}/api/notes/${subject.subject_offering_id}`
      );
      setSubjectNotes(response.data || []);
    } catch (error) {
      console.error("Error fetching notes:", error);
      setSubjectNotes([]);
    } finally {
      setNotesLoading(false);
    }
  };

  // NEW: Close notes view
  const handleCloseSubject = () => {
    setSelectedSubject(null);
    setSubjectNotes([]);
  };

  const fetchWeeklySchedule = async () => {
    setShowWeeklySchedule(true);
    if (weeklyTimetable.length > 0) return;
    setWeeklyScheduleLoading(true);
    try {
      const targetId = overrideId || urlStudentId || auth?.studentId;
      const res = await axios.get(`${API_BASE}/api/student/weekly-timetable/${targetId}`);
      setWeeklyTimetable(res.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setWeeklyScheduleLoading(false);
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
          `${API_BASE}/api/student-dashboard/${targetId}`
        );

        setTimetable(response.data.timetableData || []);
        setStudentInfo(response.data.studentDetails || response.data.student || null);

        const details = response.data.studentDetails || response.data.student || {};
        setCurrentYear(details.current_year || "");
        setCurrentSem(details.current_sem || "");

        // NEW: Fetch all subjects for weekend view
        try {
          const subjectsRes = await axios.get(
            `${API_BASE}/api/student/subjects/${targetId}`
          );
          setAllSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
        } catch (error) {
          console.error("Error fetching subjects:", error);
          setAllSubjects([]);
        }

        // NEW: Fetch feedback eligibility
        try {
          const fbRes = await axios.get(`${API_BASE}/api/feedback/eligibility/${targetId}`);
          setFeedbackStatus({
            allowed: fbRes.data.feedbackAllowed,
            phase: fbRes.data.activePhase,
            pending: fbRes.data.pendingSubjects || []
          });
        } catch (error) {
          console.error("Error fetching feedback status:", error);
        }

        // Fetch overall attendance
        try {
          const attRes = await axios.get(`${API_BASE}/api/student/overall-attendance/${targetId}`);
          setOverallAttendance(attRes.data);
        } catch (error) {
          console.error("Error fetching overall attendance:", error);
        }

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
      // Must have subjects and a valid student ID to proceed
      if (allSubjects.length === 0 || !auth?.studentId) return;
      try {
        const allAssignments = [];
        const seenSubjectIds = new Set();

        for (const subject of allSubjects) {
          if (!seenSubjectIds.has(subject.subject_offering_id)) {
            seenSubjectIds.add(subject.subject_offering_id);
            const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/assignment/subject/${subject.subject_offering_id}`);
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
  }, [allSubjects, auth?.studentId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center font-antiqua">Loading...</div>;

  return (
    <div className="min-h-screen bg-[#f0f2f5] dark:bg-slate-900 p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">

        {/* --- HEADER --- */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center space-x-4 p-2">
            <div className="h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 dark:text-white leading-none tracking-tight">
                {studentInfo?.student_id_no}
              </h2>
              <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase mt-1 tracking-widest">
                {studentInfo?.branch_name} • {getYearLabel(studentInfo?.current_year)} • SEM {studentInfo?.current_sem}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={fetchWeeklySchedule}
              className="flex items-center space-x-2 bg-blue-600 border-2 border-blue-600 text-white px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-blue-700 hover:border-blue-700 transition-all shadow-md active:scale-95"
            >
              <HiOutlineCalendar className="w-5 h-5" />
              <span>TIMETABLE</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center space-x-2 bg-white dark:bg-slate-800 border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
            >
              <span>LOGOUT</span>
              <HiOutlineLogout className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Title */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">Student Dashboard</h1>
          <p className="text-xl text-gray-500 dark:text-slate-400 dark:text-slate-500 mt-1">
            Welcome back, <span className="text-blue-600 dark:text-blue-400 font-bold">{studentInfo?.student_name}</span>
          </p>
        </div>

        {/* --- OVERALL ATTENDANCE CARD --- */}
        {overallAttendance && (
          <div className="mb-10 px-2">
            <div className="bg-white dark:bg-slate-800 rounded-[32px] p-8 shadow-sm border border-gray-100 dark:border-slate-600 flex flex-col md:flex-row md:items-center gap-6">
              <div className="flex items-center gap-5 flex-1">
                <div className={`w-20 h-20 rounded-2xl flex items-center justify-center text-white font-black text-2xl shadow-lg ${
                  parseFloat(overallAttendance.percentage) >= 75 ? 'bg-green-500' :
                  parseFloat(overallAttendance.percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                }`}>
                  {Math.round(parseFloat(overallAttendance.percentage))}%
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-800 dark:text-white">Overall Attendance</h3>
                  <p className="text-sm text-gray-400 dark:text-slate-400 font-medium mt-1">
                    {overallAttendance.present_count} present out of {overallAttendance.total_count} sessions
                  </p>
                </div>
              </div>
              <div className="flex-1 max-w-md">
                <div className="w-full bg-gray-100 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      parseFloat(overallAttendance.percentage) >= 75 ? 'bg-green-500' :
                      parseFloat(overallAttendance.percentage) >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${overallAttendance.percentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 dark:text-slate-500 font-bold mt-2 text-right">
                  {parseFloat(overallAttendance.percentage) >= 75 ? '✅ Good standing' :
                   parseFloat(overallAttendance.percentage) >= 50 ? '⚠️ Needs improvement' : '🚨 Below minimum'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* --- MINIMALISTIC FEEDBACK NOTIFICATION --- */}
        {feedbackStatus.allowed && feedbackStatus.pending.length > 0 && (
          <div className="mb-10 p-6 bg-white dark:bg-slate-800 rounded-[2rem] border-l-8 border-blue-600 shadow-sm animate-in slide-in-from-top-4 duration-500 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0">
                <HiOutlineBookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white tracking-tight leading-none mb-1">
                  Pending Course Feedback
                </h3>
                <p className="text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 text-sm font-medium italic">
                  Please complete the <span className="text-blue-600 dark:text-blue-400 font-bold">{feedbackStatus.phase}</span> evaluations for your active courses.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {feedbackStatus.pending.map(s => (
                <button
                  key={s.subject_offering_id}
                  onClick={() => navigate(`/student/feedback/${s.subject_offering_id}`)}
                  className="px-4 py-2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-800 rounded-xl text-xs font-bold hover:bg-blue-600 hover:text-white transition-all active:scale-95 flex items-center gap-2 group"
                >
                  {s.course_name}
                  <HiOutlineArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* --- PENDING ASSIGNMENTS (AVAILABLE EVERY DAY) --- */}
        {assignments.length > 0 && (
          <div className="mb-14 px-2">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Pending Assignments</h2>
            <div className="flex overflow-x-auto pb-6 space-x-6 scrollbar-hide">
              {assignments.map((assign, idx) => (
                <div key={idx} className="min-w-[320px] bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border-t-8 border-blue-500 border-x border-b border-gray-50 dark:border-slate-700 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter">
                        {assign.assignment_type || "Task"}
                      </span>
                      <div className="flex items-center text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">
                        <HiOutlineClock size={14} className="mr-1" />
                        {new Date(assign.submission_deadline || assign.due_date).toLocaleDateString()}
                      </div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-1 leading-tight">{assign.title}</h3>
                    <p className="text-sm text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium truncate">{assign.instructions}</p>
                  </div>
                  <button
                    onClick={() => navigate(`/hand-in/${assign._id}`)}
                    className="mt-6 w-full py-3 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl font-bold text-sm hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                  >
                    ATTEMPT TASK
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- WEEKDAY: ASSIGNMENT TIMELINE + COURSE CARDS --- */}
        {timetable.length > 0 ? (
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {timetable.map((course, index) => (
                <div key={index} className="bg-white dark:bg-slate-800 rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-gray-100 dark:border-slate-600 group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-blue-50 dark:bg-blue-900/40 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <HiOutlineBookOpen className="w-8 h-8" />
                    </div>
                    <span className={`text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest ${getStatusStyle(course.attendance_status)}`}>
                      {course.attendance_status || "Not Marked"}
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-1">{course.class_name}</h3>
                  <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 text-[11px] font-bold px-3 py-1 rounded-lg uppercase">
                    {course.class_code}
                  </span>

                  <div className="mt-8 space-y-4 text-gray-600 dark:text-slate-300">
                    <div className="flex items-center space-x-3">
                      <HiOutlineCalendar className="w-5 h-5 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                      <div>
                        <p className="font-bold text-gray-800 dark:text-white">{course.day}</p>
                        <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500">{formatTime(course.start_time)} - {formatTime(course.end_time)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <HiOutlineClipboardCheck className="w-5 h-5 text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" />
                      <p className="text-sm">Faculty: <span className="font-bold text-gray-800 dark:text-white">{course.faculty_name}</span></p>
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
          </div>
        ) : (
          /* --- WEEKEND: NO CLASSES UI --- */
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>

            <div className="flex flex-col space-y-8">
              {/* No Classes Message Card */}
              <div className="bg-white dark:bg-slate-800 rounded-[40px] p-12 md:p-16 shadow-sm border border-gray-100 dark:border-slate-600 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/40 flex items-center justify-center mb-8">
                  <HiOutlineCalendar className="w-14 h-14 text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 dark:text-white mb-3">No Classes Today</h3>
                <p className="text-lg text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-medium mb-6 max-w-md">
                  <span className="text-blue-600 dark:text-blue-400 font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">
                    <HiOutlineCalendar className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowResourcePicker(!showResourcePicker);
                    if (showResourcePicker) {
                      setSelectedSubject(null);
                    }
                  }}
                  className="mt-10 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                  {showResourcePicker ? "Hide Course Materials" : "View Course Materials"}
                </button>
              </div>

              {/* Subject Picker & Notes - Only show on weekends */}
              {showResourcePicker && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <h2 className="text-xs font-bold text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
                    Your Courses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {allSubjects.map((subject) => (
                      <div
                        key={subject.subject_offering_id}
                        onClick={() => handleSelectSubject(subject)}
                        className={`bg-white dark:bg-slate-800 rounded-[32px] p-6 shadow-sm border-2 cursor-pointer transition-all duration-300 ${selectedSubject?.subject_offering_id === subject.subject_offering_id
                            ? "border-blue-500 shadow-lg"
                            : "border-transparent hover:border-blue-200 dark:hover:border-blue-600 dark:border-blue-700"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedSubject?.subject_offering_id === subject.subject_offering_id
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-50 dark:bg-blue-900/40 text-blue-500 dark:text-blue-400'
                              }`}
                          >
                            <HiOutlineBookOpen className="w-6 h-6" />
                          </div>
                          <span className="bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            {subject.class_code}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white leading-tight mb-2">
                          {subject.class_name}
                        </h3>
                        <p className="text-[11px] text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-tighter">
                          Faculty: {subject.faculty_name}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ===== MODIFIED: Notes Display moved here - directly below subject picker ===== */}
                  {selectedSubject && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-900 rounded-[40px] p-10 border-2 border-blue-200 dark:border-slate-700 shadow-lg">

                        {/* Header */}
                        <div className="mb-8">
                          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">
                            {selectedSubject.class_name}
                          </h2>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 px-4 py-2 rounded-full font-bold">
                              {selectedSubject.class_code}
                            </span>
                            <span className="text-gray-600 dark:text-slate-300">
                              <span className="font-bold">Faculty:</span> {selectedSubject.faculty_name}
                            </span>
                          </div>
                        </div>

                        {/* Notes Title */}
                        <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-6 flex items-center">
                          <HiOutlineDocumentText className="mr-3 w-8 h-8 text-blue-600 dark:text-blue-400" />
                          Course Materials ({subjectNotes.length})
                        </h3>

                        {/* Loading State */}
                        {notesLoading && (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="ml-4 text-gray-600 dark:text-slate-300 font-medium">Loading materials...</p>
                          </div>
                        )}

                        {/* Empty State */}
                        {!notesLoading && subjectNotes.length === 0 && (
                          <div className="bg-white dark:bg-slate-800 rounded-[32px] p-12 text-center border-2 border-dashed border-blue-200 dark:border-slate-600">
                            <HiOutlineDocumentText className="w-16 h-16 text-blue-200 dark:text-slate-600 mx-auto mb-4" />
                            <p className="text-lg font-bold text-gray-400 dark:text-slate-400">No materials available yet</p>
                            <p className="text-sm text-gray-400 dark:text-slate-500 mt-2">Check back later for course notes</p>
                          </div>
                        )}

                        {/* Notes Grid */}
                        {!notesLoading && subjectNotes.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subjectNotes.map((note) => (
                              <div
                                key={note._id}
                                className="bg-white dark:bg-slate-800 rounded-[28px] p-6 border-2 border-blue-100 dark:border-blue-800 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:text-blue-400 transition-colors line-clamp-2">
                                      {note.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 font-bold uppercase tracking-widest mt-2">
                                      {new Date(note.upload_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 dark:bg-blue-900/40 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0 ml-3">
                                    <HiOutlineDocumentText className="w-5 h-5" />
                                  </div>
                                </div>

                                {note.description && (
                                  <p className="text-sm text-gray-600 dark:text-slate-300 mb-4 line-clamp-2">
                                    {note.description}
                                  </p>
                                )}

                                <a
                                  href={`${API_BASE}${note.file_url}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold text-sm hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
                                >
                                  <HiOutlineDownload className="w-4 h-4" />
                                  <span>Download</span>
                                </a>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  {/* ===== END MODIFIED ===== */}
                </div>
              )}
            </div>
          </div>
        )}

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

        {/* Weekly Timetable Modal */}
        {showWeeklySchedule && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white dark:bg-slate-950 rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-300">
              <div className="p-6 md:p-8 flex justify-between items-center bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800">
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 rounded-xl">
                    <HiOutlineCalendar className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Weekly Schedule</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">All classes for the current semester</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowWeeklySchedule(false)}
                  className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-300 hover:text-slate-800 dark:hover:bg-slate-700 dark:hover:text-white rounded-full transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="p-6 md:p-8 overflow-y-auto bg-slate-50 dark:bg-slate-950 relative flex-1">
                {weeklyScheduleLoading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-blue-600 mb-4"></div>
                    <p className="text-slate-500 dark:text-slate-400 font-bold">Loading timetable...</p>
                  </div>
                ) : (
                  <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border dark:border-slate-800 overflow-hidden">
                    <div className="overflow-x-auto">
                      <div className="min-w-full">
                        {/* Header Row */}
                        <div className="flex bg-slate-50 dark:bg-slate-900 border-b dark:border-slate-800">
                          <div className="min-w-[100px] p-2 border-r dark:border-slate-800 bg-slate-50 dark:bg-slate-900"></div>
                          {[1, 2, 3, 4, 5, 6].map((sessionNo) => {
                            const items = [];
                            items.push(
                              <div key={sessionNo} className="flex-1 min-w-[140px] p-2 text-center border-r dark:border-slate-800">
                                <div className="text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Session {sessionNo}</div>
                              </div>
                            );
                            if (sessionNo === 3) {
                              items.push(
                                <div key={`gap-h-${sessionNo}`} className="w-[40px] flex items-center justify-center border-r dark:border-slate-800 bg-slate-100 dark:bg-slate-800/30">
                                  <span className="text-[7px] font-black uppercase text-slate-400 dark:text-slate-500">Break</span>
                                </div>
                              );
                            }
                            return items;
                          })}
                        </div>

                        {/* Body */}
                        <div className="bg-white dark:bg-slate-900">
                          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, dayIdx) => (
                            <div key={day} className="flex border-b dark:border-slate-800 last:border-b-0 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                              <div className="min-w-[100px] p-4 border-r dark:border-slate-800 flex flex-col justify-center bg-white dark:bg-slate-900 z-10">
                                <span className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-widest">{day}</span>
                              </div>
                              {[1, 2, 3, 4, 5, 6].map((sessionNo) => {
                                const entry = weeklyTimetable.find(e => e.day === day && e.session_no === sessionNo);
                                const items = [];

                                const color = entry ? getSubjectColor(entry.class_name) : null;
                                items.push(
                                  <div key={`${day}-${sessionNo}`} className="flex-1 min-w-[140px] p-1.5 border-r dark:border-slate-800 flex">
                                    {entry ? (
                                      <div
                                        className="w-full border-l-[3px] p-3 rounded-lg shadow-sm border dark:border-slate-700"
                                        style={{
                                          borderLeftColor: color.border,
                                          backgroundColor: color.bg,
                                        }}
                                      >
                                        <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate mb-1" title={entry.class_name}>
                                          {entry.class_name}
                                        </h4>
                                        <p className="text-[9px] font-semibold text-slate-500 dark:text-slate-400 mb-2">{entry.class_code}</p>
                                        <div className="mt-auto pt-2 border-t border-black/5 dark:border-white/5 flex flex-col gap-0.5">
                                          <p className="text-[10px] font-semibold text-slate-600 dark:text-slate-300 truncate">
                                            {entry.faculty_name}
                                          </p>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="w-full rounded-lg border border-dashed border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col items-center justify-center opacity-60 p-2 text-center text-slate-400 dark:text-slate-500">
                                          <span className="text-[10px] font-bold uppercase tracking-widest">
                                            Leisure / Projects
                                          </span>
                                      </div>
                                    )}
                                  </div>
                                );

                                if (sessionNo === 3) {
                                  items.push(
                                    <div key={`gap-b-${day}-${sessionNo}`} className="w-[40px] flex items-center justify-center border-r dark:border-slate-800 bg-slate-50 dark:bg-slate-800/20">
                                      <div className="w-0.5 h-10 bg-slate-200 dark:bg-slate-800 rounded-full opacity-30"></div>
                                    </div>
                                  );
                                }
                                return items;
                              })}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StudentDashboard;