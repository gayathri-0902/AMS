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

  // Added state to track which dropdown is open
  const [openNotesIndex, setOpenNotesIndex] = useState(null);

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
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/attendance/${auth.studentId}`
        );
        const subjects = response.data.subjectAttendance || [];
        setSubjectAttendance(subjects);
        
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
          {(() => {
            const sortedTimetable = [...timetable].sort((a, b) => a.session_no - b.session_no);
            return sortedTimetable.map((entry, index) => {
              // Logic to find notes for this specific row
              const subjectInfo = subjectAttendance.find(s => s.class_code === entry.class_code);
              const subjectId = subjectInfo?.subject_offering_id;
              const subjectNotes = notes[subjectId] || [];

              return (
                <div key={index} className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="flex justify-between items-center p-5">
                    <div>
                      <h3 className="text-lg font-medium">{entry.class_name}</h3>
                      <p className="text-gray-600">{entry.class_code}</p>
                      <p className="text-gray-600">Faculty: {entry.faculty_name}</p>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="mb-3">
                        Status:{" "}
                        <span className={`font-bold ${entry.attendance_status === "Present" ? "text-green-500" : "text-red-500"}`}>
                          {entry.attendance_status}
                        </span>
                      </p>

                      {/* MEDIUM SIZED BUTTON WITH SPACE */}
                      <button
                        onClick={() => setOpenNotesIndex(openNotesIndex === index ? null : index)}
                        className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-md hover:bg-blue-700 transition shadow-sm text-sm"
                      >
                        {openNotesIndex === index ? "Close Notes ▲" : "View Notes ▼"}
                      </button>
                    </div>
                  </div>

                  {/* Dropdown area for notes */}
                  {openNotesIndex === index && (
                    <div className="bg-gray-50 border-t p-5">
                      <h4 className="font-bold text-gray-700 mb-3">Available Notes:</h4>
                      {subjectNotes.length > 0 ? (
                        <div className="grid grid-cols-1 gap-3">
                          {subjectNotes.map((note) => (
                            <a 
                              key={note._id} 
                              href={note.file_url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="block p-3 border rounded bg-white hover:border-blue-400 transition"
                            >
                              <p className="font-semibold text-gray-800">{note.title}</p>
                              {note.description && <p className="text-xs text-gray-500">{note.description}</p>}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 italic">No notes uploaded for this subject.</p>
                      )}
                    </div>
                  )}
                </div>
              );
            });
          })()}
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
    </div>
  );
}

export default StudentDashboard;
