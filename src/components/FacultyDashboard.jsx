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
  HiOutlineDocumentText
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

  const API_BASE = import.meta.env.VITE_API_BASE_URL;

  // 3. FETCH CLASSES
  useEffect(() => {
    const fetchClasses = async () => {
      const activeId = urlFacultyId || auth?.facultyId;
      if (!activeId) return;

      try {
        const response = await axios.get(`${API_BASE}/api/faculty-dashboard/${activeId}`);
        setClasses(Array.isArray(response.data) ? response.data : []);
      } catch (error) { 
        console.error("Error fetching classes:", error); 
      }
    };
    fetchClasses();
  }, [urlFacultyId, auth?.facultyId, API_BASE]);

  // 4. HANDLERS
  const handleClassSelection = async (cls) => {
    setSelectedClass(cls);
    setIsFormVisible(true);
    setAttendanceMarked(false);
    setAttendance({});
    try {
      const [sRes, nRes, aRes] = await Promise.all([
        axios.get(`${API_BASE}/api/faculty-dashboard/students/${cls.section_id}`),
        axios.get(`${API_BASE}/api/notes/${cls.class_id}`),
        axios.get(`${API_BASE}/api/assignments/${cls.class_id}`)
      ]);
      setStudents(sRes.data || []);
      setNotes(nRes.data || []);
      setAssignments(aRes.data || []);
    } catch (error) { 
        console.error("Error fetching details:", error); 
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
      await axios.post(`${API_BASE}/api/attendance`, {
        classId: selectedClass.class_id,
        sessionNo: selectedClass.session_no,
        attendanceData: attendance,
      });
      setAttendanceMarked(true);
      setIsModalVisible(true); 
      setTimeout(() => setIsModalVisible(false), 2000); 
    } catch (error) { console.error("Error marking attendance:", error); }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        subject_offering_id: selectedClass.class_id, 
        faculty_id: auth.facultyId, 
        ...newNote 
      };
      await axios.post(`${API_BASE}/api/notes`, payload);
      alert("Note added successfully");
      setNewNote({ title: "", description: "", file_url: "" });
      setSelectedNoteFile(null);
      const res = await axios.get(`${API_BASE}/api/notes/${selectedClass.class_id}`);
      setNotes(res.data);
    } catch (error) { console.error(error); }
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = { 
        subject_offering_id: selectedClass.class_id, 
        ...newAssignment 
      };
      await axios.post(`${API_BASE}/api/faculty/assignments`, payload);
      alert("Assignment posted successfully!");
      setNewAssignment({ title: "", instructions: "", file_url: "", due_date: "" });
      setSelectedAssignFile(null);
      const res = await axios.get(`${API_BASE}/api/assignments/${selectedClass.class_id}`);
      setAssignments(res.data);
    } catch (error) { console.error(error); }
  };

  // 5. CRITICAL GUARD
  if (!auth || (Object.keys(auth).length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 bg-gray-50 font-antiqua">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f0f2f5] p-4 md:p-8 font-antiqua">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-10">
          <div className="flex items-center space-x-4">
            <div className="h-14 w-14 rounded-2xl bg-[#3b82f6] flex items-center justify-center text-white shadow-lg shadow-blue-100">
              <HiOutlineUser className="w-8 h-8" />
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-normal text-[#2b2b2b]">
                {auth?.name || auth?.facultyName || "Faculty Member"}
              </span>
              <span className="text-xs font-bold text-[#3b82f6] uppercase tracking-wider">
                ID: {urlFacultyId || auth?.facultyId}
              </span>
            </div>
          </div>
          
          <button 
            onClick={logout} 
            className="flex items-center gap-2 px-6 py-2.5 bg-white border border-red-500 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm group"
          >
            <span className="text-[17px]">Logout</span>
            <HiOutlineLogout size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </header>

        {/* --- WELCOME TITLE --- */}
        <div className="mb-10">
          <h1 className="text-[36px] text-[#2b2b2b] leading-tight">Faculty Dashboard</h1>
          <p className="text-[#64748b] text-xl">
            Welcome back, <span className="text-[#3b82f6] font-bold">{auth?.name?.split(' ')[0] || "Professor"}</span>
          </p>
        </div>

        {/* --- SCHEDULE CARDS --- */}
        <div className="mb-10">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6 border-l-4 border-blue-500 pl-4">Today's Academic Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {classes.map((cls) => (
              <div 
                key={cls.class_id} 
                onClick={() => handleClassSelection(cls)}
                className={`bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-2 cursor-pointer transition-all duration-300 ${selectedClass?.class_id === cls.class_id ? "border-blue-500 shadow-xl scale-[1.02]" : "border-transparent hover:border-blue-200"}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${selectedClass?.class_id === cls.class_id ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-500'}`}>
                    <HiOutlineBookOpen className="w-8 h-8" />
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide">Session {cls.session_no}</span>
                </div>
                <h3 className="text-2xl text-gray-800 mb-1">{cls.class_name}</h3>
                <p className="text-sm font-bold text-[#3b82f6] uppercase tracking-widest mb-6">{cls.section_name}</p>
                
                <div className="w-full bg-[#1e293b] text-white py-4 rounded-2xl text-center text-xs font-bold uppercase tracking-wide">
                   {cls.day} • {cls.start_time} - {cls.end_time || 'Next Slot'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedClass && isFormVisible && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12 animate-in slide-in-from-bottom-4 duration-500">
            
            {/* --- ATTENDANCE SECTION --- */}
            <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl text-gray-800">Attendance Marking</h3>
                <button 
                   onClick={handleMarkAllPresent}
                   className="text-xs font-bold text-green-600 uppercase border-b-2 border-green-600 hover:text-green-700 transition-colors"
                >Mark All Present</button>
              </div>
              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 mb-8 border-t border-gray-100 pt-6">
                {students.map((student) => (
                  <div key={student._id} className="flex justify-between items-center p-5 bg-gray-50 rounded-2xl border border-transparent hover:border-blue-100 transition-all">
                    <span className="text-[17px] text-gray-700">{student.student_name}</span>
                    <input 
                      type="checkbox" 
                      checked={attendance[student._id] === "Present"} 
                      onChange={(e) => setAttendance({...attendance, [student._id]: e.target.checked ? "Present" : "Absent"})} 
                      className="w-7 h-7 rounded-lg accent-blue-600 cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleMarkAttendance} 
                disabled={attendanceMarked}
                className={`w-full py-5 rounded-2xl text-lg transition-all ${attendanceMarked ? "bg-green-100 text-green-700" : "bg-[#3b82f6] text-white shadow-lg hover:bg-blue-600 active:scale-[0.98]"}`}
              >
                {attendanceMarked ? "✓ Attendance Successfully Submitted" : "Submit Attendance Record"}
              </button>
            </div>

            {/* --- RESOURCES & ASSIGNMENTS --- */}
            <div className="space-y-8">
              {/* Resources */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-t-8 border-purple-500">
                 <h3 className="text-2xl mb-6 flex items-center text-gray-800">
                   <HiOutlineCloudUpload className="mr-3 text-purple-600 w-8 h-8" /> Upload Resources
                 </h3>
                 <div onClick={() => noteFileRef.current.click()} className="border-2 border-dashed border-purple-100 rounded-[24px] p-10 flex flex-col items-center justify-center bg-purple-50/30 cursor-pointer mb-6 hover:bg-purple-50 transition-colors">
                   <input type="file" ref={noteFileRef} className="hidden" onChange={(e) => {setSelectedNoteFile(e.target.files[0]); setNewNote({...newNote, title: e.target.files[0]?.name})}} />
                   <HiOutlineDocumentText className="w-12 h-12 text-purple-300 mb-2" />
                   <p className="text-sm font-bold text-purple-400 uppercase tracking-widest text-center">{selectedNoteFile ? selectedNoteFile.name : "Choose File to Upload"}</p>
                 </div>
                 <form onSubmit={handleAddNote}>
                    <input type="text" placeholder="Document Title" value={newNote.title} onChange={(e) => setNewNote({...newNote, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg outline-none focus:ring-2 focus:ring-purple-400 transition-all" required />
                    <button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-2xl text-lg shadow-lg hover:bg-purple-700 transition-all">Publish Resource</button>
                 </form>
              </div>

              {/* Assignment */}
              <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border-t-8 border-orange-500">
                 <h3 className="text-2xl mb-6 flex items-center text-gray-800">
                   <HiOutlineClipboardList className="mr-3 text-orange-600 w-8 h-8" /> Assign New Task
                 </h3>
                 <form onSubmit={handleAddAssignment}>
                    <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg outline-none focus:ring-2 focus:ring-orange-400 transition-all" required />
                    <textarea placeholder="Instructions for Students..." value={newAssignment.instructions} onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl mb-4 text-lg h-28 outline-none focus:ring-2 focus:ring-orange-400 transition-all" />
                    <div className="flex flex-col mb-6">
                       <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 ml-2">Due Date</label>
                       <input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl text-lg text-gray-500 focus:ring-2 focus:ring-orange-400 transition-all" required />
                    </div>
                    <button type="submit" className="w-full bg-orange-500 text-white py-5 rounded-2xl text-lg shadow-lg hover:bg-orange-600 transition-all">Post Assignment</button>
                 </form>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- SUCCESS MODAL --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-12 rounded-[40px] shadow-2xl animate-in zoom-in duration-300 flex flex-col items-center">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6 text-4xl">✓</div>
            <h3 className="text-3xl text-gray-800 text-center">Attendance Logged</h3>
            <p className="text-[#64748b] text-center text-lg mt-2">Class records have been updated.</p>
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