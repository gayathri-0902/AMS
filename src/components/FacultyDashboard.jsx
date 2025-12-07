import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";

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
    
    // Fetch Students
    try {
      const studentResponse = await axios.get(
        `${import.meta.env.VITE_API_BASE_URL}/api/faculty-dashboard/students/${cls.section_id}`
      );
      setStudents(studentResponse.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }

    // Fetch Notes (using cls.class_id which maps to subject_offering_id)
    try {
       const notesResponse = await axios.get(
         `${import.meta.env.VITE_API_BASE_URL}/api/notes/${cls.class_id}`
       );
       setNotes(notesResponse.data);
    } catch (error) {
       console.error("Error fetching notes:", error);
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
      
      // Refresh notes
      const notesResponse = await axios.get(
         `${import.meta.env.VITE_API_BASE_URL}/api/notes/${selectedClass.class_id}`
       );
       setNotes(notesResponse.data);

    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note");
    }
  };

  const toggleFormVisibility = () => {
    setIsFormVisible((prevState) => !prevState);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">Faculty Dashboard</h1>
      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>

      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-4">Today's Schedule</h2>
        <div className="space-y-4">
          {classes.length > 0 ? (
            classes.map((cls) => (
              <div
                key={cls.class_id}
                className="flex justify-between items-center p-4 bg-white shadow rounded-lg"
              >
                <div>
                  <h3 className="text-lg font-medium">{cls.class_name}</h3>
                  <p className="text-gray-600">{cls.section_name}</p>
                </div>
                <button
                  onClick={() => handleClassSelection(cls)}
                  className={`px-4 py-2 rounded-lg hover:bg-blue-600 ${
                    selectedClass?.class_id === cls.class_id
                      ? "bg-blue-700 text-white"
                      : "bg-blue-500 text-white"
                  }`}
                >
                  Manage Class
                </button>
              </div>
            ))
          ) : (
            <p>No classes found for today.</p>
          )}
        </div>
      </div>

      {classes.length > 0 && (
        <button
          onClick={toggleFormVisibility}
          className="mb-4 px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
        >
          {isFormVisible ? "Hide" : "Show"} Class Details
        </button>
      )}

      {selectedClass && isFormVisible && (
        <div className="space-y-8">
          {/* Attendance Section */}
          <div className="p-6 bg-white shadow rounded-lg">
            <h3 className="text-lg font-medium mb-4">Attendance: {selectedClass.class_name}</h3>
            
            <div className="flex justify-between mb-4">
              <span className="text-gray-600">Mark attendance for today's session.</span>
              <button
                onClick={handleMarkAllPresent}
                className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
              >
                Mark All Present
              </button>
            </div>

            <ul className="space-y-2 mb-6 max-h-64 overflow-y-auto">
              {students.length > 0 ? (
                students.map((student) => (
                  <li
                    key={student._id}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded shadow-sm"
                  >
                    <div>
                      <span className="font-bold mr-2">{student.student_id_no}</span>
                      <span>{student.student_name}</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={attendance[student._id] === "Present"}
                      onChange={(e) => handleCheckboxChange(student._id, e.target.checked)}
                      className="w-5 h-5 accent-green-600"
                    />
                  </li>
                ))
              ) : (
                <li className="text-gray-500 italic">No students in this class.</li>
              )}
            </ul>

            <button
              onClick={handleMarkAttendance}
              className={`w-full py-2 rounded-lg text-white font-bold ${
                attendanceMarked ? "bg-green-600 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              }`}
              disabled={attendanceMarked}
            >
              {attendanceMarked ? "Attendance Submitted" : "Submit Attendance"}
            </button>
          </div>

          {/* Class Notes Section */}
          <div className="p-6 bg-white shadow rounded-lg">
             <h3 className="text-lg font-medium mb-4">Class Resources / Notes</h3>
             
             {/* Add Note Form */}
             <form onSubmit={handleAddNote} className="mb-6 p-4 bg-gray-50 rounded border">
               <h4 className="font-semibold mb-2">Add New Resource</h4>
               <div className="grid grid-cols-1 gap-3">
                 <input
                   type="text"
                   name="title"
                   placeholder="Title (e.g. Lecture 1 Slides)"
                   value={newNote.title}
                   onChange={handleNoteChange}
                   className="p-2 border rounded w-full"
                   required
                 />
                 <input
                   type="text"
                   name="description"
                   placeholder="Description (Optional)"
                   value={newNote.description}
                   onChange={handleNoteChange}
                   className="p-2 border rounded w-full"
                 />
                 <input
                   type="url"
                   name="file_url"
                   placeholder="Link (Google Drive, YouTube, etc.)"
                   value={newNote.file_url}
                   onChange={handleNoteChange}
                   className="p-2 border rounded w-full"
                   required
                 />
                 <button type="submit" className="bg-purple-600 text-white py-2 rounded hover:bg-purple-700">
                   Add Note
                 </button>
               </div>
             </form>

             {/* List Notes */}
             <div className="space-y-2">
                {notes.length > 0 ? (
                   notes.map(note => (
                     <div key={note._id} className="p-3 border rounded flex justify-between items-center bg-gray-50 hover:bg-white transition">
                        <div>
                           <h5 className="font-bold text-blue-800">{note.title}</h5>
                           <p className="text-sm text-gray-600">{note.description}</p>
                           <span className="text-xs text-gray-400">Added: {new Date(note.upload_date).toLocaleDateString()}</span>
                        </div>
                        <a 
                          href={note.file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-500 hover:underline text-sm font-semibold"
                        >
                          View Link
                        </a>
                     </div>
                   ))
                ) : (
                  <p className="text-gray-500 italic">No notes added yet for this class.</p>
                )}
             </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalVisible && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <h3 className="text-lg font-semibold text-green-600">Attendance Marked Successfully!</h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default FacultyDashboard;
