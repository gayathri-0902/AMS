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

  // NEW: Weekend UI State
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [subjectNotes, setSubjectNotes] = useState([]);
  const [notesLoading, setNotesLoading] = useState(false);

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
        return "bg-green-100 text-green-600";
      case "Absent":
        return "bg-red-100 text-red-500";
      case "Not Marked":
      default:
        return "bg-gray-100 text-gray-400";
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

        {/* --- FEEDBACK NOTIFICATION --- */}
        {feedbackStatus.allowed && feedbackStatus.pending.length > 0 && (
          <div className="mb-10 p-8 bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-500 rounded-[2.5rem] text-white shadow-2xl shadow-blue-500/30 animate-in slide-in-from-top-4 duration-700 relative overflow-hidden group">
            {/* Decorative Icon */}
            <div className="absolute -top-10 -right-10 opacity-10 group-hover:scale-110 group-hover:-rotate-12 transition-all duration-700">
              <HiOutlineSparkles size={240} />
            </div>

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
              <div className="max-w-xl">
                <div className="flex items-center gap-3 mb-3">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 rounded-full text-[10px] font-black uppercase tracking-widest">
                    Phase Active: {feedbackStatus.phase}
                  </span>
                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                </div>
                <h3 className="text-3xl font-black tracking-tight mb-2 leading-tight">
                  Valuable Insights Needed!
                </h3>
                <p className="text-blue-50 font-medium text-lg opacity-90 leading-relaxed">
                  The {feedbackStatus.phase} feedback portal is now open. You have <span className="bg-white/20 px-2 py-0.5 rounded-lg font-bold text-white underline decoration-emerald-400 decoration-4 underline-offset-4">{feedbackStatus.pending.length} pending</span> course evaluations.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                {feedbackStatus.pending.map(s => (
                  <button
                    key={s.subject_offering_id}
                    onClick={() => navigate(`/student/feedback/${s.subject_offering_id}`)}
                    className="px-6 py-3 bg-white text-blue-600 hover:bg-blue-50 border border-transparent rounded-2xl text-sm font-black transition-all active:scale-95 shadow-lg flex items-center gap-2 group/btn"
                  >
                    {s.course_name}
                    <HiOutlineArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- WEEKDAY: ASSIGNMENT TIMELINE + COURSE CARDS --- */}
        {timetable.length > 0 ? (
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>

            {/* Pending Assignments (only on weekdays) */}
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
                        className="mt-6 w-full py-3 bg-blue-50 text-blue-600 rounded-xl font-bold text-sm hover:bg-blue-500 hover:text-white transition-all active:scale-95"
                      >
                        ATTEMPT TASK
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {timetable.map((course, index) => (
                <div key={index} className="bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-gray-100 group">
                  <div className="flex justify-between items-start mb-8">
                    <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      <HiOutlineBookOpen className="w-8 h-8" />
                    </div>
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
          </div>
        ) : (
          /* --- WEEKEND: NO CLASSES UI --- */
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>

            <div className="flex flex-col space-y-8">
              {/* No Classes Message Card */}
              <div className="bg-white rounded-[40px] p-12 md:p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-8">
                  <HiOutlineCalendar className="w-14 h-14 text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 mb-3">No Classes Today</h3>
                <p className="text-lg text-gray-400 font-medium mb-6 max-w-md">
                  <span className="text-blue-600 font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">
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
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
                    Your Courses
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                    {allSubjects.map((subject) => (
                      <div
                        key={subject.subject_offering_id}
                        onClick={() => handleSelectSubject(subject)}
                        className={`bg-white rounded-[32px] p-6 shadow-sm border-2 cursor-pointer transition-all duration-300 ${selectedSubject?.subject_offering_id === subject.subject_offering_id
                            ? "border-blue-500 shadow-lg"
                            : "border-transparent hover:border-blue-200"
                          }`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedSubject?.subject_offering_id === subject.subject_offering_id
                                ? 'bg-blue-500 text-white'
                                : 'bg-blue-50 text-blue-500'
                              }`}
                          >
                            <HiOutlineBookOpen className="w-6 h-6" />
                          </div>
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">
                            {subject.class_code}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2">
                          {subject.class_name}
                        </h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">
                          Faculty: {subject.faculty_name}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* ===== MODIFIED: Notes Display moved here - directly below subject picker ===== */}
                  {selectedSubject && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-[40px] p-10 border-2 border-blue-200 shadow-lg">

                        {/* Header */}
                        <div className="mb-8">
                          <h2 className="text-3xl font-bold text-gray-800 mb-2">
                            {selectedSubject.class_name}
                          </h2>
                          <div className="flex items-center space-x-4 text-sm">
                            <span className="bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-bold">
                              {selectedSubject.class_code}
                            </span>
                            <span className="text-gray-600">
                              <span className="font-bold">Faculty:</span> {selectedSubject.faculty_name}
                            </span>
                          </div>
                        </div>

                        {/* Notes Title */}
                        <h3 className="text-2xl font-bold text-gray-800 mb-6 flex items-center">
                          <HiOutlineDocumentText className="mr-3 w-8 h-8 text-blue-600" />
                          Course Materials ({subjectNotes.length})
                        </h3>

                        {/* Loading State */}
                        {notesLoading && (
                          <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <p className="ml-4 text-gray-600 font-medium">Loading materials...</p>
                          </div>
                        )}

                        {/* Empty State */}
                        {!notesLoading && subjectNotes.length === 0 && (
                          <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-blue-200">
                            <HiOutlineDocumentText className="w-16 h-16 text-blue-200 mx-auto mb-4" />
                            <p className="text-lg font-bold text-gray-400">No materials available yet</p>
                            <p className="text-sm text-gray-400 mt-2">Check back later for course notes</p>
                          </div>
                        )}

                        {/* Notes Grid */}
                        {!notesLoading && subjectNotes.length > 0 && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {subjectNotes.map((note) => (
                              <div
                                key={note._id}
                                className="bg-white rounded-[28px] p-6 border-2 border-blue-100 hover:border-blue-400 shadow-sm hover:shadow-lg transition-all group"
                              >
                                <div className="flex items-start justify-between mb-4">
                                  <div className="flex-1">
                                    <h4 className="text-lg font-bold text-gray-800 group-hover:text-blue-600 transition-colors line-clamp-2">
                                      {note.title}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-2">
                                      {new Date(note.upload_date).toLocaleDateString('en-US', {
                                        year: 'numeric',
                                        month: 'short',
                                        day: 'numeric'
                                      })}
                                    </p>
                                  </div>
                                  <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors flex-shrink-0 ml-3">
                                    <HiOutlineDocumentText className="w-5 h-5" />
                                  </div>
                                </div>

                                {note.description && (
                                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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

      </div>
    </div>
  );
};

export default StudentDashboard;