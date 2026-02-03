import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout, HiOutlineBookOpen, HiOutlineClipboardList } from "react-icons/hi";

function FacultyDashboard() {
  const { auth, logout } = useAuth();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState(null);
  const [attendanceMarked, setAttendanceMarked] = useState(false);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [isFormVisible, setIsFormVisible] = useState(true); 
  const [isModalVisible, setIsModalVisible] = useState(false); 
  
  // Notes State
  const [notes, setNotes] = useState([]);
  const [newNote, setNewNote] = useState({ title: "", description: "", file_url: "" });

  // Assignment State
  const [assignments, setAssignments] = useState([]);
  const [newAssignment, setNewAssignment] = useState({ 
    title: "", 
    instructions: "", 
    file_url: "", 
    due_date: "" 
  });

  useEffect(() => {
    const fetchClasses = async () => {
      try {
        if (!auth.facultyId) return;
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/faculty-dashboard/${auth.facultyId}`
        );
        setClasses(response.data);
      } catch (error) {
        console.error("Error fetching classes:", error);
      }
    };

    if (auth.facultyId) fetchClasses();
  }, [auth.facultyId]);

  const handleClassSelection = async (cls) => {
    setSelectedClass(cls);
    setIsFormVisible(true);
    setAttendanceMarked(false);
    setAttendance({});
    
    try {
      const studentResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/faculty-dashboard/students/${cls.section_id}`
      );
      setStudents(studentResponse.data);

      const notesResponse = await axios.get(
         `${import.meta.env.VITE_API_BASE_URL}/api/notes/${cls.class_id}`
      );
      setNotes(notesResponse.data);

      const assignResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/assignments/${cls.class_id}`
      );
      setAssignments(assignResponse.data);

    } catch (error) {
      console.error("Error fetching class details:", error);
    }
  };

  const handleCheckboxChange = (studentId, isChecked) => {
    setAttendance((prev) => ({
      ...prev,
      [studentId]: isChecked ? "Present" : "Absent",
    }));
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
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/attendance`, {
        classId: selectedClass.class_id,
        sessionNo : selectedClass.session_no,
        attendanceData: attendance,
      });
      setAttendanceMarked(true);
      setIsModalVisible(true); 
      setTimeout(() => setIsModalVisible(false), 2000); 
    } catch (error) {
      console.error("Error marking attendance:", error);
    }
  };

  const handleNoteChange = (e) => {
    setNewNote({ ...newNote, [e.target.name]: e.target.value });
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subject_offering_id: selectedClass.class_id,
        faculty_id: auth.facultyId,
        ...newNote
      };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/notes`, payload);
      alert("Note added successfully");
      setNewNote({ title: "", description: "", file_url: "" });
      
      const notesResponse = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/notes/${selectedClass.class_id}`);
      setNotes(notesResponse.data);
    } catch (error) {
      console.error("Error adding note:", error);
    }
  };

  const handleAssignmentChange = (e) => {
    setNewAssignment({ ...newAssignment, [e.target.name]: e.target.value });
  };

  const handleAddAssignment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        subject_offering_id: selectedClass.class_id,
        ...newAssignment
      };
      await axios.post(`${import.meta.env.VITE_API_BASE_URL}/api/faculty/assignments`, payload);
      alert("Assignment document posted successfully!");
      setNewAssignment({ title: "", instructions: "", file_url: "", due_date: "" });
      
      const res = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/api/assignments/${selectedClass.class_id}`);
      setAssignments(res.data);
    } catch (error) {
      console.error("Error adding assignment:", error);
      alert("Failed to post assignment");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="relative flex justify-center items-center mb-8">
        <h1 className="text-3xl font-extrabold text-blue-700">Faculty Dashboard</h1>
        <button onClick={logout} className="absolute right-0 p-3 rounded-full bg-red-500 text-white hover:bg-red-600 transition shadow-lg">
          <HiOutlineLogout className="w-6 h-6" />
        </button>
      </header>

      {/* Schedule Selection */}
      <div className="mb-10">
        <h2 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-blue-200 pb-2">Today's Schedule</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div key={cls.class_id} className={`p-5 bg-white shadow-md rounded-xl border-l-8 transition ${selectedClass?.class_id === cls.class_id ? "border-blue-600 scale-105" : "border-gray-300 hover:border-blue-400"}`}>
                <h3 className="text-lg font-bold text-gray-800 mb-1">{cls.class_name}</h3>
                <p className="text-gray-500 text-sm font-semibold">{cls.section_name}</p>
                <p className="text-blue-600 text-xs mt-2 uppercase tracking-wider">Session {cls.session_no}</p>
                <button onClick={() => handleClassSelection(cls)} className={`mt-4 w-full py-2 rounded-lg font-bold transition ${selectedClass?.class_id === cls.class_id ? "bg-blue-700 text-white" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
                  {selectedClass?.class_id === cls.class_id ? "Currently Managing" : "Manage Class"}
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500 italic">No classes scheduled for today.</p>
          )}
        </div>
      </div>

      {selectedClass && isFormVisible && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Attendance Section */}
          <div className="p-6 bg-white shadow-xl rounded-2xl h-fit border border-gray-200">
            <h3 className="text-xl font-bold mb-5 flex items-center text-gray-800">
               <HiOutlineClipboardList className="mr-3 text-blue-600 w-7 h-7" /> Attendance: {selectedClass.class_name}
            </h3>
            <div className="flex gap-2 mb-4">
                <button onClick={handleMarkAllPresent} className="flex-1 py-2 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition shadow-sm">
                    Mark All Present
                </button>
            </div>
            <div className="space-y-2 mb-6 max-h-[500px] overflow-y-auto pr-2 border-t border-b py-4">
              {students.map((student) => (
                <div key={student._id} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition">
                  <span className="text-sm font-semibold text-gray-700"><b className="mr-3 text-blue-600">{student.student_id_no}</b> {student.student_name}</span>
                  <input type="checkbox" checked={attendance[student._id] === "Present"} onChange={(e) => handleCheckboxChange(student._id, e.target.checked)} className="w-6 h-6 rounded-md accent-green-600 cursor-pointer" />
                </div>
              ))}
            </div>
            <button onClick={handleMarkAttendance} className={`w-full py-4 rounded-xl text-lg font-black transition-all ${attendanceMarked ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white"}`} disabled={attendanceMarked}>
              {attendanceMarked ? "✓ ATTENDANCE SUBMITTED" : "SUBMIT ATTENDANCE"}
            </button>
          </div>

          {/* Resources & Assignments Section */}
          <div className="space-y-8">
            
            {/* Class Resources (Notes) - Conflict Resolved by using specific side-border colors */}
            <div className="p-6 bg-white shadow-xl rounded-2xl border-t-8 border-purple-500 border-x border-x-gray-200 border-b border-b-gray-200">
               <h3 className="text-xl font-bold mb-4 flex items-center text-purple-700">
                 <HiOutlineBookOpen className="mr-3 w-7 h-7" /> Class Resources
               </h3>
               <form onSubmit={handleAddNote} className="space-y-3 mb-6 bg-purple-50 p-5 rounded-xl">
                 <input type="text" name="title" placeholder="Resource Title" value={newNote.title} onChange={handleNoteChange} className="p-3 border rounded-lg w-full text-sm focus:ring-2 focus:ring-purple-400 outline-none" required />
                 <input type="url" name="file_url" placeholder="Document Link" value={newNote.file_url} onChange={handleNoteChange} className="p-3 border rounded-lg w-full text-sm focus:ring-2 focus:ring-purple-400 outline-none" required />
                 <button type="submit" className="w-full bg-purple-600 text-white py-3 rounded-lg font-bold hover:bg-purple-700 transition">Add Resource</button>
               </form>
               <div className="max-h-48 overflow-y-auto space-y-2">
                  {notes.map(note => (
                    <div key={note._id} className="p-3 border border-purple-100 rounded-lg bg-white flex justify-between items-center shadow-sm">
                       <span className="text-sm font-bold text-gray-700 truncate mr-4">{note.title}</span>
                       <a href={note.file_url} target="_blank" rel="noreferrer" className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-xs font-black uppercase hover:bg-purple-200 transition">View</a>
                    </div>
                  ))}
               </div>
            </div>

            {/* Assignments Section - Conflict Resolved by using specific side-border colors */}
            <div className="p-6 bg-white shadow-xl rounded-2xl border-t-8 border-orange-500 border-x border-x-gray-200 border-b border-b-gray-200">
               <h3 className="text-xl font-bold mb-4 flex items-center text-orange-600">
                 <HiOutlineClipboardList className="mr-3 w-7 h-7" /> Post Assignment
               </h3>
               <form onSubmit={handleAddAssignment} className="space-y-3 mb-6 bg-orange-50 p-5 rounded-xl">
                 <input type="text" name="title" placeholder="Assignment Title" value={newAssignment.title} onChange={handleAssignmentChange} className="p-3 border rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-400 outline-none" required />
                 <textarea name="instructions" placeholder="Brief instructions..." value={newAssignment.instructions} onChange={handleAssignmentChange} className="p-3 border rounded-lg w-full text-sm h-20 outline-none" />
                 
                 <input type="url" name="file_url" placeholder="Assignment Document Link" value={newAssignment.file_url} onChange={handleAssignmentChange} className="p-3 border rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-400 outline-none" required />
                 
                 <div className="flex flex-col">
                   <label className="text-xs font-black text-orange-700 mb-1 ml-1 uppercase">Due Date</label>
                   <input type="date" name="due_date" value={newAssignment.due_date} onChange={handleAssignmentChange} className="p-3 border rounded-lg w-full text-sm focus:ring-2 focus:ring-orange-400 outline-none" required />
                 </div>
                 <button type="submit" className="w-full bg-orange-500 text-white py-3 rounded-lg font-bold hover:bg-orange-600 transition">Post Assignment</button>
               </form>
               <div className="max-h-48 overflow-y-auto space-y-2">
                  {assignments.map(a => (
                    <div key={a._id} className="p-4 border border-orange-100 rounded-lg bg-white shadow-sm">
                       <div className="flex justify-between items-start mb-2">
                         <h4 className="text-sm font-black text-gray-800">{a.title}</h4>
                         <span className="text-[10px] bg-red-100 text-red-600 px-2 py-1 rounded-md font-black uppercase">
                           Due: {new Date(a.due_date).toLocaleDateString()}
                         </span>
                       </div>
                       <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">{a.instructions}</p>
                       {a.file_url && (
                         <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 text-xs font-bold underline decoration-2 underline-offset-4">
                           View Assignment Doc
                         </a>
                       )}
                    </div>
                  ))}
               </div>
            </div>

          </div>
        </div>
      )}

      {/* Success Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/60 backdrop-blur-sm z-50">
          <div className="bg-white p-8 rounded-3xl shadow-2xl transform transition-all animate-bounce">
            <h3 className="text-2xl font-black text-green-600 text-center">✓ Attendance Marked!</h3>
            <p className="text-gray-500 text-center mt-2">The session records have been updated.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;