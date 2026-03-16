import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  HiOutlineLogout,
  HiOutlineBookOpen,
  HiOutlineClipboardList,
  HiOutlineUser,
  HiOutlineCloudUpload,
  HiOutlineDocumentText,
  HiOutlineCalendar,
  HiOutlineClock
} from "react-icons/hi";

function FacultyDashboard() {
  // 1. URL & CONTEXT
  const { facultyId: urlFacultyId } = useParams();
  const { auth, logout } = useAuth();

  // 2. STATE MANAGEMENT
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(true);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // File Picker Refs
  const noteFileRef = useRef(null);
  const assignFileRef = useRef(null);
  const [selectedNoteFile, setSelectedNoteFile] = useState(null);
  const [selectedAssignFile, setSelectedAssignFile] = useState(null);

  // Content State
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", description: "", file_url: "" });
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({
    title: "", instructions: "", file_url: "", due_date: ""
  });

  // Weekend / Off-day Subjects
  const [allSubjects, setAllSubjects] = useState([]);
  const [showSubjectPicker, setShowSubjectPicker] = useState(false);
  const [selectedSubjectOffering, setSelectedSubjectOffering] = useState(null);

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // Create axios instance with auth headers
  const axiosInstance = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add auth token to all requests
  axiosInstance.interceptors.request.use((config) => {
    if (auth?.token) {
      config.headers.Authorization = `Bearer ${auth.token}`;
    }
    return config;
  });

  // Formatting Helpers
  const capitalizeName = (name) => {
    if (!name) return "";
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    let [hours, minutes] = timeString.split(':');
    let h = parseInt(hours);
    const ampm = (h >= 12) ? 'PM' : 'AM';
    let displayHours = h % 12 || 12;
    return `${displayHours}:${minutes} ${ampm}`;
  };

  // 3. FETCH CLASSES & ALL SUBJECTS
  useEffect(() => {
    const fetchDashboardData = async () => {
      const activeId = urlFacultyId || auth?.facultyId;
      if (!activeId) {
        return;
      }

      try {
        // Fetch Today's Classes
        const classesRes = await axiosInstance.get(`/api/faculty-dashboard/${activeId}`);
        setClasses(Array.isArray(classesRes.data) ? classesRes.data : []);

        // Fetch All Assigned Subjects (for weekend/off-day management)
        const subjectsRes = await axiosInstance.get(`/api/faculty/subjects/${activeId}`);
        setAllSubjects(Array.isArray(subjectsRes.data) ? subjectsRes.data : []);
      } catch (error) {
        console.error("Dashboard Data Fetch Error:", error);
      }
    };
    fetchDashboardData();
  }, [urlFacultyId, auth?.facultyId, API_BASE]);

  // 4. HANDLERS
  const handleClassSelection = async (cls) => {
    setSelectedClass(cls);
    setSelectedSubjectOffering(null);
    setIsFormVisible(true);
    setAttendanceMarked(false);
    setAttendance({});

    try {
      const [sRes, nRes, aRes] = await Promise.all([
        axiosInstance.get(`/api/faculty-dashboard/students/${cls.section_id}`),
        axiosInstance.get(`/api/notes/${cls.class_id}`),
        axiosInstance.get(`/api/assignments/${cls.class_id}`)
      ]);

      setStudents(sRes.data || []);
      setNotes(nRes.data || []);
      setAssignments(aRes.data || []);
    } catch (error) {
      console.error("Error fetching details:", error);
    }
  };

  const handleSubjectSelection = async (subject) => {
    setSelectedSubjectOffering(subject);
    setSelectedClass(null);
    setIsFormVisible(true);
    setAttendanceMarked(false);
    setAttendance({});
    setStudents([]);

    try {
      const [nRes, aRes] = await Promise.all([
        axiosInstance.get(`/api/notes/${subject.subject_offering_id}`),
        axiosInstance.get(`/api/assignments/${subject.subject_offering_id}`)
      ]);

      setNotes(nRes.data || []);
      setAssignments(aRes.data || []);
    } catch (error) {
      console.error("Error fetching subject details:", error);
    }
  };

  const handleMarkAllPresent = () => {
    const newAttendance = students.reduce((acc, student) => {
      acc[student._id] = "Present";
      return acc;
    }, {});
    setAttendance(newAttendance);
  };

  const handleMarkAttendance = async () => {
    if (!selectedClass) return;
    try {
      await axiosInstance.post(`/api/attendance`, {
        classId: selectedClass.class_id,
        sessionNo: selectedClass.session_no,
        attendanceData: attendance,
      });
      setAttendanceMarked(true);
      setIsModalVisible(true);
      setTimeout(() => setIsModalVisible(false), 2000);
    } catch (error) { 
      console.error("Error marking attendance:", error); 
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const targetSubjectId = selectedClass?.class_id || selectedSubjectOffering?.subject_offering_id;
    if (!targetSubjectId || !selectedNoteFile) return;

    const formData = new FormData();
    formData.append('file', selectedNoteFile);
    formData.append('subject_offering_id', targetSubjectId);
    formData.append('faculty_id', auth.facultyId);
    formData.append('title', newNote.title);
    formData.append('description', newNote.description || '');

    try {
      await axiosInstance.post(`/api/notes`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${auth.token}`
        }
      });

      alert("Note added successfully");
      setNewNote({ title: "", description: "", file_url: "" });
      setSelectedNoteFile(null);
      if (noteFileRef.current) noteFileRef.current.value = '';

      // Refresh notes list
      const res = await axiosInstance.get(`/api/notes/${targetSubjectId}`);
      setNotes(res.data);
    } catch (error) { 
      console.error(error);
      alert(error.response?.data?.message || 'Upload failed');
    }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    const targetSubjectId = selectedClass?.class_id || selectedSubjectOffering?.subject_offering_id;
    if (!targetSubjectId) return;

    const formData = new FormData();
    if (selectedAssignFile) {
      formData.append('file', selectedAssignFile);
    }
    formData.append('subject_offering_id', targetSubjectId);
    formData.append('title', newAssignment.title);
    formData.append('instructions', newAssignment.instructions);
    formData.append('due_date', newAssignment.due_date);

    try {
      await axiosInstance.post(`/api/faculty/assignments`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          Authorization: `Bearer ${auth.token}`
        }
      });

      alert("Assignment posted successfully!");
      setNewAssignment({ title: "", instructions: "", file_url: "", due_date: "" });
      setSelectedAssignFile(null);
      if (assignFileRef.current) assignFileRef.current.value = '';

      // Refresh assignments list
      const res = await axiosInstance.get(`/api/assignments/${targetSubjectId}`);
      setAssignments(res.data);
    } catch (error) { 
      console.error(error);
      alert(error.response?.data?.message || 'Upload failed');
    }
  };

  if (!auth || (Object.keys(auth).length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 bg-gray-50 font-antiqua">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua relative">
      <div className="max-w-7xl mx-auto">

        {/* --- HEADER: Individual Elements --- */}
        <div className="flex justify-between items-start mb-10">
          <div className="flex items-center space-x-4 p-2">
            <div className="h-14 w-14 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white shadow-lg">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div className="text-left">
              <h2 className="text-2xl font-bold text-gray-800 leading-none tracking-tight">
                {capitalizeName(auth?.name || auth?.facultyName) || "Faculty Member"}
              </h2>
              <p className="text-sm font-bold text-[#3b82f6] uppercase mt-1 tracking-widest">
                Faculty
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="flex items-center space-x-2 bg-white border-2 border-red-500 text-red-500 px-6 py-2.5 rounded-2xl font-bold text-sm hover:bg-red-500 hover:text-white transition-all shadow-md active:scale-95"
          >
            <span>LOGOUT</span>
            <HiOutlineLogout size={20} />
          </button>
        </div>

        {/* --- WELCOME TITLE --- */}
        <div className="mb-10 text-left px-2">
          <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight leading-tight">Faculty Dashboard</h1>
          <p className="text-xl text-gray-500 mt-1">
            Welcome back, <span className="text-[#3b82f6] font-bold">{capitalizeName(auth?.name?.split(' ')[0]) || "Professor"}</span>
          </p>
        </div>

        {/* --- SCHEDULE CARDS --- */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">Today's Academic Schedule</h2>

          {classes.length === 0 ? (
            /* --- NO CLASSES STATE (Weekends / Holidays) --- */
            <div className="flex flex-col space-y-8">
              <div className="bg-white rounded-[40px] p-12 md:p-16 shadow-sm border border-gray-100 flex flex-col items-center text-center">
                <div className="w-24 h-24 rounded-3xl bg-blue-50 flex items-center justify-center mb-8">
                  <HiOutlineCalendar className="w-14 h-14 text-blue-400" />
                </div>
                <h3 className="text-3xl font-extrabold text-gray-800 mb-3">No Classes Today</h3>
                <p className="text-lg text-gray-400 font-medium mb-6 max-w-md">
                  It's <span className="text-[#3b82f6] font-bold">{new Date().toLocaleDateString('en-US', { weekday: 'long' })}</span>
                </p>
                <div className="flex flex-wrap justify-center gap-3 mt-2">
                  <span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">
                    <HiOutlineClock className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
                    {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="bg-blue-50 text-blue-600 px-5 py-2.5 rounded-2xl text-xs font-bold uppercase tracking-widest">
                    <HiOutlineCalendar className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
                    {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </span>
                </div>

                <button
                  onClick={() => {
                    setShowSubjectPicker(!showSubjectPicker);
                    if (showSubjectPicker) {
                      setSelectedSubjectOffering(null);
                    }
                  }}
                  className="mt-10 bg-blue-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-blue-700 transition-all shadow-lg active:scale-95 uppercase tracking-widest"
                >
                  {showSubjectPicker ? "Hide Manage Resources" : "Manage Resources"}
                </button>
              </div>

              {showSubjectPicker && (
                <div className="animate-in fade-in slide-in-from-top-4 duration-500">
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4 ml-2">All Assigned Subjects</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allSubjects.map((sub) => (
                      <div
                        key={sub.subject_offering_id}
                        onClick={() => handleSubjectSelection(sub)}
                        className={`bg-white rounded-[32px] p-6 shadow-sm border-2 cursor-pointer transition-all duration-300 ${selectedSubjectOffering?.subject_offering_id === sub.subject_offering_id ? "border-blue-500 shadow-lg" : "border-transparent hover:border-blue-200"}`}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${selectedSubjectOffering?.subject_offering_id === sub.subject_offering_id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                            <HiOutlineBookOpen className="w-6 h-6" />
                          </div>
                          <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest">{sub.course_code}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-800 leading-tight mb-2">{sub.course_name}</h3>
                        <p className="text-[11px] text-gray-400 font-bold uppercase tracking-tighter">{sub.section_label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {classes.map((cls) => (
                <div
                  key={cls.class_id}
                  onClick={() => handleClassSelection(cls)}
                  className={`bg-white rounded-[40px] p-8 shadow-sm border-2 cursor-pointer transition-all duration-300 relative group ${selectedClass?.class_id === cls.class_id ? "border-blue-500 shadow-xl" : "border-transparent hover:border-blue-200"}`}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${selectedClass?.class_id === cls.class_id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                      <HiOutlineBookOpen className="w-8 h-8" />
                    </div>
                    <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest">Session {cls.session_no}</span>
                  </div>

                  <h3 className="text-2xl font-bold text-gray-800 leading-tight mb-1">{cls.class_name}</h3>
                  <span className="inline-block bg-blue-50 text-blue-600 text-[11px] font-bold px-3 py-1 rounded-lg uppercase">
                    {cls.section_name}
                  </span>

                  {/* --- DATE AND TIME UNDER SECTION --- */}
                  <div className="mt-8 space-y-3">
                    <div className="flex items-center space-x-3 text-gray-600">
                      <HiOutlineCalendar className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="font-bold text-gray-800 text-sm leading-none">{cls.day}</p>
                        <p className="text-[11px] text-gray-400 mt-1 uppercase">Current Schedule</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3 text-gray-600">
                      <HiOutlineClock className="w-5 h-5 text-gray-400" />
                      <p className="text-sm font-bold text-gray-700">
                        {formatTime(cls.start_time)} - {formatTime(cls.end_time || 'Next Slot')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {(selectedClass || selectedSubjectOffering) && isFormVisible && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in slide-in-from-bottom-4 duration-500">

            {/* --- ATTENDANCE SECTION --- */}
            {selectedClass && (
              <div className="bg-white rounded-[40px] p-10 shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-800">Attendance Marking</h3>
                  <button
                    onClick={handleMarkAllPresent}
                    className="text-xs font-bold text-green-600 uppercase border-b-2 border-green-600 hover:text-green-700 transition-colors tracking-widest"
                  >Mark All Present</button>
                </div>
                <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 mb-8 border-t border-gray-100 pt-6">
                  {students.map((student) => (
                    <div key={student._id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                      <span className="text-[17px] text-gray-700 font-medium">{student.student_name}</span>
                      <input
                        type="checkbox"
                        checked={attendance[student._id] === "Present"}
                        onChange={(e) => setAttendance({ ...attendance, [student._id]: e.target.checked ? "Present" : "Absent" })}
                        className="w-7 h-7 rounded-lg accent-blue-600 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleMarkAttendance}
                  disabled={attendanceMarked}
                  className={`w-full py-5 rounded-2xl text-lg font-bold transition-all ${attendanceMarked ? "bg-green-100 text-green-700 shadow-none cursor-default" : "bg-[#3b82f6] text-white shadow-lg hover:bg-blue-700 active:scale-[0.98]"}`}
                >
                  {attendanceMarked ? "✓ Attendance Successfully Submitted" : "Submit Attendance Record"}
                </button>
              </div>
            )}

            {/* --- RESOURCES & ASSIGNMENTS --- */}
            <div className={`space-y-8 ${!selectedClass ? 'lg:col-span-2 max-w-4xl mx-auto w-full' : ''}`}>
              {/* Resources */}
              <div className="bg-white rounded-[40px] p-10 shadow-sm border-t-8 border-purple-500 border-x border-b border-gray-100">
                <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                  <HiOutlineCloudUpload className="mr-3 text-purple-600 w-8 h-8" /> Upload Resources
                </h3>
                {selectedSubjectOffering && (
                  <p className="text-sm font-bold text-gray-400 mb-6 uppercase tracking-widest bg-purple-50 p-3 rounded-xl inline-block">
                    Target: <span className="text-purple-600">{selectedSubjectOffering.course_name}</span>
                  </p>
                )}
                <div onClick={() => noteFileRef.current?.click()} className="border-2 border-dashed border-purple-100 rounded-[24px] p-10 flex flex-col items-center justify-center bg-purple-50/30 cursor-pointer mb-6 hover:bg-purple-50 transition-colors group">
                  <input type="file" ref={noteFileRef} className="hidden" onChange={(e) => { setSelectedNoteFile(e.target.files[0]); setNewNote({ ...newNote, title: e.target.files[0]?.name || '' }) }} accept=".pdf,.doc,.docx,.txt" />
                  <HiOutlineDocumentText className="w-12 h-12 text-purple-300 mb-2 group-hover:scale-110 transition-transform" />
                  <p className="text-sm font-bold text-purple-400 uppercase tracking-widest text-center">{selectedNoteFile ? selectedNoteFile.name : "Choose PDF/DOC/TXT to Upload"}</p>
                </div>
                <form onSubmit={handleAddNote}>
                  <input type="text" placeholder="Document Title" value={newNote.title} onChange={(e) => setNewNote({ ...newNote, title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg outline-none focus:ring-2 focus:ring-purple-400 transition-all" required />
                  <textarea placeholder="Description (optional)" value={newNote.description} onChange={(e) => setNewNote({ ...newNote, description: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 h-24 text-lg outline-none focus:ring-2 focus:ring-purple-400 transition-all" />
                  <button type="submit" disabled={!selectedNoteFile} className="w-full bg-purple-600 text-white py-5 rounded-2xl text-lg font-bold shadow-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all uppercase tracking-widest">Publish Resource</button>
                </form>

                {/* Uploaded Notes List */}
                {notes.length > 0 && (
                  <div className="mt-8 pt-8 border-t border-purple-100">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">Uploaded Notes ({notes.length})</h4>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                      {notes.map((note) => (
                        <div key={note._id} className="flex justify-between items-center p-4 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-100">
                          <div>
                            <h5 className="font-bold text-gray-800">{note.title}</h5>
                            <p className="text-sm text-gray-500">{new Date(note.upload_date).toLocaleDateString()}</p>
                          </div>
                          <a href={`${API_BASE}${note.file_url}`} target="_blank" rel="noreferrer" className="bg-purple-600 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-purple-700 transition-all">VIEW</a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Assignment - Only show if selectedClass (not for weekend/off-day subjects) */}
              {selectedClass && (
                <div className="bg-white rounded-[40px] p-10 shadow-sm border-t-8 border-orange-500 border-x border-b border-gray-100">
                  <h3 className="text-2xl font-bold mb-6 flex items-center text-gray-800">
                    <HiOutlineClipboardList className="mr-3 text-orange-600 w-8 h-8" /> Assign New Task
                  </h3>
                  <div onClick={() => assignFileRef.current?.click()} className="border-2 border-dashed border-orange-100 rounded-[24px] p-10 flex flex-col items-center justify-center bg-orange-50/30 cursor-pointer mb-6 hover:bg-orange-50 transition-colors group">
                    <input type="file" ref={assignFileRef} className="hidden" onChange={(e) => setSelectedAssignFile(e.target.files[0])} accept=".pdf,.doc,.docx,.txt" />
                    <HiOutlineDocumentText className="w-12 h-12 text-orange-300 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-orange-400 uppercase tracking-widest text-center">{selectedAssignFile ? selectedAssignFile.name : "Optional: Attach File"}</p>
                  </div>
                  <form onSubmit={handleAddAssignment}>
                    <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({ ...newAssignment, title: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg outline-none focus:ring-2 focus:ring-orange-400 transition-all" required />
                    <textarea placeholder="Instructions for Students..." value={newAssignment.instructions} onChange={(e) => setNewAssignment({ ...newAssignment, instructions: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg h-28 outline-none focus:ring-2 focus:ring-orange-400 transition-all" required />
                    <div className="flex flex-col mb-6">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-2">Due Date</label>
                      <input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({ ...newAssignment, due_date: e.target.value })} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-lg text-gray-500 focus:ring-2 focus:ring-orange-400 transition-all" required />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white py-5 rounded-2xl text-lg font-bold shadow-lg hover:bg-orange-600 transition-all uppercase tracking-widest">Post Assignment</button>
                  </form>

                  {/* Posted Assignments List */}
                  {assignments.length > 0 && (
                    <div className="mt-8 pt-8 border-t border-orange-100">
                      <h4 className="text-xl font-bold text-gray-800 mb-4">Posted Assignments ({assignments.length})</h4>
                      <div className="space-y-3 max-h-80 overflow-y-auto">
                        {assignments.map((asm) => (
                          <div key={asm._id} className="p-4 bg-gradient-to-r from-orange-50 to-rose-50 rounded-2xl border border-orange-100">
                            <div className="flex justify-between items-start mb-2">
                              <h5 className="font-bold text-gray-800">{asm.title}</h5>
                              <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-bold">Due: {new Date(asm.due_date).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-600 mb-3">{asm.instructions.substring(0, 100)}...</p>
                            {asm.file_url && (
                              <a href={`${API_BASE}${asm.file_url}`} target="_blank" rel="noreferrer" className="text-orange-600 font-bold text-sm underline">Download Attachment</a>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* --- SUCCESS MODAL --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-12 rounded-[50px] shadow-2xl animate-in zoom-in duration-300 flex flex-col items-center border border-gray-100">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-4xl font-bold shadow-inner shadow-green-200/50">✓</div>
            <h3 className="text-3xl font-bold text-gray-800 text-center">Attendance Logged</h3>
            <p className="text-[#64748b] text-center text-lg mt-2 font-medium">Class records have been updated.</p>
          </div>
        </div>
      )}

      <footer className="max-w-7xl mx-auto mt-12 mb-8 text-center text-[16px] text-[#94a3b8] italic">
        © 2026 Campus Management System
      </footer>
    </div>
  );
}

export default FacultyDashboard;