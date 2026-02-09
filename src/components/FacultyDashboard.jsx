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
  HiOutlineEye,
  HiOutlineEyeOff
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

  // 5. CRITICAL GUARD: Prevents crash if auth is loading or null
  if (!auth || (Object.keys(auth).length === 0)) {
    return (
      <div className="min-h-screen flex items-center justify-center font-bold text-blue-600 bg-gray-50">
        Authenticating...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8f9fa] p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* --- HEADER --- */}
        <header className="flex justify-between items-center mb-10 py-2">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center text-white shadow-md">
              <HiOutlineUser className="w-7 h-7" />
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gray-900 leading-none">
                {auth?.name || auth?.facultyName || "Faculty Member"}
              </span>
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mt-1">
                Faculty ID: {urlFacultyId || auth?.facultyId}
              </span>
            </div>
          </div>
          <button onClick={logout} className="bg-red-50 text-red-600 px-4 py-2 rounded-lg font-bold text-[10px] hover:bg-red-600 hover:text-white transition-all border border-red-100 uppercase flex items-center gap-2">
            LOGOUT <HiOutlineLogout className="w-4 h-4" />
          </button>
        </header>

        {/* --- WELCOME TITLE --- */}
        <div className="mb-10">
          <h1 className="text-[34px] font-black text-[#1e293b] leading-tight tracking-tight">Faculty Dashboard</h1>
          <p className="text-[#64748b] text-lg font-medium">
            {/* SAFE SPLIT: Notice the use of ?. to prevent crash if name is missing */}
            Welcome back, <span className="text-[#2563eb] font-bold">{auth?.name?.split(' ')[0] || "Professor"}</span>
          </p>
        </div>

        {/* --- SCHEDULE CARDS --- */}
        <div className="mb-10">
          <h2 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Today's Schedule</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classes.map((cls) => (
              <div 
                key={cls.class_id} 
                onClick={() => handleClassSelection(cls)}
                className={`bg-white rounded-[32px] p-6 shadow-sm border-2 cursor-pointer transition-all duration-300 ${selectedClass?.class_id === cls.class_id ? "border-blue-600 shadow-xl scale-[1.02]" : "border-transparent hover:border-blue-100"}`}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${selectedClass?.class_id === cls.class_id ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    <HiOutlineBookOpen className="w-6 h-6" />
                  </div>
                  <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Session {cls.session_no}</span>
                </div>
                <h3 className="text-xl font-bold text-gray-800 leading-tight mb-1">{cls.class_name}</h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">{cls.section_name}</p>
                
                <div className="w-full bg-[#0f172a] text-white py-4 rounded-2xl text-center text-[10px] font-black uppercase tracking-tighter">
                  {cls.class_name} • {cls.section_name} • {cls.day} • {cls.start_time}
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedClass && isFormVisible && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in slide-in-from-bottom-5 duration-500">
            
            {/* --- ATTENDANCE SECTION --- */}
            <div className="bg-white rounded-[40px] p-8 shadow-sm border border-gray-100 h-fit">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-800">Attendance</h3>
                <button 
                   onClick={handleMarkAllPresent}
                   className="text-[10px] font-black text-green-600 uppercase border-b-2 border-green-600 pb-0.5"
                >Mark All Present</button>
              </div>
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 mb-8 custom-scrollbar border-t pt-4">
                {students.map((student) => (
                  <div key={student._id} className="flex justify-between items-center p-4 bg-gray-50 rounded-2xl">
                    <span className="text-sm font-bold text-gray-700">{student.student_name}</span>
                    <input 
                      type="checkbox" 
                      checked={attendance[student._id] === "Present"} 
                      onChange={(e) => setAttendance({...attendance, [student._id]: e.target.checked ? "Present" : "Absent"})} 
                      className="w-6 h-6 rounded-lg accent-blue-600 cursor-pointer" 
                    />
                  </div>
                ))}
              </div>
              <button 
                onClick={handleMarkAttendance} 
                disabled={attendanceMarked}
                className={`w-full py-5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${attendanceMarked ? "bg-green-100 text-green-700" : "bg-[#0f172a] text-white shadow-lg active:scale-95"}`}
              >
                {attendanceMarked ? "✓ Attendance Submitted" : "Submit Attendance"}
              </button>
            </div>

            {/* --- RESOURCES & ASSIGNMENTS --- */}
            <div className="space-y-8">
              {/* Resources */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border-t-8 border-purple-500">
                 <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                   <HiOutlineCloudUpload className="mr-3 text-purple-600 w-6 h-6" /> Class Resources
                 </h3>
                 <div onClick={() => noteFileRef.current.click()} className="border-2 border-dashed border-purple-100 rounded-[30px] p-10 flex flex-col items-center justify-center bg-purple-50/30 cursor-pointer mb-6">
                   <input type="file" ref={noteFileRef} className="hidden" onChange={(e) => {setSelectedNoteFile(e.target.files[0]); setNewNote({...newNote, title: e.target.files[0]?.name})}} />
                   <HiOutlineDocumentText className="w-10 h-10 text-purple-300 mb-2" />
                   <p className="text-[10px] font-black text-purple-400 uppercase text-center">{selectedNoteFile ? selectedNoteFile.name : "Select Document"}</p>
                 </div>
                 <form onSubmit={handleAddNote}>
                    <input type="text" placeholder="Title" value={newNote.title} onChange={(e) => setNewNote({...newNote, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl mb-4 text-sm font-medium outline-none border border-transparent focus:border-purple-200" required />
                    <button type="submit" className="w-full bg-purple-600 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-purple-100 active:scale-95 transition-all">Upload Resource</button>
                 </form>
              </div>

              {/* Assignment */}
              <div className="bg-white rounded-[40px] p-8 shadow-sm border-t-8 border-orange-500">
                 <h3 className="text-xl font-bold mb-6 flex items-center text-gray-800">
                   <HiOutlineClipboardList className="mr-3 text-orange-600 w-6 h-6" /> Post Assignment
                 </h3>
                 <form onSubmit={handleAddAssignment}>
                    <input type="text" placeholder="Assignment Title" value={newAssignment.title} onChange={(e) => setNewAssignment({...newAssignment, title: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl mb-4 text-sm font-medium outline-none border border-transparent focus:border-orange-200" required />
                    <textarea placeholder="Instructions" value={newAssignment.instructions} onChange={(e) => setNewAssignment({...newAssignment, instructions: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl mb-4 text-sm font-medium outline-none border border-transparent focus:border-orange-200 h-24" />
                    <input type="date" value={newAssignment.due_date} onChange={(e) => setNewAssignment({...newAssignment, due_date: e.target.value})} className="w-full px-6 py-4 bg-gray-50 rounded-2xl mb-6 text-sm text-gray-500 outline-none border border-transparent focus:border-orange-200" required />
                    <button type="submit" className="w-full bg-orange-500 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-orange-100 active:scale-95 transition-all">Publish Assignment</button>
                 </form>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- SUCCESS MODAL --- */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/40 backdrop-blur-sm z-50 p-4">
          <div className="bg-white p-12 rounded-[50px] shadow-2xl animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl font-bold">✓</div>
            <h3 className="text-2xl font-black text-gray-800 text-center tracking-tighter">Attendance Logged</h3>
            <p className="text-gray-500 text-center text-sm font-medium mt-2">Class records updated successfully.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;