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
  HiOutlineDownload,
  HiOutlineChevronLeft,
  HiOutlineAcademicCap,
  HiOutlineX,
} from "react-icons/hi";
import AcademicAI from "./AcademicAI";

// ── Palette for subject tiles (cycles through) ───────────────────────────────
const TILE_PALETTES = [
  { bg: "bg-blue-600",   light: "bg-blue-50",   text: "text-blue-600",   border: "border-blue-200"  },
  { bg: "bg-violet-600", light: "bg-violet-50",  text: "text-violet-600", border: "border-violet-200"},
  { bg: "bg-emerald-600",light: "bg-emerald-50", text: "text-emerald-600",border: "border-emerald-200"},
  { bg: "bg-amber-500",  light: "bg-amber-50",   text: "text-amber-600",  border: "border-amber-200" },
  { bg: "bg-rose-600",   light: "bg-rose-50",    text: "text-rose-600",   border: "border-rose-200"  },
  { bg: "bg-cyan-600",   light: "bg-cyan-50",    text: "text-cyan-600",   border: "border-cyan-200"  },
];

// ── Normalize a subject record from any endpoint into a common shape ─────────
const normalizeSubject = (s) => ({
  subject_offering_id: s.subject_offering_id,
  class_name:   s.class_name  || s.course_name  || "Unknown Subject",
  class_code:   s.class_code  || s.course_code  || "N/A",
  faculty_name: s.faculty_name || "Unknown",
});

const StudentDashboard = ({ overrideId }) => {
  const { auth, logout } = useAuth();
  const { studentId: urlStudentId } = useParams();
  const navigate = useNavigate();

  // ── Core States ──────────────────────────────────────────────────
  const [timetable, setTimetable] = useState([]);
  const [studentInfo, setStudentInfo] = useState(null);
  const [currentYear, setCurrentYear] = useState("");
  const [currentSem, setCurrentSem] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const [assignments, setAssignments] = useState([]);

  // ── Weekend UI States ────────────────────────────────────────────
  const [showResourcePicker, setShowResourcePicker] = useState(false);
  const [allSubjects, setAllSubjects] = useState([]);
  const [allSubjectNotes, setAllSubjectNotes] = useState({});
  const [subjectsLoading, setSubjectsLoading] = useState(false);
  const [subjectsError, setSubjectsError] = useState(null);

  // which subject tile is currently expanded
  const [selectedSubjectId, setSelectedSubjectId] = useState(null);
  // per-subject notes loading spinner
  const [subjectNotesLoading, setSubjectNotesLoading] = useState(false);

  const API_BASE =
    import.meta.env.VITE_API_BASE_URL || "http://localhost:3002";

  // ── Helpers ─────────────────────────────────────────────────────
  const formatTime = (timeString) => {
    if (!timeString) return "";
    let [hours, minutes] = timeString.split(":");
    let h = parseInt(hours);
    const ampm = h >= 12 ? "PM" : "AM";
    let displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  const getYearLabel = (yr) => {
    const labels = { 1: "1ST YEAR", 2: "2ND YEAR", 3: "3RD YEAR", 4: "4TH YEAR" };
    return labels[yr] || `YEAR ${yr}`;
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "Present":   return "bg-green-100 text-green-600";
      case "Absent":    return "bg-red-100 text-red-500";
      case "Not Marked":
      default:          return "bg-gray-100 text-gray-400";
    }
  };

  // ── Fetch subjects — tries 3 endpoints in sequence ───────────────
  // Each endpoint is a different strategy; the first one that returns
  // a non-empty array wins. This guarantees subjects show up regardless
  // of which yr_sem_id mismatch is present in the database.
  const fetchSubjects = async () => {
    const targetId = overrideId || urlStudentId || auth?.studentId;
    if (!targetId) {
      setSubjectsError("No student ID found. Please log out and log in again.");
      return;
    }

    setSubjectsLoading(true);
    setSubjectsError(null);

    // ── ATTEMPT 1: enrolled-subjects (queries TimeTable, multi-strategy) ──
    try {
      const res = await axios.get(`${API_BASE}/api/student/enrolled-subjects/${targetId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(normalizeSubject);
        // #region agent log
        fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "StudentDashboard.jsx:fetchSubjects", message: "subjects loaded", data: { attempt: "enrolled-subjects", count: mapped.length }, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
        // #endregion
        setAllSubjects(mapped);
        setSubjectsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("[fetchSubjects] enrolled-subjects failed:", e?.response?.status, e?.message);
    }

    // ── ATTEMPT 2: student/subjects (3-strategy route with TimeTable fallback) ─
    try {
      const res = await axios.get(`${API_BASE}/api/student/subjects/${targetId}`);
      if (Array.isArray(res.data) && res.data.length > 0) {
        const mapped = res.data.map(normalizeSubject);
        // #region agent log
        fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "StudentDashboard.jsx:fetchSubjects", message: "subjects loaded", data: { attempt: "student/subjects", count: mapped.length }, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
        // #endregion
        setAllSubjects(mapped);
        setSubjectsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("[fetchSubjects] student/subjects failed:", e?.response?.status, e?.message);
    }

    // ── ATTEMPT 3: derive from attendance endpoint (SubjectOffering-based) ──
    try {
      const res = await axios.get(`${API_BASE}/api/attendance/${targetId}`);
      const list = res.data?.subjectAttendance ?? [];
      if (list.length > 0) {
        const mapped = list.map((s) => ({
          subject_offering_id: s.subject_offering_id,
          class_name:   s.class_name  || "Unknown Subject",
          class_code:   s.class_code  || "N/A",
          faculty_name: "—",
        }));
        // #region agent log
        fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "StudentDashboard.jsx:fetchSubjects", message: "subjects loaded", data: { attempt: "attendance-fallback", count: mapped.length }, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
        // #endregion
        setAllSubjects(mapped);
        setSubjectsLoading(false);
        return;
      }
    } catch (e) {
      console.warn("[fetchSubjects] attendance fallback failed:", e?.response?.status, e?.message);
    }

    // All 3 failed
    // #region agent log
    fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "StudentDashboard.jsx:fetchSubjects", message: "all attempts empty or error", data: { hypothesisId: "M2", hasApiBase: !!import.meta.env.VITE_API_BASE_URL, targetIdLen: targetId ? String(targetId).length : 0 }, timestamp: Date.now() }) }).catch(() => {});
    // #endregion
    setSubjectsError("Could not load subjects. Please check your connection and try again.");
    setSubjectsLoading(false);
  };

  const handleToggleResourcePicker = () => {
    if (showResourcePicker) {
      setShowResourcePicker(false);
      setSelectedSubjectId(null);
      return;
    }
    setShowResourcePicker(true);
    fetchSubjects();
  };

  // ── Fetch notes for a single subject on tile click ───────────────
  const handleTileClick = async (subjectId) => {
    if (selectedSubjectId === subjectId) {
      setSelectedSubjectId(null);
      return;
    }
    setSelectedSubjectId(subjectId);
    if (allSubjectNotes[subjectId] !== undefined) return;

    setSubjectNotesLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/api/notes/${subjectId}`);
      const notes = res.data || [];
      // #region agent log
      fetch("http://127.0.0.1:7408/ingest/8e1a97aa-021c-4ca9-a5a5-c0fdb11624c5", { method: "POST", headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "9f2f67" }, body: JSON.stringify({ sessionId: "9f2f67", location: "StudentDashboard.jsx:handleTileClick", message: "notes fetched", data: { subjectOfferingId: String(subjectId), notesCount: notes.length }, timestamp: Date.now(), hypothesisId: "H3" }) }).catch(() => {});
      // #endregion
      setAllSubjectNotes((prev) => ({ ...prev, [subjectId]: notes }));
    } catch {
      setAllSubjectNotes((prev) => ({ ...prev, [subjectId]: [] }));
    } finally {
      setSubjectNotesLoading(false);
    }
  };

  // ── Effect: Fetch Dashboard Data ────────────────────────────────
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const targetId = overrideId || urlStudentId || auth?.studentId;
        if (!targetId) { setLoading(false); return; }

        const response = await axios.get(`${API_BASE}/api/student-dashboard/${targetId}`);
        setTimetable(response.data.timetableData || []);
        setStudentInfo(response.data.studentDetails || response.data.student || null);

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

  // ── Effect: Fetch Pending Assignments ────────────────────────────
  useEffect(() => {
    const fetchAssignments = async () => {
      if (timetable.length === 0 || !auth?.studentId) return;
      try {
        const allAssignments = [];
        const seenSubjectIds = new Set();
        for (const course of timetable) {
          if (!seenSubjectIds.has(course.subject_offering_id)) {
            seenSubjectIds.add(course.subject_offering_id);
            const res = await axios.get(`${API_BASE}/api/assignment/subject/${course.subject_offering_id}`);
            allAssignments.push(...res.data);
          }
        }
        const uniqueAssignments = Array.from(new Map(allAssignments.map((a) => [a._id, a])).values());
        const subRes = await axios.get(`${API_BASE}/api/submission/student/${auth.studentId}`);
        const submittedIds = new Set(
          subRes.data.map((sub) => sub.assignment_id ? sub.assignment_id._id : sub.assignment_id)
        );
        setAssignments(uniqueAssignments.filter((a) => !submittedIds.has(a._id)));
      } catch (err) {
        console.error("Error fetching assignments:", err);
      }
    };
    fetchAssignments();
  }, [timetable, auth?.studentId]);

  // ── Derived: selected subject object ────────────────────────────
  const selectedSubject = allSubjects.find(
    (s) => String(s.subject_offering_id) === String(selectedSubjectId)
  );
  const selectedNotes = selectedSubjectId ? (allSubjectNotes[selectedSubjectId] ?? null) : null;

  // ── Loading State ────────────────────────────────────────────────
  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center font-antiqua">
        Loading...
      </div>
    );

  // ── Render ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">

        {/* ── HEADER ── */}
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
                {studentInfo?.branch_name} • {getYearLabel(studentInfo?.current_year)} • SEM{" "}
                {studentInfo?.current_sem}
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

        {/* ── DASHBOARD TITLE ── */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
            Student Dashboard
          </h1>
          <p className="text-xl text-gray-500 mt-1">
            Welcome back,{" "}
            <span className="text-blue-600 font-bold">{studentInfo?.student_name}</span>
          </p>
        </div>

        {/* ── PENDING ASSIGNMENTS ── */}
        {assignments.length > 0 && (
          <div className="mb-14 px-2">
            <h2 className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">
              Pending Assignments
            </h2>
            <div className="flex overflow-x-auto pb-6 space-x-6 scrollbar-hide">
              {assignments.map((assign, idx) => (
                <div
                  key={idx}
                  className="min-w-[320px] bg-white rounded-[32px] p-6 shadow-sm border-t-8 border-blue-500 border-x border-b border-gray-50 flex flex-col justify-between"
                >
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

        {/* ── WEEKDAY / WEEKEND ── */}
        {timetable.length > 0 ? (
          /* ── WEEKDAY ── */
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {timetable.map((course, index) => (
                <div
                  key={index}
                  className="bg-white rounded-[40px] p-8 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left border border-gray-100 group"
                >
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
                        <p className="text-xs text-gray-400">
                          {formatTime(course.start_time)} - {formatTime(course.end_time)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <HiOutlineClipboardCheck className="w-5 h-5 text-gray-400" />
                      <p className="text-sm">
                        Faculty: <span className="font-bold text-gray-800">{course.faculty_name}</span>
                      </p>
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
          /* ── WEEKEND ── */
          <div className="mb-20">
            <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">
              Today's Schedule
            </h2>

            <div className="flex flex-col space-y-8">

              {/* ── No Classes Card ── */}
              <div className="bg-white rounded-[40px] p-12 md:p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-8">
                  <HiOutlineCalendar className="w-14 h-14 text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 mb-3">No Classes Today</h3>
                <p className="text-lg text-gray-400 font-medium mb-2">
                  <span className="text-blue-600 font-bold">
                    {new Date().toLocaleDateString("en-US", { weekday: "long" })}
                  </span>
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">
                    <HiOutlineCalendar className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
                    {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                  </span>
                </div>

                <button
                  onClick={handleToggleResourcePicker}
                  className="mt-10 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                  {showResourcePicker ? "Hide Course Materials" : "View Course Materials"}
                </button>
              </div>

              {/* ── Subject Tiles Grid ── */}
              {showResourcePicker && (
                <div>
                  {/* ── Header ── */}
                  <div className="flex items-center justify-between mb-6 px-2">
                    <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest border-l-4 border-blue-500 pl-4">
                      Your Courses — tap a tile to browse materials
                    </h2>
                    {selectedSubjectId && (
                      <button
                        onClick={() => setSelectedSubjectId(null)}
                        className="flex items-center space-x-1 text-xs font-bold text-gray-400 hover:text-gray-700 transition-colors"
                      >
                        <HiOutlineX className="w-4 h-4" />
                        <span>Deselect</span>
                      </button>
                    )}
                  </div>

                  {subjectsLoading ? (
                    <div className="bg-white rounded-[32px] p-16 flex items-center justify-center shadow-sm border border-gray-100">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                      <p className="ml-4 text-gray-500 font-medium">Loading your courses...</p>
                    </div>
                  ) : subjectsError ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-red-200 shadow-sm">
                      <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
                        <HiOutlineX className="w-6 h-6 text-red-400" />
                      </div>
                      <p className="text-base font-bold text-gray-600 mb-2">Couldn't load courses</p>
                      <p className="text-xs text-red-400 font-mono bg-red-50 rounded-xl px-4 py-2 mb-6 max-w-md mx-auto break-words">
                        {subjectsError}
                      </p>
                      <button
                        onClick={fetchSubjects}
                        className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-blue-700 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  ) : allSubjects.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-12 text-center border-2 border-dashed border-blue-200">
                      <HiOutlineBookOpen className="w-12 h-12 text-blue-200 mx-auto mb-4" />
                      <p className="text-lg font-bold text-gray-400">No courses found</p>
                      <p className="text-xs text-gray-400 mt-1">
                        Check the browser console for the raw API response.
                      </p>
                      <button
                        onClick={fetchSubjects}
                        className="mt-4 bg-gray-100 text-gray-600 px-6 py-2.5 rounded-xl font-bold text-sm hover:bg-gray-200 transition-all"
                      >
                        Retry
                      </button>
                    </div>
                  ) : (
                    <>
                      {/* ── Tiles ── */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                        {allSubjects.map((subject, idx) => {
                          const palette = TILE_PALETTES[idx % TILE_PALETTES.length];
                          const isSelected =
                            String(selectedSubjectId) === String(subject.subject_offering_id);
                          const noteCount = allSubjectNotes[subject.subject_offering_id]?.length ?? null;

                          return (
                            <button
                              key={subject.subject_offering_id}
                              onClick={() => handleTileClick(subject.subject_offering_id)}
                              className={`
                                w-full text-left rounded-[32px] p-7 border-2 transition-all duration-200
                                hover:shadow-xl hover:-translate-y-1 active:scale-95 cursor-pointer
                                ${isSelected
                                  ? `${palette.light} ${palette.border} shadow-xl -translate-y-1`
                                  : "bg-white border-gray-100 shadow-sm"
                                }
                              `}
                            >
                              {/* Icon row */}
                              <div className="flex items-start justify-between mb-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isSelected ? palette.bg : palette.light}`}>
                                  <HiOutlineAcademicCap className={`w-6 h-6 ${isSelected ? "text-white" : palette.text}`} />
                                </div>

                                {noteCount !== null ? (
                                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${noteCount > 0 ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-400"}`}>
                                    {noteCount} {noteCount === 1 ? "file" : "files"}
                                  </span>
                                ) : (
                                  <span className={`w-7 h-7 rounded-full flex items-center justify-center ${isSelected ? palette.bg : "bg-gray-100"}`}>
                                    <HiOutlineArrowRight className={`w-4 h-4 ${isSelected ? "text-white" : "text-gray-400"}`} />
                                  </span>
                                )}
                              </div>

                              {/* Subject name */}
                              <h3 className="text-lg font-extrabold text-gray-800 leading-snug mb-1">
                                {subject.class_name}
                              </h3>

                              {/* Code badge */}
                              <span className={`inline-block text-[11px] font-bold px-3 py-1 rounded-lg uppercase mb-3 ${palette.light} ${palette.text}`}>
                                {subject.class_code}
                              </span>

                              {/* Faculty */}
                              <p className="text-xs text-gray-400 font-medium mt-1">
                                <span className="font-bold text-gray-500">Faculty:</span>{" "}
                                {subject.faculty_name}
                              </p>

                              {/* Tap hint */}
                              <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 ${isSelected ? palette.text : "text-gray-300"}`}>
                                {isSelected ? "▾ Showing materials" : "Tap to view materials"}
                              </p>
                            </button>
                          );
                        })}
                      </div>

                      {/* ── Notes Panel ── */}
                      {selectedSubjectId && (
                        <div className="mt-8 animate-in fade-in slide-in-from-top-4 duration-300">

                          {/* Panel header */}
                          <div className="flex items-center space-x-4 mb-6 px-1">
                            <button
                              onClick={() => setSelectedSubjectId(null)}
                              className="w-9 h-9 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
                            >
                              <HiOutlineChevronLeft className="w-5 h-5 text-gray-500" />
                            </button>
                            <div>
                              <h3 className="text-xl font-extrabold text-gray-800 leading-none">
                                {selectedSubject?.class_name}
                              </h3>
                              <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">
                                Course Materials
                              </p>
                            </div>
                          </div>

                          {/* Notes content */}
                          {subjectNotesLoading ? (
                            <div className="bg-white rounded-[32px] p-16 flex items-center justify-center shadow-sm border border-gray-100">
                              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                              <p className="ml-4 text-gray-500 font-medium">Loading materials...</p>
                            </div>
                          ) : selectedNotes === null ? null : selectedNotes.length === 0 ? (
                            <div className="bg-white rounded-[32px] p-14 text-center border-2 border-dashed border-gray-200 shadow-sm">
                              <HiOutlineDocumentText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                              <p className="text-lg font-bold text-gray-400">No materials uploaded yet</p>
                              <p className="text-sm text-gray-400 mt-1">Check back later for course notes.</p>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                              {selectedNotes.map((note, ni) => {
                                const palette = TILE_PALETTES[ni % TILE_PALETTES.length];
                                return (
                                  <div
                                    key={note._id}
                                    className="bg-white rounded-[28px] p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                                  >
                                    <div className="flex items-start justify-between mb-4">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${palette.light}`}>
                                        <HiOutlineDocumentText className={`w-5 h-5 ${palette.text}`} />
                                      </div>
                                      <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">
                                        {new Date(note.upload_date).toLocaleDateString("en-US", {
                                          month: "short", day: "numeric", year: "numeric",
                                        })}
                                      </span>
                                    </div>

                                    <h4 className="text-base font-bold text-gray-800 leading-snug mb-1 group-hover:text-blue-600 transition-colors line-clamp-2">
                                      {note.title}
                                    </h4>

                                    {note.description && (
                                      <p className="text-sm text-gray-400 mb-4 line-clamp-2">
                                        {note.description}
                                      </p>
                                    )}

                                    <a
                                      href={`${API_BASE}${note.file_url}`}
                                      target="_blank"
                                      rel="noreferrer"
                                      className={`inline-flex items-center space-x-2 ${palette.bg} text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-md mt-2`}
                                    >
                                      <HiOutlineDownload className="w-4 h-4" />
                                      <span>Download</span>
                                    </a>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── FLOATING ACADEMIC AI BUTTON ── */}
        <button
          onClick={() => setChatOpen(true)}
          className="fixed bottom-10 right-10 flex items-center space-x-3 bg-blue-600 text-white px-8 py-4 rounded-full font-bold shadow-2xl hover:bg-blue-700 hover:-translate-y-2 transition-all z-[1000] border-4 border-white"
        >
          <HiOutlineSparkles className="w-6 h-6" />
          <span className="text-lg">Academic AI</span>
        </button>

        {/* ── ACADEMIC AI CHAT MODAL ── */}
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