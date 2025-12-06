import { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../context/AuthContext";
import { HiOutlineLogout } from "react-icons/hi";

function StudentDashboard() {
  const { auth, logout } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [subjectAttendance, setSubjectAttendance] = useState([]);
  const [notes, setNotes] = useState({}); // { subjectId: [note1, note2] }
  const [loadingTimetable, setLoadingTimetable] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);

  useEffect(() => {
    if (!auth.studentId) return;

    const fetchTimetable = async () => {
      try {
        setLoadingTimetable(true);
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/student-dashboard/${auth.studentId}`
        );
        setTimetable(response.data.timetableData || []);
      } catch (err) {
        console.error("Error fetching timetable", err);
      } finally {
        setLoadingTimetable(false);
      }
    };

    const fetchAttendanceAndNotes = async () => {
      try {
        setLoadingAttendance(true);
        // Fetch Attendance (which now includes subject_offering_id)
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/attendance/${auth.studentId}`
        );
        const subjects = response.data.subjectAttendance || [];
        setSubjectAttendance(subjects);
        
        // Fetch Notes for each subject
        const notesData = {};
        await Promise.all(subjects.map(async (subj) => {
           try {
              if(!subj.subject_offering_id) return;
              const res = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/notes/${subj.subject_offering_id}`
              );
              notesData[subj.subject_offering_id] = res.data;
           } catch(e) {
             console.error(`Error fetching notes for ${subj.class_name}`, e);
           }
        }));
        setNotes(notesData);

      } catch (err) {
        console.error("Error fetching attendance", err);
      } finally {
        setLoadingAttendance(false);
      }
    };

    fetchTimetable();
    fetchAttendanceAndNotes();
  }, [auth.studentId]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-2xl font-bold text-center text-blue-600 mb-8">
        Student Dashboard
      </h1>

      <button
        onClick={logout}
        className="absolute top-4 right-4 p-2 rounded-full bg-blue-500 text-white hover:bg-blue-600 transition"
      >
        <HiOutlineLogout className="w-6 h-6" />
      </button>

      {/* Timetable Section */}
      <h2 className="text-xl font-semibold mb-4">Timetable for Today</h2>
      {loadingTimetable ? (
        <p>Loading timetable...</p>
      ) : timetable.length === 0 ? (
        <p className="text-center text-gray-600">No classes found for today.</p>
      ) : (
        <div className="space-y-4">
          {timetable.map((entry, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-4 bg-white shadow rounded-lg"
            >
              <div>
                <h3 className="text-lg font-medium">{entry.class_name}</h3>
                <p className="text-gray-600">{entry.class_code}</p>
                <p className="text-gray-600">Faculty: {entry.faculty_name}</p>
              </div>
              <p>
                Status:{" "}
                <span
                  className={`font-bold ${
                    entry.attendance_status === "Present"
                      ? "text-green-500"
                      : "text-red-500"
                  }`}
                >
                  {entry.attendance_status}
                </span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Attendance Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Attendance</h2>
      {loadingAttendance ? (
        <p>Loading attendance...</p>
      ) : subjectAttendance.length === 0 ? (
        <p className="text-center text-gray-600">
          No attendance records found.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 bg-white shadow-sm rounded-lg overflow-hidden">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-3 text-left">Class</th>
                <th className="border p-3 text-left">Code</th>
                <th className="border p-3 text-center">Present</th>
                <th className="border p-3 text-center">Absent</th>
                <th className="border p-3 text-center">Total</th>
                <th className="border p-3 text-center">Percentage</th>
              </tr>
            </thead>
            <tbody>
              {subjectAttendance.map((subject, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="border p-3 font-medium">{subject.class_name}</td>
                  <td className="border p-3">{subject.class_code}</td>
                  <td className="border p-3 text-center text-green-600 font-bold">{subject.present_count}</td>
                  <td className="border p-3 text-center text-red-600">{subject.total_count - subject.present_count}</td>
                  <td className="border p-3 text-center">{subject.total_count}</td>
                  <td className="border p-3 text-center font-bold">
                    {subject.percentage}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Class Notes Section */}
      <h2 className="text-xl font-semibold mt-8 mb-4">Class Resources / Notes</h2>
      <div className="space-y-6">
        {subjectAttendance.map((subject) => {
           const subjectNotes = notes[subject.subject_offering_id] || [];
           if (subjectNotes.length === 0) return null;
           
           return (
             <div key={subject.subject_offering_id} className="bg-white p-6 shadow rounded-lg">
                <h3 className="text-lg font-bold text-blue-700 mb-2">{subject.class_name} ({subject.class_code})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {subjectNotes.map(note => (
                    <a 
                      key={note._id} 
                      href={note.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block p-4 border rounded hover:shadow-md transition bg-gray-50"
                    >
                       <h4 className="font-semibold text-gray-800">{note.title}</h4>
                       {note.description && <p className="text-sm text-gray-600 mt-1">{note.description}</p>}
                       <p className="text-xs text-blue-500 mt-2">Added by {note.faculty_id?.name || 'Faculty'} on {new Date(note.upload_date).toLocaleDateString()}</p>
                    </a>
                  ))}
                </div>
             </div>
           );
        })}
        {Object.keys(notes).length === 0 && !loadingAttendance && (
           <p className="text-gray-500 italic">No resources available.</p>
        )}
      </div>

    </div>
  );
}

export default StudentDashboard;
